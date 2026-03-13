"""
feature_engineer.py — UrbanMind Smart City Analytics Platform
==============================================================
Derives domain-specific features from cleaned smart-city data
for downstream ML models and dashboards.

Classes:
    FeatureEngineer — Adds ten engineered features per row.

Usage:
    >>> fe = FeatureEngineer()
    >>> enriched = fe.engineer(cleaned_df)
"""

from __future__ import annotations

import logging
from typing import Dict, Tuple

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)

# ── District metadata for Pune, India (10 districts) ───────────────
# { district_id: (name, lat, lng, area_km2) }
DISTRICT_LOOKUP: Dict[str, Tuple[str, float, float, float]] = {
    "D01": ("Shivajinagar",  18.5308, 73.8474, 5.2),
    "D02": ("Kothrud",       18.5074, 73.8077, 8.1),
    "D03": ("Hadapsar",      18.5018, 73.9252, 12.4),
    "D04": ("Wakad",         18.5984, 73.7611, 9.7),
    "D05": ("Pimpri",        18.6279, 73.8009, 15.3),
    "D06": ("Baner",         18.5590, 73.7868, 7.6),
    "D07": ("Magarpatta",    18.5089, 73.9259, 4.8),
    "D08": ("Kharadi",       18.5497, 73.9397, 6.9),
    "D09": ("Viman Nagar",   18.5679, 73.9143, 5.5),
    "D10": ("Swargate",      18.5018, 73.8636, 3.8),
}

# Convenience maps
DISTRICT_AREA: Dict[str, float] = {
    did: meta[3] for did, meta in DISTRICT_LOOKUP.items()
}
DISTRICT_COORDS: Dict[str, Tuple[float, float]] = {
    did: (meta[1], meta[2]) for did, meta in DISTRICT_LOOKUP.items()
}

PEAK_HOURS = {8, 9, 17, 18, 19}


