"""
ingestor.py — UrbanMind Smart City Analytics Platform
=====================================================
Ingestion layer for loading, merging and validating multi-source
urban datasets (CSV, JSON, REST API).

Classes:
    DataIngestor — Unified data ingestion with schema validation.

Usage:
    >>> ingestor = DataIngestor()
    >>> df = ingestor.load_csv("data/pollution.csv")
    >>> validated = ingestor.validate_schema(df, ["timestamp", "district_id", "aqi"])
"""

from __future__ import annotations

import json
import os
from datetime import datetime
from typing import Any, Dict, List, Optional

import httpx
import pandas as pd


class DataIngestor:
    """
    Unified data ingestion engine for the UrbanMind platform.

    Supports CSV files, JSON files, and REST API endpoints.
    Tracks ingestion metadata (last timestamp, row count) for
    status reporting via the companion FastAPI router.

    Attributes:
        last_ingestion_ts (Optional[str]):
            ISO-formatted timestamp of the most recent ingestion.
        last_row_count (int):
            Number of rows loaded in the most recent ingestion.
        last_columns (List[str]):
            Column names from the most recent ingestion.
        last_preview (List[dict]):
            First 5 rows (as dicts) from the most recent ingestion.
    """

    def __init__(self) -> None:
        self.last_ingestion_ts: Optional[str] = None
        self.last_row_count: int = 0
        self.last_columns: List[str] = []
        self.last_preview: List[dict] = []

    # ── internal helpers ────────────────────────────────────────────

    def _record_meta(self, df: pd.DataFrame) -> None:
        """Store metadata from the most recent successful ingestion."""
        self.last_ingestion_ts = datetime.utcnow().isoformat()
        self.last_row_count = len(df)
        self.last_columns = list(df.columns)
        self.last_preview = (
            df.head(5)
            .fillna("")
            .to_dict(orient="records")
        )

    # ── file-type detection ─────────────────────────────────────────

    @staticmethod
    def detect_file_type(filepath: str) -> str:
        """
        Determine whether a file is CSV or JSON based on its extension
        and, as a fallback, by inspecting the first non-blank character.

        Parameters:
            filepath: Absolute or relative path to the file.

        Returns:
            ``'csv'`` or ``'json'``.

        Raises:
            FileNotFoundError: If *filepath* does not exist.
            ValueError: If the format cannot be determined.
        """
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"File not found: {filepath}")

        ext = os.path.splitext(filepath)[1].lower().strip(".")

        # Handle double extensions like .csv.csv
        if ext in ("csv",):
            return "csv"
        if ext in ("json",):
            return "json"

        # Fallback: peek at file content
        with open(filepath, "r", encoding="utf-8", errors="replace") as fh:
            for line in fh:
                stripped = line.strip()
                if stripped:
                    if stripped.startswith(("{", "[")):
                        return "json"
                    return "csv"

        raise ValueError(
            f"Cannot determine file type for: {filepath}"
        )

    # ── CSV loading ─────────────────────────────────────────────────

    def load_csv(self, filepath: str) -> pd.DataFrame:
        """
        Load a CSV file into a DataFrame.

        Handles:
            • Auto-detection of delimiter (``,``, ``;``, ``\\t``, ``|``)
            • Multiple encodings (utf-8 → latin-1 → cp1252)
            • Whitespace-stripped column names

        Parameters:
            filepath: Path to the CSV file.

        Returns:
            A cleaned ``pd.DataFrame``.

        Raises:
            FileNotFoundError: If *filepath* does not exist.
            ValueError: If decoding fails with all supported encodings.
        """
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"File not found: {filepath}")

        delimiter = self._detect_delimiter(filepath)

        for enc in ("utf-8", "latin-1", "cp1252"):
            try:
                df = pd.read_csv(filepath, delimiter=delimiter, encoding=enc)
                break
            except UnicodeDecodeError:
                continue
        else:
            raise ValueError(
                f"Could not decode {filepath} with any supported encoding"
            )

        df.columns = df.columns.str.strip()
        self._record_meta(df)
        return df

    @staticmethod
    def _detect_delimiter(filepath: str, n_lines: int = 5) -> str:
        """Sniff the first *n_lines* to choose the most likely delimiter."""
        with open(filepath, "r", encoding="utf-8", errors="replace") as fh:
            sample = "".join(fh.readline() for _ in range(n_lines))
        for delim in (",", ";", "\t", "|"):
            if delim in sample:
                return delim
        return ","

    # ── JSON loading ────────────────────────────────────────────────

    def load_json(self, filepath: str) -> pd.DataFrame:
        """
        Load a JSON file into a DataFrame.

        Accepts:
            • A JSON array of records ``[{…}, {…}]``
            • A JSON object with a ``"data"`` key containing an array

        Parameters:
            filepath: Path to the JSON file.

        Returns:
            A ``pd.DataFrame`` built from the records.

        Raises:
            FileNotFoundError: If *filepath* does not exist.
            ValueError: If the JSON structure is not recognised.
        """
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"File not found: {filepath}")

        with open(filepath, "r", encoding="utf-8") as fh:
            data = json.load(fh)

        if isinstance(data, list):
            df = pd.DataFrame(data)
        elif isinstance(data, dict):
            # Try common wrapper keys
            for key in ("data", "records", "results", "rows"):
                if key in data and isinstance(data[key], list):
                    df = pd.DataFrame(data[key])
                    break
            else:
                # Single-level dict → one-row DataFrame
                df = pd.DataFrame([data])
        else:
            raise ValueError(
                f"Unsupported JSON structure in {filepath}"
            )

        df.columns = df.columns.str.strip()
        self._record_meta(df)
        return df

    # ── REST API loading ────────────────────────────────────────────

    def load_api(
        self,
        url: str,
        params: Optional[Dict[str, Any]] = None,
    ) -> pd.DataFrame:
        """
        Fetch data from a REST API endpoint and return as DataFrame.

        Parameters:
            url:    Full URL of the API endpoint.
            params: Optional query-string parameters.

        Returns:
            A ``pd.DataFrame`` parsed from the JSON response.

        Raises:
            httpx.HTTPStatusError: On 4xx / 5xx responses.
            httpx.TimeoutException: If the request times out (30 s).
            ValueError: If the response body cannot be parsed.
        """
        try:
            with httpx.Client(timeout=30.0) as client:
                response = client.get(url, params=params or {})
                response.raise_for_status()
        except httpx.TimeoutException:
            raise httpx.TimeoutException(
                f"Request to {url} timed out after 30 s"
            )
        except httpx.HTTPStatusError as exc:
            raise httpx.HTTPStatusError(
                f"HTTP {exc.response.status_code} from {url}: "
                f"{exc.response.text[:200]}",
                request=exc.request,
                response=exc.response,
            )

        data = response.json()

        if isinstance(data, list):
            df = pd.DataFrame(data)
        elif isinstance(data, dict):
            for key in ("data", "records", "results", "rows"):
                if key in data and isinstance(data[key], list):
                    df = pd.DataFrame(data[key])
                    break
            else:
                df = pd.DataFrame([data])
        else:
            raise ValueError(f"Unexpected JSON shape from {url}")

        df.columns = df.columns.str.strip()
        self._record_meta(df)
        return df

    # ── dataset merging ─────────────────────────────────────────────

    @staticmethod
    def merge_datasets(
        dataframes: List[pd.DataFrame],
        on: Optional[List[str]] = None,
    ) -> pd.DataFrame:
        """
        Merge a list of DataFrames on shared key columns.

        Parameters:
            dataframes: Two or more DataFrames to merge.
            on:         Columns to join on (default:
                        ``['timestamp', 'district_id']``).

        Returns:
            A single merged ``pd.DataFrame`` (outer join; gaps → NaN).

        Raises:
            ValueError: If fewer than two DataFrames are supplied.
        """
        if on is None:
            on = ["timestamp", "district_id"]

        if len(dataframes) < 2:
            raise ValueError(
                "merge_datasets requires at least 2 DataFrames"
            )

        merged = dataframes[0]
        for df in dataframes[1:]:
            merged = merged.merge(df, on=on, how="outer")

        merged = merged.sort_values(on).reset_index(drop=True)
        return merged

    # ── schema validation ───────────────────────────────────────────

    @staticmethod
    def validate_schema(
        df: pd.DataFrame,
        required_cols: List[str],
    ) -> bool:
        """
        Check that *df* contains every column in *required_cols*.

        Parameters:
            df:            DataFrame to inspect.
            required_cols: Column names that must be present.

        Returns:
            ``True`` if all columns are present.

        Raises:
            ValueError: Lists missing column names in the message.
        """
        missing = [c for c in required_cols if c not in df.columns]
        if missing:
            raise ValueError(
                f"Missing required columns: {missing}"
            )
        return True
