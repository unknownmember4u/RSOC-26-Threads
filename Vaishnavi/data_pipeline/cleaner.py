"""
cleaner.py — UrbanMind Smart City Analytics Platform
=====================================================
Data-cleaning pipeline that prepares raw ingested data for feature
engineering and model training.

Classes:
    DataCleaner — Six-step cleaning pipeline with MinMax normalisation
                  and exportable scaler parameters (``scalers.json``).

Usage:
    >>> cleaner = DataCleaner()
    >>> cleaned = cleaner.clean(raw_df)
    # scaler params auto-saved to scalers.json in the working directory
"""

from __future__ import annotations

import json
import logging
import os
from typing import Any, Dict, Optional

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)


class DataCleaner:
    """
    Six-step data-cleaning pipeline for UrbanMind datasets.

    Steps (applied in order by :meth:`clean`):
        1. Parse ``timestamp`` to datetime
        2. Fill missing numeric values with column median
        3. Fill missing categorical values with column mode
        4. Remove duplicate rows
        5. Clip outliers beyond mean ± 3σ → replace with median
        6. MinMax-scale all numeric columns to [0, 1] and persist
           scaler params to ``scalers.json``

    Attributes:
        scaler_params (dict):
            ``{column: {"min": …, "max": …}}`` written after step 6.
        scaler_path (str):
            Filesystem path where ``scalers.json`` is saved.
    """

    def __init__(self, scaler_path: str = "scalers.json") -> None:
        self.scaler_params: Dict[str, Dict[str, float]] = {}
        self.scaler_path: str = scaler_path

    # ── public entry point ──────────────────────────────────────────

    def clean(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Run the full six-step cleaning pipeline.

        Parameters:
            df: Raw DataFrame (must contain a ``timestamp`` column).

        Returns:
            Cleaned and normalised DataFrame.
        """
        logger.info(
            "▸ Cleaning started — %d rows × %d cols", len(df), len(df.columns)
        )

        df = self._step1_parse_timestamp(df)
        df = self._step2_fill_numeric(df)
        df = self._step3_fill_categorical(df)
        df = self._step4_deduplicate(df)
        df = self._step5_clip_outliers(df)
        df = self._step6_normalize(df)

        logger.info(
            "✅ Cleaning finished — %d rows × %d cols", len(df), len(df.columns)
        )
        return df

    # ── step 1 ──────────────────────────────────────────────────────

    def _step1_parse_timestamp(self, df: pd.DataFrame) -> pd.DataFrame:
        """Parse the ``timestamp`` column to ``datetime64``."""
        if "timestamp" in df.columns:
            df["timestamp"] = pd.to_datetime(
                df["timestamp"], errors="coerce", infer_datetime_format=True
            )
            na_count = df["timestamp"].isna().sum()
            if na_count:
                logger.warning(
                    "  Step 1: %d unparseable timestamps coerced to NaT", na_count
                )
        else:
            logger.warning("  Step 1: 'timestamp' column not found — skipped")

        logger.info("  Step 1 — parse timestamp → %d rows", len(df))
        return df

    # ── step 2 ──────────────────────────────────────────────────────

    def _step2_fill_numeric(self, df: pd.DataFrame) -> pd.DataFrame:
        """Fill missing numeric values with the column median."""
        num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        filled = 0
        for col in num_cols:
            n_miss = df[col].isna().sum()
            if n_miss:
                median_val = df[col].median()
                df[col] = df[col].fillna(median_val)
                filled += n_miss

        logger.info(
            "  Step 2 — fill numeric NaN (median) → %d cells filled, %d rows",
            filled,
            len(df),
        )
        return df

    # ── step 3 ──────────────────────────────────────────────────────

    def _step3_fill_categorical(self, df: pd.DataFrame) -> pd.DataFrame:
        """Fill missing categorical / object values with the column mode."""
        cat_cols = df.select_dtypes(
            include=["object", "category", "bool"]
        ).columns.tolist()
        filled = 0
        for col in cat_cols:
            n_miss = df[col].isna().sum()
            if n_miss:
                mode_val = df[col].mode()
                if not mode_val.empty:
                    df[col] = df[col].fillna(mode_val.iloc[0])
                    filled += n_miss

        logger.info(
            "  Step 3 — fill categorical NaN (mode) → %d cells filled, %d rows",
            filled,
            len(df),
        )
        return df

    # ── step 4 ──────────────────────────────────────────────────────

    def _step4_deduplicate(self, df: pd.DataFrame) -> pd.DataFrame:
        """Remove duplicate rows, keeping the first occurrence."""
        before = len(df)
        df = df.drop_duplicates().reset_index(drop=True)
        dropped = before - len(df)
        logger.info(
            "  Step 4 — deduplicate → %d duplicates removed, %d rows remain",
            dropped,
            len(df),
        )
        return df

    # ── step 5 ──────────────────────────────────────────────────────

    def _step5_clip_outliers(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Clip outliers: values beyond mean ± 3·std are replaced
        with the column median.
        """
        num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        clipped_total = 0
        for col in num_cols:
            mean = df[col].mean()
            std = df[col].std()
            if std == 0 or np.isnan(std):
                continue
            median_val = df[col].median()
            lower = mean - 3 * std
            upper = mean + 3 * std
            outlier_mask = (df[col] < lower) | (df[col] > upper)
            n_outliers = outlier_mask.sum()
            if n_outliers:
                df.loc[outlier_mask, col] = median_val
                clipped_total += n_outliers

        logger.info(
            "  Step 5 — clip outliers (±3σ → median) → %d values clipped, %d rows",
            clipped_total,
            len(df),
        )
        return df

    # ── step 6 ──────────────────────────────────────────────────────

    def _step6_normalize(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        MinMax-scale every numeric column to [0, 1].
        Saves ``{col: {"min": …, "max": …}}`` to :attr:`scaler_path`.
        """
        num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        self.scaler_params = {}

        for col in num_cols:
            col_min = float(df[col].min())
            col_max = float(df[col].max())
            self.scaler_params[col] = {"min": col_min, "max": col_max}
            denom = col_max - col_min
            if denom == 0:
                df[col] = 0.0
            else:
                df[col] = (df[col] - col_min) / denom

        # Persist scaler params for inverse-transform later
        with open(self.scaler_path, "w", encoding="utf-8") as fh:
            json.dump(self.scaler_params, fh, indent=2)

        logger.info(
            "  Step 6 — MinMax normalise → %d cols scaled, params → %s, %d rows",
            len(num_cols),
            self.scaler_path,
            len(df),
        )
        return df

    # ── inverse transform helper ────────────────────────────────────

    def inverse_transform(
        self,
        df: pd.DataFrame,
        scaler_json: Optional[str] = None,
    ) -> pd.DataFrame:
        """
        Reverse the MinMax scaling applied in step 6.

        Parameters:
            df:           Normalised DataFrame.
            scaler_json:  Path to the saved ``scalers.json``.
                          Defaults to :attr:`scaler_path`.

        Returns:
            DataFrame with original-scale numeric values restored.
        """
        path = scaler_json or self.scaler_path
        with open(path, "r", encoding="utf-8") as fh:
            params: Dict[str, Dict[str, float]] = json.load(fh)

        for col, p in params.items():
            if col in df.columns:
                df[col] = df[col] * (p["max"] - p["min"]) + p["min"]

        return df