class FeatureEngineer:
    """
    Derive engineered features from a cleaned UrbanMind DataFrame.

    The :meth:`engineer` method adds the following columns:

    +----------------------------+-----------------------------------------------+
    | Column                     | Description                                   |
    +============================+===============================================+
    | traffic_density            | vehicle_count / max(vehicle_count) per district|
    | pollution_index            | 0.4·pm25 + 0.3·pm10 + 0.3·co2 (normalised)   |
    | energy_usage_per_area      | consumption_kwh / area_km²                    |
    | transport_load             | passenger_count / capacity  [0, 1]            |
    | hour_of_day                | Hour (0–23)                                   |
    | day_of_week                | 0 = Monday … 6 = Sunday                       |
    | is_weekend                 | True for Sat / Sun                            |
    | is_peak_hour               | True if hour ∈ {8, 9, 17, 18, 19}             |
    | rolling_aqi_3h             | 3-hour rolling mean of ``aqi`` per district   |
    | traffic_pollution_ratio    | traffic_density / (pollution_index + 0.001)   |
    +----------------------------+-----------------------------------------------+

    It also ensures ``lat`` and ``lng`` are populated from the district
    lookup dict and emits the final output schema.
    """

    def __init__(self) -> None:
        self.district_lookup = DISTRICT_LOOKUP
        self.district_area = DISTRICT_AREA
        self.district_coords = DISTRICT_COORDS

    # ── public entry point ──────────────────────────────────────────

    def engineer(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Add all engineered features to *df*.

        Parameters:
            df: Cleaned DataFrame with at minimum ``timestamp``,
                ``district_id``, and core metric columns.

        Returns:
            DataFrame enriched with engineered features plus
            district coordinates (``lat``, ``lng``).
        """
        logger.info(
            "▸ Feature engineering started — %d rows × %d cols",
            len(df), len(df.columns),
        )

        # Ensure timestamp is datetime
        df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce")

        # ── temporal features ───────────────────────────────────────
        df = self._add_temporal_features(df)

        # ── domain features ─────────────────────────────────────────
        df = self._add_traffic_density(df)
        df = self._add_pollution_index(df)
        df = self._add_energy_usage_per_area(df)
        df = self._add_transport_load(df)
        df = self._add_rolling_aqi(df)
        df = self._add_traffic_pollution_ratio(df)

        # ── coordinates ─────────────────────────────────────────────
        df = self._ensure_coordinates(df)

        logger.info(
            "✅ Feature engineering finished — %d rows × %d cols",
            len(df), len(df.columns),
        )
        return df

    # ── temporal features ───────────────────────────────────────────

    @staticmethod
    def _add_temporal_features(df: pd.DataFrame) -> pd.DataFrame:
        """Add hour_of_day, day_of_week, is_weekend, is_peak_hour."""
        ts = df["timestamp"]
        df["hour_of_day"] = ts.dt.hour
        df["day_of_week"] = ts.dt.dayofweek          # 0=Mon, 6=Sun
        df["is_weekend"] = ts.dt.dayofweek >= 5
        df["is_peak_hour"] = ts.dt.hour.isin(PEAK_HOURS)

        logger.info("  + hour_of_day, day_of_week, is_weekend, is_peak_hour")
        return df

    # ── traffic density ─────────────────────────────────────────────

    @staticmethod
    def _add_traffic_density(df: pd.DataFrame) -> pd.DataFrame:
        """
        traffic_density = vehicle_count / max(vehicle_count) per district.
        """
        if "vehicle_count" not in df.columns:
            logger.warning("  ⚠ 'vehicle_count' missing — traffic_density set to 0")
            df["traffic_density"] = 0.0
            return df

        max_per_district = df.groupby("district_id")["vehicle_count"].transform("max")
        max_per_district = max_per_district.replace(0, 1)  # avoid div-by-zero
        df["traffic_density"] = df["vehicle_count"] / max_per_district

        logger.info("  + traffic_density")
        return df

    # ── pollution index ─────────────────────────────────────────────

    @staticmethod
    def _add_pollution_index(df: pd.DataFrame) -> pd.DataFrame:
        """
        pollution_index = weighted average of pm25, pm10, co2_ppm
        normalised to [0, 1].

        Weights: pm25 × 0.4 + pm10 × 0.3 + co2_ppm × 0.3
        If co2_ppm is absent, fall back to aqi as proxy.
        """
        pm25 = df.get("pm25", pd.Series(0, index=df.index))
        pm10 = df.get("pm10", pd.Series(0, index=df.index))
        co2  = df.get("co2_ppm", df.get("aqi", pd.Series(0, index=df.index)))

        raw = pm25 * 0.4 + pm10 * 0.3 + co2 * 0.3
        rmin, rmax = raw.min(), raw.max()
        if rmax - rmin == 0:
            df["pollution_index"] = 0.0
        else:
            df["pollution_index"] = (raw - rmin) / (rmax - rmin)

        logger.info("  + pollution_index")
        return df

    # ── energy usage per area ───────────────────────────────────────

    def _add_energy_usage_per_area(self, df: pd.DataFrame) -> pd.DataFrame:
        """energy_usage_per_area = consumption_kwh / district_area_km²."""
        area_series = df["district_id"].map(self.district_area).fillna(1.0)

        if "consumption_kwh" in df.columns:
            df["energy_usage_per_area"] = df["consumption_kwh"] / area_series
        else:
            logger.warning(
                "  ⚠ 'consumption_kwh' missing — energy_usage_per_area set to 0"
            )
            df["energy_usage_per_area"] = 0.0

        logger.info("  + energy_usage_per_area")
        return df

    # ── transport load ──────────────────────────────────────────────

    @staticmethod
    def _add_transport_load(df: pd.DataFrame) -> pd.DataFrame:
        """transport_load = passenger_count / capacity, clipped to [0, 1]."""
        if "passenger_count" in df.columns and "capacity" in df.columns:
            cap = df["capacity"].replace(0, 1)
            df["transport_load"] = (df["passenger_count"] / cap).clip(0, 1)
        else:
            logger.warning(
                "  ⚠ 'passenger_count'/'capacity' missing — transport_load set to 0"
            )
            df["transport_load"] = 0.0

        logger.info("  + transport_load")
        return df

    # ── rolling AQI ─────────────────────────────────────────────────

    @staticmethod
    def _add_rolling_aqi(df: pd.DataFrame) -> pd.DataFrame:
        """3-hour rolling mean of ``aqi`` per district."""
        if "aqi" not in df.columns:
            logger.warning("  ⚠ 'aqi' missing — rolling_aqi_3h set to 0")
            df["rolling_aqi_3h"] = 0.0
            return df

        df = df.sort_values(["district_id", "timestamp"])
        df["rolling_aqi_3h"] = (
            df.groupby("district_id")["aqi"]
            .transform(lambda s: s.rolling(window=3, min_periods=1).mean())
        )

        logger.info("  + rolling_aqi_3h")
        return df

    # ── traffic / pollution ratio ───────────────────────────────────

    @staticmethod
    def _add_traffic_pollution_ratio(df: pd.DataFrame) -> pd.DataFrame:
        """traffic_pollution_ratio = traffic_density / (pollution_index + ε)."""
        td = df.get("traffic_density", pd.Series(0, index=df.index))
        pi = df.get("pollution_index", pd.Series(0, index=df.index))
        df["traffic_pollution_ratio"] = td / (pi + 0.001)

        logger.info("  + traffic_pollution_ratio")
        return df

    # ── coordinates ─────────────────────────────────────────────────

    def _ensure_coordinates(self, df: pd.DataFrame) -> pd.DataFrame:
        """Populate ``lat`` and ``lng`` from the district lookup dict."""
        df["lat"] = df["district_id"].map(
            lambda d: self.district_coords.get(d, (np.nan, np.nan))[0]
        )
        df["lng"] = df["district_id"].map(
            lambda d: self.district_coords.get(d, (np.nan, np.nan))[1]
        )
        logger.info("  + lat, lng (from district lookup)")
        return df
