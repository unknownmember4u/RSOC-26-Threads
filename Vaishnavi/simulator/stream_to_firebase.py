"""
stream_to_firebase.py — UrbanMind Smart City Analytics Platform
================================================================
Bridges the IoT simulator to Firestore (``live_data`` collection)
and maintains a local append-only JSONL buffer for offline replay.

Usage:
    python stream_to_firebase.py                   # default 5 s interval
    python stream_to_firebase.py --interval 10     # 10 s interval
    python stream_to_firebase.py --local-only      # skip Firestore upload

Console output:
    [14:32:05] D03 → AQI: 178  traffic: 0.64  energy: 1823 kWh
    [14:32:05] D07 → AQI: 245 ⚠ SPIKE  traffic: 0.97 ⚠ SPIKE
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import sys
from datetime import datetime
from typing import Any, Dict, Optional

# ── Resolve paths ───────────────────────────────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
sys.path.insert(0, PROJECT_DIR)

from simulator.iot_simulator import IoTSimulator

BUFFER_PATH = os.path.join(SCRIPT_DIR, "live_buffer.jsonl")
BUFFER_MAX_LINES = 1000
CREDENTIALS = os.path.join(PROJECT_DIR, "firebase_credentials.json")

logging.basicConfig(
    level=logging.INFO,
    format="%(message)s",
)
logger = logging.getLogger(__name__)

# ── globals ─────────────────────────────────────────────────────────
_firestore_db = None
_buffer_line_count = 0


def _init_firestore() -> Optional[Any]:
    """Initialise Firestore client (returns None if unavailable)."""
    try:
        import firebase_admin
        from firebase_admin import credentials, firestore

        if not firebase_admin._apps:
            cred = credentials.Certificate(CREDENTIALS)
            firebase_admin.initialize_app(cred)
        return firestore.client()
    except Exception as exc:
        logger.warning("⚠ Firestore unavailable: %s", exc)
        return None


def _rotate_buffer() -> None:
    """If the JSONL buffer exceeds BUFFER_MAX_LINES, truncate to last half."""
    global _buffer_line_count
    if not os.path.exists(BUFFER_PATH):
        _buffer_line_count = 0
        return
    with open(BUFFER_PATH, "r", encoding="utf-8") as fh:
        lines = fh.readlines()
    if len(lines) >= BUFFER_MAX_LINES:
        keep = lines[len(lines) // 2 :]
        with open(BUFFER_PATH, "w", encoding="utf-8") as fh:
            fh.writelines(keep)
        _buffer_line_count = len(keep)
    else:
        _buffer_line_count = len(lines)


def _append_to_buffer(reading: Dict[str, Any]) -> None:
    """Append a reading to the JSONL buffer, rotating if full."""
    global _buffer_line_count
    if _buffer_line_count >= BUFFER_MAX_LINES:
        _rotate_buffer()
    with open(BUFFER_PATH, "a", encoding="utf-8") as fh:
        fh.write(json.dumps(reading, default=str) + "\n")
    _buffer_line_count += 1


def _upload_to_firestore(reading: Dict[str, Any]) -> None:
    """Upload a single reading to Firestore ``live_data`` collection."""
    global _firestore_db
    if _firestore_db is None:
        return
    try:
        doc_id = f"{reading['district_id']}_{reading['timestamp'].replace(' ', 'T')}"
        # Strip internal keys
        payload = {k: v for k, v in reading.items() if not k.startswith("_")}
        _firestore_db.collection("live_data").document(doc_id).set(payload)
    except Exception as exc:
        logger.debug("Firestore write failed: %s", exc)


def _format_log(reading: Dict[str, Any]) -> str:
    """Pretty-print a reading for console output."""
    ts = datetime.utcnow().strftime("%H:%M:%S")
    did = reading["district_id"]
    aqi = reading.get("aqi", 0)
    td = reading.get("traffic_density", 0)
    ekw = reading.get("energy_kwh", 0)

    parts = [f"[{ts}] {did} →"]
    spike_fields = reading.get("_spike_fields", [])

    aqi_str = f"AQI: {aqi:.0f}"
    if "aqi" in spike_fields:
        aqi_str += " ⚠ SPIKE"
    parts.append(aqi_str)

    td_str = f"traffic: {td:.2f}"
    if "traffic_density" in spike_fields:
        td_str += " ⚠ SPIKE"
    parts.append(td_str)

    ekw_str = f"energy: {ekw:.0f} kWh"
    if "energy_kwh" in spike_fields:
        ekw_str += " ⚠ SPIKE"
    parts.append(ekw_str)

    return "  ".join(parts)


def on_reading(reading: Dict[str, Any]) -> None:
    """Callback invoked for every IoT reading."""
    # Console log
    logger.info(_format_log(reading))
    # Local buffer
    _append_to_buffer(reading)
    # Firestore
    _upload_to_firestore(reading)


# ── main ────────────────────────────────────────────────────────────

def main() -> None:
    global _firestore_db

    parser = argparse.ArgumentParser(
        description="UrbanMind — stream IoT readings to Firestore + local buffer"
    )
    parser.add_argument(
        "--interval", type=int, default=5,
        help="Seconds between reading batches (default: 5)",
    )
    parser.add_argument(
        "--local-only", action="store_true",
        help="Skip Firestore upload, write only to live_buffer.jsonl",
    )
    args = parser.parse_args()

    # Init buffer
    _rotate_buffer()

    # Init Firestore
    if not args.local_only:
        _firestore_db = _init_firestore()
        if _firestore_db:
            logger.info("✅ Firestore connected — streaming to 'live_data'")
    else:
        logger.info("ℹ️  Local-only mode — no Firestore upload")

    logger.info("🚀 Starting IoT simulator (interval=%ds)…\n", args.interval)

    sim = IoTSimulator(interval_seconds=args.interval)

    try:
        sim.start_streaming(callback_fn=on_reading)
        # Keep main thread alive
        while True:
            import time
            time.sleep(1)
    except KeyboardInterrupt:
        logger.info("\n⏹ Stopping simulator…")
        sim.stop_streaming()
        logger.info("✅ Stopped. Buffer at: %s", BUFFER_PATH)


if __name__ == "__main__":
    main()
