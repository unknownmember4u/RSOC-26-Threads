"""
ingest_router.py — UrbanMind Smart City Analytics Platform
==========================================================
FastAPI router exposing three ingestion endpoints:

    POST /api/ingest/upload       – Upload a CSV or JSON file
    POST /api/ingest/api-source   – Pull data from a remote REST API
    GET  /api/ingest/status       – Last ingestion timestamp & row count

All mutation endpoints return a unified response:
    {
        "status":      "success",
        "rows_loaded": 1440,
        "columns":     ["timestamp", "district_id", …],
        "preview":     [ {row1}, {row2}, … ]   # first 5 rows
    }

Dependencies: fastapi, python-multipart, pandas, httpx
"""

from __future__ import annotations

import os
import tempfile
from typing import Any, Dict, List, Optional

import pandas as pd
from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel, Field

# ── import the shared ingestor instance ─────────────────────────────
import sys

sys.path.insert(
    0,
    os.path.join(os.path.dirname(__file__), ".."),
)
from data_pipeline.ingestor import DataIngestor

# Singleton so that /status reflects the latest call from any endpoint.
_ingestor = DataIngestor()

router = APIRouter(prefix="/api/ingest", tags=["Ingestion"])


# ── Pydantic models ────────────────────────────────────────────────

class IngestResponse(BaseModel):
    """Standard response returned by every ingestion endpoint."""

    status: str = Field(
        ..., description="'success' or 'error'"
    )
    rows_loaded: int = Field(
        ..., description="Number of rows ingested"
    )
    columns: List[str] = Field(
        ..., description="Column names present in the dataset"
    )
    preview: List[Dict[str, Any]] = Field(
        ..., description="First 5 rows as list of dicts"
    )


class ApiSourceRequest(BaseModel):
    """Body schema for the ``/api-source`` endpoint."""

    url: str = Field(
        ..., description="URL of the remote API to fetch data from"
    )
    params: Optional[Dict[str, str]] = Field(
        default=None,
        description="Optional query-string parameters",
    )


class StatusResponse(BaseModel):
    """Response schema for the ``/status`` endpoint."""

    last_ingestion_ts: Optional[str] = Field(
        None,
        description="ISO timestamp of the last successful ingestion",
    )
    rows_loaded: int = Field(
        0, description="Row count from the last ingestion"
    )
    columns: List[str] = Field(
        default_factory=list,
        description="Columns from the last ingestion",
    )


# ── helper ──────────────────────────────────────────────────────────

def _build_response(df: pd.DataFrame) -> IngestResponse:
    """Create a uniform ``IngestResponse`` from a DataFrame."""
    preview = (
        df.head(5)
        .fillna("")
        .to_dict(orient="records")
    )
    return IngestResponse(
        status="success",
        rows_loaded=len(df),
        columns=list(df.columns),
        preview=preview,
    )


# ── POST /api/ingest/upload ────────────────────────────────────────

@router.post(
    "/upload",
    response_model=IngestResponse,
    summary="Upload a CSV or JSON file",
    description=(
        "Accepts a file upload (CSV or JSON), auto-detects the format, "
        "and returns the ingested data summary with a 5-row preview."
    ),
)
async def upload_file(file: UploadFile = File(...)) -> IngestResponse:
    """
    Ingest a user-uploaded CSV or JSON file.

    Parameters:
        file: The uploaded file (multipart/form-data).

    Returns:
        IngestResponse with status, row count, columns and preview.

    Raises:
        HTTPException 400: If the file type is unsupported or parsing fails.
    """
    # Persist to a temp file so pandas / json can read it
    suffix = os.path.splitext(file.filename or "")[1] or ".csv"
    try:
        with tempfile.NamedTemporaryFile(
            delete=False, suffix=suffix
        ) as tmp:
            contents = await file.read()
            tmp.write(contents)
            tmp_path = tmp.name
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to read uploaded file: {exc}",
        )

    try:
        file_type = _ingestor.detect_file_type(tmp_path)
        if file_type == "csv":
            df = _ingestor.load_csv(tmp_path)
        elif file_type == "json":
            df = _ingestor.load_json(tmp_path)
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type: {file_type}",
            )
    except (ValueError, FileNotFoundError) as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    finally:
        os.unlink(tmp_path)

    return _build_response(df)


# ── POST /api/ingest/api-source ────────────────────────────────────

@router.post(
    "/api-source",
    response_model=IngestResponse,
    summary="Ingest data from a remote API",
    description=(
        "Fetch JSON data from the specified URL (with optional query "
        "params) and return the ingested data summary."
    ),
)
async def ingest_from_api(body: ApiSourceRequest) -> IngestResponse:
    """
    Pull data from an external REST API.

    Parameters:
        body: JSON body containing ``url`` and optional ``params``.

    Returns:
        IngestResponse with status, row count, columns and preview.

    Raises:
        HTTPException 502: If the remote API returns an error.
        HTTPException 504: If the request times out.
    """
    try:
        df = _ingestor.load_api(body.url, body.params)
    except Exception as exc:
        # Map upstream errors to appropriate HTTP codes
        exc_name = type(exc).__name__
        if "Timeout" in exc_name:
            raise HTTPException(status_code=504, detail=str(exc))
        if "HTTPStatus" in exc_name:
            raise HTTPException(status_code=502, detail=str(exc))
        raise HTTPException(status_code=502, detail=str(exc))

    return _build_response(df)


# ── GET /api/ingest/status ─────────────────────────────────────────

@router.get(
    "/status",
    response_model=StatusResponse,
    summary="Last ingestion status",
    description=(
        "Returns the timestamp and row count of the most recent "
        "successful ingestion (from any endpoint)."
    ),
)
async def ingestion_status() -> StatusResponse:
    """
    Report metadata from the last successful ingestion.

    Returns:
        StatusResponse with timestamp, row count, and column list.
    """
    return StatusResponse(
        last_ingestion_ts=_ingestor.last_ingestion_ts,
        rows_loaded=_ingestor.last_row_count,
        columns=_ingestor.last_columns,
    )
