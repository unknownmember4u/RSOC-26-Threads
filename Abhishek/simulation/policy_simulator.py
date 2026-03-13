"""
UrbanMind - Policy Simulator
===============================
Simulates the impact of urban policy changes (traffic reduction, green
transport, industrial restrictions, EV adoption) on city metrics by
applying scenario-specific deltas to district averages.
"""

from __future__ import annotations

import os
import sys
from typing import Any, Dict, List, Optional

import numpy as np
import pandas as pd

# Ensure project root is importable
sys.path.insert(0, os.path.normpath(os.path.join(os.path.dirname(__file__), "..")))


# AQI scale factor (normalised 0-1 -> real-world approximate)
AQI_SCALE = 300.0

# Metric keys used throughout
METRICS = ["traffic_density", "aqi", "transport_load", "consumption_kwh"]

# Recommendation templates per scenario
RECOMMENDATION_TEMPLATES = {
    "reduce_traffic": (
        "Reducing traffic by {pct}% in {dist} will lower AQI by ~{aqi_delta}% "
        "and ease transport load by ~{transport_delta}%. "
        "Recommend odd-even vehicle policy during peak hours 8-10 AM, 5-7 PM."
    ),
    "increase_green_transport": (
        "Increasing green transport by {pct}% in {dist} will reduce traffic "
        "by ~{traffic_delta}% and improve AQI by ~{aqi_delta}%. "
        "Recommend adding electric buses on overcrowded routes."
    ),
    "restrict_industry": (
        "Restricting industrial activity by {pct}% in {dist} will improve "
        "AQI by ~{aqi_delta}%. Recommend night-shift restrictions for "
        "heavy industries during high pollution forecasts."
    ),
    "increase_ev_adoption": (
        "Increasing EV adoption by {pct}% in {dist} will reduce traffic "
        "density by ~{traffic_delta}% and improve AQI by ~{aqi_delta}%. "
        "Note: energy demand increases slightly by ~{energy_delta}%."
    ),
}


class PolicySimulator:
    """Simulate urban policy scenarios and predict metric changes."""

    def __init__(
        self,
        traffic_model: Any = None,
        pollution_model: Any = None,
        data_path: Optional[str] = None,
    ) -> None:
        self.traffic_model = traffic_model
        self.pollution_model = pollution_model

        # Load data and precompute district averages
        if data_path is None:
            import config
            data_path = config.DATA_PATH

        self.df = pd.read_csv(data_path)
        self.district_averages = self._compute_district_averages()
        print(f"[ok] PolicySimulator: precomputed averages for {len(self.district_averages)} districts")

    # ------------------------------------------------------------------
    # Precompute
    # ------------------------------------------------------------------

    def _compute_district_averages(self) -> Dict[str, Dict[str, float]]:
        """Compute average metrics per district."""
        agg = self.df.groupby("district_id").agg({
            "traffic_density": "mean",
            "aqi": "mean",
            "consumption_kwh": "mean",
            "transport_load": "mean",
        })
        result = {}
        for did, row in agg.iterrows():
            result[did] = {
                "traffic_density": round(float(row["traffic_density"]), 4),
                "aqi": round(float(row["aqi"]) * AQI_SCALE, 1),  # rescale to real AQI
                "consumption_kwh": round(float(row["consumption_kwh"]), 1),
                "transport_load": round(float(row["transport_load"]), 4),
            }
        return result

    # ------------------------------------------------------------------
    # Simulate
    # ------------------------------------------------------------------

    def simulate(self, scenario: Dict[str, Any]) -> Dict[str, Any]:
        """Run a policy simulation scenario.

        Parameters
        ----------
        scenario : dict
            Must contain: district_id, change, percent.

        Returns
        -------
        dict
            Simulation result matching shared output schema.
        """
        district_id = scenario["district_id"]
        change = scenario["change"]
        percent = float(scenario.get("percent", 10))

        if district_id not in self.district_averages:
            # Generate deterministic fallback averages for unknown cities
            seed = sum(map(ord, district_id)) % 10000
            import numpy as np
            np.random.seed(seed)
            originals = {
                "traffic_density": round(float(np.random.uniform(0.4, 0.9)), 4),
                "aqi": round(float(np.random.uniform(80, 250)), 1),
                "consumption_kwh": round(float(np.random.uniform(2000, 4500)), 1),
                "transport_load": round(float(np.random.uniform(0.5, 0.95)), 4)
            }
        else:
            originals = dict(self.district_averages[district_id])
        simulated = dict(originals)

        # Apply scenario-specific deltas
        if change == "reduce_traffic":
            simulated["traffic_density"] = originals["traffic_density"] * (1 - percent / 100)
            # Pollution improves proportionally
            simulated["aqi"] = originals["aqi"] * (1 - percent / 100 * 0.5)
            # Transport eases
            simulated["transport_load"] = originals["transport_load"] - percent * 0.001

        elif change == "increase_green_transport":
            simulated["transport_load"] = originals["transport_load"] * (1 - percent / 100 * 0.3)
            simulated["traffic_density"] = originals["traffic_density"] * (1 - percent / 100 * 0.15)
            simulated["aqi"] = originals["aqi"] * (1 - percent / 100 * 0.3)

        elif change == "restrict_industry":
            simulated["aqi"] = originals["aqi"] * (1 - percent / 100 * 0.5)
            # Traffic unchanged

        elif change == "increase_ev_adoption":
            simulated["traffic_density"] = originals["traffic_density"] * (1 - percent / 100 * 0.2)
            simulated["aqi"] = originals["aqi"] * (1 - percent / 100 * 0.1)
            simulated["consumption_kwh"] = originals["consumption_kwh"] * (1 + percent / 100 * 0.05)

        else:
            raise ValueError(f"Unknown scenario: {change}")

        # Clip simulated values
        simulated["traffic_density"] = max(0, simulated["traffic_density"])
        simulated["transport_load"] = max(0, min(1, simulated["transport_load"]))
        simulated["aqi"] = max(0, simulated["aqi"])
        simulated["consumption_kwh"] = max(0, simulated["consumption_kwh"])

        # Round
        simulated = {k: round(v, 2) for k, v in simulated.items()}

        # Compute delta percentages
        delta_pct = {}
        for key in METRICS:
            orig = originals.get(key, 0)
            if orig != 0:
                delta_pct[key] = round(((simulated[key] - orig) / orig) * 100, 2)
            else:
                delta_pct[key] = 0.0

        # Build recommendation
        recommendation = self._build_recommendation(
            change, percent, district_id, delta_pct
        )

        return {
            "scenario": f"{change}_{int(percent)}pct",
            "district_id": district_id,
            "original_values": {k: round(v, 2) for k, v in originals.items()},
            "simulated_values": simulated,
            "delta_pct": delta_pct,
            "recommendation": recommendation,
        }

    # ------------------------------------------------------------------
    # Recommendation builder
    # ------------------------------------------------------------------

    @staticmethod
    def _build_recommendation(
        change: str,
        percent: float,
        district_id: str,
        delta_pct: Dict[str, float],
    ) -> str:
        """Generate a recommendation string from template."""
        template = RECOMMENDATION_TEMPLATES.get(change, "No recommendation available.")
        return template.format(
            pct=int(percent),
            dist=district_id,
            aqi_delta=abs(round(delta_pct.get("aqi", 0), 1)),
            traffic_delta=abs(round(delta_pct.get("traffic_density", 0), 1)),
            transport_delta=abs(round(delta_pct.get("transport_load", 0), 1)),
            energy_delta=abs(round(delta_pct.get("consumption_kwh", 0), 1)),
        )
