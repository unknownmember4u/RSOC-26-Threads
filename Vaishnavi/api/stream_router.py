"""
stream_router.py — UrbanMind Smart City Analytics Platform
===========================================================
FastAPI router for real-time IoT data streaming.

Endpoints:
    GET /api/stream/latest  — Last reading per district (10 records)
    GET /api/stream/live    — SSE endpoint streaming readings every 5 s

Dependencies: fastapi, sse-starlette
"""

from __future__ import annotations

import asyncio
import json
import os
import sys
from datetime import datetime
from typing import Any, Dict, List

from fastapi import APIRouter
from fastapi.responses import JSONResponse

# ── project imports ─────────────────────────────────────────────────
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from simulator.iot_simulator import IoTSimulator

router = APIRouter(prefix="/api/stream", tags=["Live Streaming"])

# ── shared simulator instance ──────────────────────────────────────
_sim = IoTSimulator(interval_seconds=5)
_latest: Dict[str, Dict[str, Any]] = {}
_streaming_started = False


def _on_reading(reading: Dict[str, Any]) -> None:
    """Internal callback that updates the latest-reading cache."""
    _latest[reading["district_id"]] = reading


def _ensure_streaming() -> None:
    """Start the background simulator if it isn't running yet."""
    global _streaming_started
    if not _streaming_started:
        _sim.start_streaming(callback_fn=_on_reading)
        _streaming_started = True


# ── GET /api/stream/latest ──────────────────────────────────────────

@router.get(
    "/latest",
    summary="Latest reading per district",
    description=(
        "Returns the most recent IoT reading for each of the 10 "
        "Pune districts.  If the simulator has not yet produced a "
        "reading for a district, that district is omitted."
    ),
)
async def get_latest() -> JSONResponse:
    """
    Return the last reading per district (up to 10 records).

    Returns:
        JSON list of reading dicts, one per district.
    """
    _ensure_streaming()

    # Give the simulator a moment to seed if this is the first call
    if not _latest:
        await asyncio.sleep(1)

    # Strip internal keys before returning
    records = []
    for did in sorted(_latest.keys()):
        rec = {k: v for k, v in _latest[did].items() if not k.startswith("_")}
        records.append(rec)

    return JSONResponse(content=records)


# ── GET /api/stream/live (SSE) ──────────────────────────────────────

@router.get(
    "/live",
    summary="Live SSE stream",
    description=(
        "Server-Sent Events endpoint that pushes a new reading for "
        "every district every ~5 seconds.  Connect with an EventSource "
        "client or ``curl -N``."
    ),
)
async def live_stream():
    """
    Stream real-time IoT readings as Server-Sent Events.

    Each event payload is a JSON array of 10 district readings.
    """
    _ensure_streaming()

    try:
        from sse_starlette.sse import EventSourceResponse
    except ImportError:
        return JSONResponse(
            status_code=501,
            content={
                "error": "sse-starlette not installed. "
                         "Install with: pip install sse-starlette"
            },
        )

    async def _event_generator():
        """Yield SSE data every interval."""
        while True:
            await asyncio.sleep(_sim.interval)
            records = []
            for did in sorted(_latest.keys()):
                rec = {
                    k: v for k, v in _latest[did].items()
                    if not k.startswith("_")
                }
                records.append(rec)
            if records:
                yield {
                    "event": "reading",
                    "data": json.dumps(records, default=str),
                }

    return EventSourceResponse(_event_generator())
