"""
iot_simulator.py — UrbanMind Smart City Analytics Platform
===========================================================
Real-time IoT data simulator that generates realistic sensor
readings for all 10 Pune districts using a correlated random-walk
model with anomaly spike injection.

Classes:
    IoTSimulator — Generates and streams district-level readings.

Usage:
    >>> sim = IoTSimulator(districts=["D01","D02"], interval_seconds=5)
    >>> reading = sim.generate_reading("D01")
    >>> sim.start_streaming(callback_fn=print)
"""

from __future__ import annotations

import random
import threading
import time
from datetime import datetime
from typing import Any, Callable, Dict, List, Optional

# ── District coordinate lookup ──────────────────────────────────────
DISTRICT_META: Dict[str, Dict[str, Any]] = {
    "D01": {"name": "Shivajinagar",  "lat": 18.5308, "lng": 73.8474},
    "D02": {"name": "Kothrud",       "lat": 18.5074, "lng": 73.8077},
    "D03": {"name": "Hadapsar",      "lat": 18.5018, "lng": 73.9252},
    "D04": {"name": "Wakad",         "lat": 18.5984, "lng": 73.7611},
    "D05": {"name": "Pimpri",        "lat": 18.6279, "lng": 73.8009},
    "D06": {"name": "Baner",         "lat": 18.5590, "lng": 73.7868},
    "D07": {"name": "Magarpatta",    "lat": 18.5089, "lng": 73.9259},
    "D08": {"name": "Kharadi",       "lat": 18.5497, "lng": 73.9397},
    "D09": {"name": "Viman Nagar",   "lat": 18.5679, "lng": 73.9143},
    "D10": {"name": "Swargate",      "lat": 18.5018, "lng": 73.8636},
}

# Spike probability per reading
_SPIKE_PROB = 0.03

# Baseline ranges for seeding the random walk
_BASELINES: Dict[str, tuple[float, float]] = {
    "traffic_density":   (0.30, 0.70),
    "aqi":               (60,   160),
    "energy_kwh":        (800,  2500),
    "water_liters":      (8000, 18000),
    "transport_load":    (0.25, 0.75),
    "waste_kg":          (200,  500),
    "weather_temp":      (24,   36),
    "weather_humidity":  (40,   75),
}

# Spike thresholds and spike values
_SPIKE_VALUES: Dict[str, float] = {
    "aqi":              random.uniform(220, 350),
    "traffic_density":  random.uniform(0.96, 1.0),
    "energy_kwh":       random.uniform(5200, 7000),
}


class IoTSimulator:
    """
    Generates realistic IoT sensor readings for Pune districts.

    Each call to :meth:`generate_reading` returns a dict matching the
    shared output schema.  Values evolve via a bounded random walk
    (±5 % of current value) so successive readings are correlated.
    With 3 % probability a *spike anomaly* is injected.

    Parameters:
        districts:        List of district IDs (e.g. ``["D01", …, "D10"]``).
        interval_seconds: Seconds between readings when streaming.
    """

    def __init__(
        self,
        districts: Optional[List[str]] = None,
        interval_seconds: int = 5,
    ) -> None:
        self.districts = districts or list(DISTRICT_META.keys())
        self.interval = interval_seconds
        self._running = False
        self._thread: Optional[threading.Thread] = None

        # Current state per district (seeded on first call)
        self._state: Dict[str, Dict[str, float]] = {}
        for did in self.districts:
            self._state[did] = {
                k: random.uniform(*v) for k, v in _BASELINES.items()
            }

    # ── single reading ──────────────────────────────────────────────

    def generate_reading(self, district_id: str) -> Dict[str, Any]:
        """
        Produce one sensor reading for *district_id*.

        The reading matches the shared UrbanMind output schema::

            { timestamp, district_id, traffic_density, aqi, energy_kwh,
              water_liters, transport_load, waste_kg,
              weather_temp, weather_humidity, lat, lng }

        Returns:
            Dict with all fields populated.
        """
        if district_id not in self._state:
            self._state[district_id] = {
                k: random.uniform(*v) for k, v in _BASELINES.items()
            }

        state = self._state[district_id]
        meta = DISTRICT_META.get(district_id, {"lat": 0, "lng": 0})
        is_spike = random.random() < _SPIKE_PROB

        # Random-walk each metric ±5 %
        new_state: Dict[str, float] = {}
        for key, val in state.items():
            lo, hi = _BASELINES[key]
            delta = val * random.uniform(-0.05, 0.05)
            new_val = val + delta
            new_val = max(lo * 0.5, min(hi * 1.5, new_val))  # soft bounds
            new_state[key] = round(new_val, 2)

        # Inject spike anomalies (3 % probability)
        spike_fields: List[str] = []
        if is_spike:
            spike_key = random.choice(list(_SPIKE_VALUES.keys()))
            new_state[spike_key] = round(
                _SPIKE_VALUES[spike_key]
                if isinstance(_SPIKE_VALUES[spike_key], float)
                else random.uniform(
                    _SPIKE_VALUES[spike_key] * 0.9,
                    _SPIKE_VALUES[spike_key] * 1.1,
                ),
                2,
            )
            spike_fields.append(spike_key)

        self._state[district_id] = new_state

        reading = {
            "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
            "district_id": district_id,
            **new_state,
            "lat": meta["lat"],
            "lng": meta["lng"],
            "_spike": bool(spike_fields),
            "_spike_fields": spike_fields,
        }
        return reading

    # ── streaming ───────────────────────────────────────────────────

    def start_streaming(
        self,
        callback_fn: Callable[[Dict[str, Any]], None],
    ) -> None:
        """
        Begin streaming readings in a background daemon thread.

        Every *interval_seconds* a reading is generated for **each**
        district and passed to *callback_fn*.

        Parameters:
            callback_fn: Called with each reading dict.
        """
        if self._running:
            return

        self._running = True

        def _loop() -> None:
            while self._running:
                for did in self.districts:
                    reading = self.generate_reading(did)
                    try:
                        callback_fn(reading)
                    except Exception:
                        pass
                time.sleep(self.interval)

        self._thread = threading.Thread(target=_loop, daemon=True)
        self._thread.start()

    def stop_streaming(self) -> None:
        """Signal the background thread to stop."""
        self._running = False
        if self._thread:
            self._thread.join(timeout=self.interval + 1)
