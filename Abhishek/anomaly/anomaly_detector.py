"""
UrbanMind - Anomaly Detector
==============================
Detects anomalous readings across city metrics using Isolation Forest
combined with rule-based threshold checks. Severity escalates when both
methods flag the same row.
"""

from __future__ import annotations

import json
import os
from datetime import datetime
from typing import Any, Dict, List, Optional

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest


# Features fed into IsolationForest
IF_FEATURES = ["traffic_density", "aqi", "consumption_kwh", "transport_load"]

# AQI in the dataset is normalised 0-1 (max ~300 real AQI).
# Threshold rules adapted for normalised scale:
#   aqi > 200 real  ≈  aqi_norm > 0.67
#   traffic_density > 0.93     (already normalised)
#   consumption_kwh > mean + 2.5*std  (computed at runtime)
#   transport_load > 0.95      (already normalised)

THRESHOLD_AQI_NORM = 0.67          # ~200 on real AQI scale
THRESHOLD_TRAFFIC = 0.93
THRESHOLD_TRANSPORT = 0.95
AQI_SCALE = 300.0                  # for human-readable messages

# Recommendation strings per anomaly type
RECOMMENDATIONS: Dict[str, str] = {
    "pollution_spike": "Restrict industrial activity, issue air quality advisory",
    "traffic_surge": "Activate alternate routes, deploy traffic personnel",
    "energy_overconsumption": "Check for grid faults, alert energy department",
    "transport_overcrowding": "Deploy additional buses, increase route frequency",
}


class AnomalyDetector:
    """Hybrid anomaly detection: IsolationForest + threshold rules."""

    def __init__(
        self,
        contamination: float = 0.05,
        random_state: int = 42,
    ) -> None:
        self.contamination = contamination
        self.random_state = random_state
        self.iso_forest: Optional[IsolationForest] = None

    # ------------------------------------------------------------------
    # Core detection
    # ------------------------------------------------------------------

    def detect(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Run anomaly detection and return list of alert dicts.

        Parameters
        ----------
        df : pd.DataFrame
            Processed city data.

        Returns
        -------
        list[dict]
            Each dict follows the shared Alert Schema.
        """

        data = df.copy()

        # ---- Method 1: IsolationForest ----
        self.iso_forest = IsolationForest(
            contamination=self.contamination,
            random_state=self.random_state,
            n_jobs=-1,
        )
        feature_matrix = data[IF_FEATURES].values
        if_labels = self.iso_forest.fit_predict(feature_matrix)
        data["if_anomaly"] = (if_labels == -1)

        # ---- Method 2: Threshold rules ----
        energy_mean = data["consumption_kwh"].mean()
        energy_std = data["consumption_kwh"].std()
        energy_threshold = energy_mean + 2.5 * energy_std

        data["thr_pollution"] = data["aqi"] > THRESHOLD_AQI_NORM
        data["thr_traffic"] = data["traffic_density"] > THRESHOLD_TRAFFIC
        data["thr_energy"] = data["consumption_kwh"] > energy_threshold
        data["thr_transport"] = data["transport_load"] > THRESHOLD_TRANSPORT
        data["thr_any"] = (
            data["thr_pollution"] | data["thr_traffic"]
            | data["thr_energy"] | data["thr_transport"]
        )

        # ---- Combine: keep rows flagged by at least one method ----
        anomaly_mask = data["if_anomaly"] | data["thr_any"]
        anomalies = data[anomaly_mask].copy()

        # ---- Build alert dicts ----
        alerts: List[Dict[str, Any]] = []
        alert_counter = 0

        for _, row in anomalies.iterrows():
            is_if = bool(row["if_anomaly"])

            # Determine the specific anomaly type(s)
            types_triggered: List[str] = []
            if row.get("thr_pollution", False):
                types_triggered.append("pollution_spike")
            if row.get("thr_traffic", False):
                types_triggered.append("traffic_surge")
            if row.get("thr_energy", False):
                types_triggered.append("energy_overconsumption")
            if row.get("thr_transport", False):
                types_triggered.append("transport_overcrowding")

            # If only IsolationForest flagged it, mark as generic anomaly
            if not types_triggered:
                types_triggered.append("statistical_anomaly")

            for atype in types_triggered:
                alert_counter += 1

                # Severity: both methods → critical, single → warning
                is_threshold = atype != "statistical_anomaly"
                if is_if and is_threshold:
                    severity = "critical"
                else:
                    severity = "warning"

                message = self._build_message(atype, row)
                recommendation = RECOMMENDATIONS.get(
                    atype,
                    "Investigate anomaly, cross-check with nearby sensors",
                )

                alerts.append({
                    "alert_id": f"ALT_{alert_counter:03d}",
                    "type": atype,
                    "district_id": row.get("district_id", "unknown"),
                    "severity": severity,
                    "message": message,
                    "timestamp": str(row.get("timestamp", datetime.now().isoformat())),
                    "recommendation": recommendation,
                })

        return alerts

    # ------------------------------------------------------------------
    # Message builder
    # ------------------------------------------------------------------

    @staticmethod
    def _build_message(atype: str, row: pd.Series) -> str:
        """Build a human-readable alert message."""
        district = row.get("district_id", "unknown")

        if atype == "pollution_spike":
            aqi_real = int(row["aqi"] * AQI_SCALE)
            return f"High AQI detected in {district} - {aqi_real} ug/m3"
        elif atype == "traffic_surge":
            val = round(float(row["traffic_density"]), 3)
            return f"Traffic density surge in {district} - {val}"
        elif atype == "energy_overconsumption":
            val = round(float(row["consumption_kwh"]), 3)
            return f"Energy overconsumption in {district} - {val} kWh"
        elif atype == "transport_overcrowding":
            val = round(float(row["transport_load"]), 3)
            return f"Transport overcrowding in {district} - load {val}"
        else:
            return f"Statistical anomaly detected in {district}"

    # ------------------------------------------------------------------
    # Save alerts
    # ------------------------------------------------------------------

    def save_alerts(
        self,
        alerts: List[Dict[str, Any]],
        path: str = "output/alerts.json",
    ) -> str:
        """Save alerts as JSON and print summary.

        Parameters
        ----------
        alerts : list[dict]
            Alert dicts from ``detect()``.
        path : str
            Output file path.

        Returns
        -------
        str
            Absolute path to saved file.
        """
        os.makedirs(os.path.dirname(path), exist_ok=True)

        with open(path, "w", encoding="utf-8") as f:
            json.dump(alerts, f, indent=2, default=str)

        critical = sum(1 for a in alerts if a["severity"] == "critical")
        warning = sum(1 for a in alerts if a["severity"] == "warning")

        print("\n" + "-" * 50)
        print("  ANOMALY DETECTION SUMMARY")
        print("-" * 50)
        print(f"  Critical alerts : {critical}")
        print(f"  Warning alerts  : {warning}")
        print(f"  Total anomalies : {len(alerts)}")
        print(f"\n  [saved] {os.path.abspath(path)}\n")

        return os.path.abspath(path)
