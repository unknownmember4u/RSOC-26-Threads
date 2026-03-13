"""
UrbanMind - RAG (Retrieval Augmented Generation) Engine
=========================================================
Retrieves relevant data chunks from the processed city dataset based
on the user's question, then formats them as readable context for the
LLM. This grounds the chat model's answers in actual data.
"""

from __future__ import annotations

import json
import os
import re
import sys
from datetime import datetime
from typing import Any, Callable, Dict, List, Optional, Set

import numpy as np
import pandas as pd

# Project root
_PROJECT_ROOT = os.path.normpath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, _PROJECT_ROOT)

# AQI scale: dataset stores normalised 0-1, real AQI ≈ ×300
AQI_SCALE = 300.0

# District display names
DISTRICT_NAMES = {
    "D01": "Shivajinagar", "D02": "Kothrud", "D03": "Hadapsar",
    "D04": "Wakad", "D05": "Pimpri", "D06": "Baner",
    "D07": "Magarpatta", "D08": "Kharadi", "D09": "Viman Nagar",
    "D10": "Swargate",
}


def _estimate_tokens(text: str) -> int:
    """Rough token count estimator."""
    return int(len(text.split()) * 1.3)


class RAGEngine:
    """Keyword-based retrieval engine over processed city data."""

    def __init__(self, data_path: Optional[str] = None) -> None:
        if data_path is None:
            import config
            data_path = config.DATA_PATH

        self.df = pd.read_csv(data_path)

        # Ensure helper columns
        self.df["timestamp"] = pd.to_datetime(self.df["timestamp"])
        self.df["hour"] = self.df["timestamp"].dt.hour
        if "is_weekend" not in self.df.columns or self.df["is_weekend"].dtype == object:
            self.df["is_weekend"] = self.df["timestamp"].dt.weekday >= 5
        else:
            self.df["is_weekend"] = self.df["is_weekend"].astype(bool)
        self.df["is_peak"] = self.df["hour"].isin([8, 9, 17, 18, 19])

        # Precompute district summary
        self.district_summary = self.df.groupby("district_id").agg({
            "aqi":              ["mean", "max"],
            "traffic_density":  ["mean", "max"],
            "consumption_kwh":  ["mean", "max"],
            "transport_load":   ["mean", "max"],
            "water_liters":     "mean",
            "waste_kg":         "mean",
        }).round(4)

        # Intent keyword -> retrieval function mapping
        self.intent_map: Dict[str, Callable] = {
            "pollution":  self._get_pollution_context,
            "aqi":        self._get_pollution_context,
            "air":        self._get_pollution_context,
            "traffic":    self._get_traffic_context,
            "congestion": self._get_traffic_context,
            "energy":     self._get_energy_context,
            "power":      self._get_energy_context,
            "electricity": self._get_energy_context,
            "transport":  self._get_transport_context,
            "bus":        self._get_transport_context,
            "overcrowd":  self._get_transport_context,
            "water":      self._get_water_context,
            "waste":      self._get_waste_context,
            "garbage":    self._get_waste_context,
            "worst":      self._get_worst_context,
            "best":       self._get_best_context,
            "peak":       self._get_peak_context,
            "morning":    self._get_peak_context,
            "rush":       self._get_peak_context,
            "night":      self._get_night_context,
            "weekend":    self._get_weekend_context,
            "compare":    self._get_comparison_context,
            "vs":         self._get_comparison_context,
            "cluster":    self._get_cluster_context,
            "zone":       self._get_cluster_context,
            "alert":      self._get_alert_context,
            "anomaly":    self._get_anomaly_context,
            "spike":      self._get_anomaly_context,
        }

        print(f"[ok] RAG engine initialised ({len(self.df):,} rows, "
              f"{self.df['district_id'].nunique()} districts)")

    # ------------------------------------------------------------------
    # Main retrieval entry point
    # ------------------------------------------------------------------

    def retrieve(self, user_message: str, top_k: int = 5) -> str:
        """Retrieve relevant data context for a user question.

        Parameters
        ----------
        user_message : str
            The user's natural-language question.
        top_k : int
            Max rows / items to include per retrieval function.

        Returns
        -------
        str
            Formatted context string for injection into LLM prompt.
        """
        message_lower = user_message.lower()
        matched_fns: Set[Callable] = set()

        for keyword, fn in self.intent_map.items():
            if keyword in message_lower:
                matched_fns.add(fn)

        if not matched_fns:
            combined = self._get_general_context()
        else:
            contexts = [fn(user_message, top_k) for fn in matched_fns]
            combined = "\n\n".join(contexts)

        # Token budget check
        if _estimate_tokens(combined) > 800:
            # Retry with smaller top_k
            if matched_fns:
                contexts = [fn(user_message, 3) for fn in matched_fns]
                combined = "\n\n".join(contexts)

        # Logging
        fn_names = [fn.__name__ for fn in matched_fns] if matched_fns else ["_get_general_context"]
        print(f"[RAG] Query: '{user_message[:50]}...'")
        print(f"[RAG] Intents detected: {fn_names}")
        print(f"[RAG] Context length: ~{_estimate_tokens(combined)} tokens")

        return f"RETRIEVED CITY DATA:\n{combined}\n"

    # ------------------------------------------------------------------
    # Helper: format series as ranked string
    # ------------------------------------------------------------------

    def _fmt_series(self, s: pd.Series, unit: str = "", scale: float = 1.0) -> str:
        """Format a series as 'D05=178, D03=162, ...'"""
        parts = []
        for did, val in s.items():
            v = round(float(val) * scale, 1)
            parts.append(f"{did}={v}{unit}")
        return ", ".join(parts)

    # ═══════════════════════════════════════════════════════════════
    # Retrieval functions
    # ═══════════════════════════════════════════════════════════════

    def _get_pollution_context(self, message: str, top_k: int = 5) -> str:
        top = (self.df.groupby("district_id")["aqi"].mean()
               .sort_values(ascending=False).head(top_k))
        now_hour = datetime.now().hour
        current = (self.df[self.df["hour"] == now_hour]
                   .groupby("district_id")["aqi"].mean()
                   .sort_values(ascending=False).head(top_k))
        return (
            f"POLLUTION DATA:\n"
            f"  Highest AQI districts (avg): {self._fmt_series(top, scale=AQI_SCALE)}\n"
            f"  Current hour ({now_hour}:00) AQI: {self._fmt_series(current, scale=AQI_SCALE)}"
        )

    def _get_traffic_context(self, message: str, top_k: int = 5) -> str:
        top = (self.df.groupby("district_id")["traffic_density"].mean()
               .sort_values(ascending=False).head(top_k))
        peak = (self.df[self.df["is_peak"]]
                .groupby("district_id")["traffic_density"].mean()
                .sort_values(ascending=False).head(top_k))
        offpeak = (self.df[~self.df["is_peak"]]
                   .groupby("district_id")["traffic_density"].mean()
                   .sort_values(ascending=False).head(top_k))
        return (
            f"TRAFFIC DATA:\n"
            f"  Highest congestion (avg): {self._fmt_series(top)}\n"
            f"  Peak hour avg: {self._fmt_series(peak)}\n"
            f"  Off-peak avg: {self._fmt_series(offpeak)}"
        )

    def _get_energy_context(self, message: str, top_k: int = 5) -> str:
        top = (self.df.groupby("district_id")["consumption_kwh"].mean()
               .sort_values(ascending=False).head(top_k))
        hourly = self.df.groupby("hour")["consumption_kwh"].mean().round(1)
        peak_h = int(hourly.idxmax())
        top_hours = hourly.sort_values(ascending=False).head(5)
        hours_str = ", ".join(f"{int(h)}:00={v}" for h, v in top_hours.items())
        return (
            f"ENERGY DATA:\n"
            f"  Highest consumption districts: {self._fmt_series(top, ' kWh')}\n"
            f"  Peak energy hour: {peak_h}:00\n"
            f"  Top hours: {hours_str}"
        )

    def _get_transport_context(self, message: str, top_k: int = 5) -> str:
        top = (self.df.groupby("district_id")["transport_load"].mean()
               .sort_values(ascending=False).head(top_k))
        delays = (self.df.groupby("district_id")["delay_min"].mean()
                  .sort_values(ascending=False).head(top_k).round(1))
        return (
            f"TRANSPORT DATA:\n"
            f"  Most overcrowded districts: {self._fmt_series(top)}\n"
            f"  Average delays (min): {self._fmt_series(delays, ' min')}"
        )

    def _get_water_context(self, message: str, top_k: int = 5) -> str:
        top = (self.df.groupby("district_id")["water_liters"].mean()
               .sort_values(ascending=False).head(top_k))
        hourly = self.df.groupby("hour")["water_liters"].mean()
        peak_h = int(hourly.idxmax())
        return (
            f"WATER DATA:\n"
            f"  Highest water usage districts: {self._fmt_series(top, ' L')}\n"
            f"  Peak water hour: {peak_h}:00"
        )

    def _get_waste_context(self, message: str, top_k: int = 5) -> str:
        top = (self.df.groupby("district_id")["waste_kg"].mean()
               .sort_values(ascending=False).head(top_k))
        return (
            f"WASTE DATA:\n"
            f"  Highest waste districts: {self._fmt_series(top, ' kg')}"
        )

    def _get_worst_context(self, message: str, top_k: int = 5) -> str:
        worst_poll = self.df.groupby("district_id")["aqi"].mean().idxmax()
        worst_poll_v = round(self.df.groupby("district_id")["aqi"].mean().max() * AQI_SCALE, 1)
        worst_traf = self.df.groupby("district_id")["traffic_density"].mean().idxmax()
        worst_traf_v = round(self.df.groupby("district_id")["traffic_density"].mean().max(), 3)
        worst_ener = self.df.groupby("district_id")["consumption_kwh"].mean().idxmax()
        worst_ener_v = round(self.df.groupby("district_id")["consumption_kwh"].mean().max(), 1)
        worst_trans = self.df.groupby("district_id")["transport_load"].mean().idxmax()
        worst_trans_v = round(self.df.groupby("district_id")["transport_load"].mean().max(), 3)
        return (
            f"WORST PERFORMING DISTRICTS:\n"
            f"  Pollution: {worst_poll} {DISTRICT_NAMES.get(worst_poll,'')} (avg AQI {worst_poll_v})\n"
            f"  Traffic: {worst_traf} {DISTRICT_NAMES.get(worst_traf,'')} (avg density {worst_traf_v})\n"
            f"  Energy: {worst_ener} {DISTRICT_NAMES.get(worst_ener,'')} (avg {worst_ener_v} kWh)\n"
            f"  Transport: {worst_trans} {DISTRICT_NAMES.get(worst_trans,'')} (avg load {worst_trans_v})"
        )

    def _get_best_context(self, message: str, top_k: int = 5) -> str:
        best_poll = self.df.groupby("district_id")["aqi"].mean().idxmin()
        best_poll_v = round(self.df.groupby("district_id")["aqi"].mean().min() * AQI_SCALE, 1)
        best_traf = self.df.groupby("district_id")["traffic_density"].mean().idxmin()
        best_traf_v = round(self.df.groupby("district_id")["traffic_density"].mean().min(), 3)
        best_ener = self.df.groupby("district_id")["consumption_kwh"].mean().idxmin()
        best_ener_v = round(self.df.groupby("district_id")["consumption_kwh"].mean().min(), 1)
        best_trans = self.df.groupby("district_id")["transport_load"].mean().idxmin()
        best_trans_v = round(self.df.groupby("district_id")["transport_load"].mean().min(), 3)
        return (
            f"BEST PERFORMING DISTRICTS:\n"
            f"  Cleanest air: {best_poll} {DISTRICT_NAMES.get(best_poll,'')} (avg AQI {best_poll_v})\n"
            f"  Least traffic: {best_traf} {DISTRICT_NAMES.get(best_traf,'')} (avg density {best_traf_v})\n"
            f"  Lowest energy: {best_ener} {DISTRICT_NAMES.get(best_ener,'')} (avg {best_ener_v} kWh)\n"
            f"  Least crowded: {best_trans} {DISTRICT_NAMES.get(best_trans,'')} (avg load {best_trans_v})"
        )

    def _get_peak_context(self, message: str, top_k: int = 5) -> str:
        peak_df = self.df[self.df["is_peak"]]
        summary = peak_df.groupby("district_id").agg({
            "traffic_density": "mean",
            "aqi": "mean",
            "transport_load": "mean",
        }).round(3)
        lines = ["PEAK HOUR DATA (8-10 AM, 5-7 PM):"]
        lines.append(f"  {'District':<10} {'Traffic':>10} {'AQI':>10} {'Transport':>10}")
        for did, row in summary.sort_values("traffic_density", ascending=False).head(top_k).iterrows():
            aqi_real = round(row["aqi"] * AQI_SCALE, 1)
            lines.append(f"  {did:<10} {row['traffic_density']:>10.3f} {aqi_real:>10.1f} {row['transport_load']:>10.3f}")
        return "\n".join(lines)

    def _get_night_context(self, message: str, top_k: int = 5) -> str:
        night_df = self.df[self.df["hour"].isin([22, 23, 0, 1, 2, 3, 4, 5])]
        summary = night_df.groupby("district_id").agg({
            "traffic_density": "mean",
            "aqi": "mean",
            "transport_load": "mean",
        }).round(3)
        lines = ["NIGHT DATA (10 PM - 5 AM):"]
        lines.append(f"  {'District':<10} {'Traffic':>10} {'AQI':>10} {'Transport':>10}")
        for did, row in summary.sort_values("traffic_density", ascending=False).head(top_k).iterrows():
            aqi_real = round(row["aqi"] * AQI_SCALE, 1)
            lines.append(f"  {did:<10} {row['traffic_density']:>10.3f} {aqi_real:>10.1f} {row['transport_load']:>10.3f}")
        return "\n".join(lines)

    def _get_weekend_context(self, message: str, top_k: int = 5) -> str:
        weekend = self.df[self.df["is_weekend"]].mean(numeric_only=True)
        weekday = self.df[~self.df["is_weekend"]].mean(numeric_only=True)
        metrics = ["traffic_density", "aqi", "consumption_kwh", "transport_load"]
        lines = ["WEEKEND vs WEEKDAY:"]
        for m in metrics:
            wd = round(float(weekday.get(m, 0)), 3)
            we = round(float(weekend.get(m, 0)), 3)
            scale = AQI_SCALE if m == "aqi" else 1
            wd_s, we_s = round(wd * scale, 1), round(we * scale, 1)
            if wd != 0:
                delta = round(((we - wd) / wd) * 100, 1)
            else:
                delta = 0
            lines.append(f"  {m}: weekday={wd_s}, weekend={we_s} ({delta:+.1f}%)")
        return "\n".join(lines)

    def _get_comparison_context(self, message: str, top_k: int = 5) -> str:
        found = re.findall(r"D\d+", message.upper())
        if found:
            dids = list(set(found))
            subset = self.df[self.df["district_id"].isin(dids)]
        else:
            # Top 3 vs bottom 3 by traffic
            ranking = self.df.groupby("district_id")["traffic_density"].mean().sort_values()
            bottom3 = list(ranking.head(3).index)
            top3 = list(ranking.tail(3).index)
            dids = bottom3 + top3
            subset = self.df[self.df["district_id"].isin(dids)]

        comp = subset.groupby("district_id").agg({
            "traffic_density": "mean",
            "aqi": "mean",
            "consumption_kwh": "mean",
            "transport_load": "mean",
        }).round(3)
        lines = [f"COMPARISON ({', '.join(dids)}):"]
        lines.append(f"  {'District':<10} {'Traffic':>10} {'AQI':>10} {'Energy':>10} {'Transport':>10}")
        for did, row in comp.iterrows():
            aqi_real = round(row["aqi"] * AQI_SCALE, 1)
            lines.append(f"  {did:<10} {row['traffic_density']:>10.3f} {aqi_real:>10.1f} "
                         f"{row['consumption_kwh']:>10.1f} {row['transport_load']:>10.3f}")
        return "\n".join(lines)

    def _get_cluster_context(self, message: str, top_k: int = 5) -> str:
        clusters_path = os.path.join(_PROJECT_ROOT, "output", "clusters.json")
        if not os.path.isfile(clusters_path):
            return "CLUSTER DATA: clusters.json not found. Run train_all.py first."
        with open(clusters_path) as f:
            clusters = json.load(f)
        # Group by label
        by_label: Dict[str, list] = {}
        for c in clusters:
            label = c.get("cluster_label", "Unknown")
            by_label.setdefault(label, []).append(
                f"{c['district_id']} (risk: {c['risk_score']})"
            )
        lines = ["CLUSTER DATA:"]
        for label, items in by_label.items():
            lines.append(f"  {label}: {', '.join(items)}")
        return "\n".join(lines)

    def _get_alert_context(self, message: str, top_k: int = 5) -> str:
        alerts_path = os.path.join(_PROJECT_ROOT, "output", "alerts.json")
        if not os.path.isfile(alerts_path):
            return "ALERT DATA: alerts.json not found. Run train_all.py first."
        with open(alerts_path) as f:
            alerts = json.load(f)
        critical = [a for a in alerts if a.get("severity") == "critical"]
        warning = [a for a in alerts if a.get("severity") == "warning"]
        lines = [f"ACTIVE ALERTS ({len(critical)} critical, {len(warning)} warning):"]
        for a in critical[:top_k]:
            lines.append(f"  CRITICAL: {a['district_id']} - {a['type']} - {a['message']}")
        for a in warning[:max(0, top_k - len(critical[:top_k]))]:
            lines.append(f"  WARNING: {a['district_id']} - {a['type']} - {a['message']}")
        return "\n".join(lines)

    def _get_anomaly_context(self, message: str, top_k: int = 5) -> str:
        aqi_mean = self.df["aqi"].mean()
        aqi_std = self.df["aqi"].std()
        spikes = (self.df[self.df["aqi"] > aqi_mean + 2 * aqi_std]
                  .groupby("district_id").size()
                  .sort_values(ascending=False).head(top_k))
        traffic_mean = self.df["traffic_density"].mean()
        traffic_std = self.df["traffic_density"].std()
        traffic_spikes = (self.df[self.df["traffic_density"] > traffic_mean + 2 * traffic_std]
                          .groupby("district_id").size()
                          .sort_values(ascending=False).head(top_k))
        return (
            f"ANOMALY HISTORY:\n"
            f"  Districts with most AQI spikes (>2 std): {self._fmt_series(spikes)}\n"
            f"  Districts with most traffic spikes (>2 std): {self._fmt_series(traffic_spikes)}"
        )

    def _get_general_context(self, top_k: int = 5) -> str:
        avg_aqi = round(self.df["aqi"].mean() * AQI_SCALE, 1)
        avg_traffic = round(self.df["traffic_density"].mean(), 3)
        avg_energy = round(self.df["consumption_kwh"].mean(), 1)
        avg_transport = round(self.df["transport_load"].mean(), 3)
        worst = self.df.groupby("district_id")["aqi"].mean().idxmax()
        return (
            f"OVERALL CITY SUMMARY (Pune):\n"
            f"  Districts: D01-D10 (Shivajinagar to Swargate)\n"
            f"  Avg AQI citywide: {avg_aqi}\n"
            f"  Avg traffic density: {avg_traffic}\n"
            f"  Avg energy: {avg_energy} kWh\n"
            f"  Avg transport load: {avg_transport}\n"
            f"  Most concerning district: {worst} {DISTRICT_NAMES.get(worst, '')}"
        )
