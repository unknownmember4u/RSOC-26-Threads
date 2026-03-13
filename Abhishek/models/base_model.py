"""
UrbanMind – Base ML Model
==========================
Abstract base class that every UrbanMind model inherits from.

Provides:
  • Abstract interface  : train(), predict(), evaluate()
  • Serialisation       : save() / load() via pickle (.pkl) or joblib (.h5)
  • Feature contract    : _get_feature_cols()
  • Metrics logging     : _log_metrics()

Data contract
-------------
Input CSV  : ../Vaishnavi/output/processed_data.csv
Required columns:
    timestamp, district_id, traffic_density, aqi, energy_kwh,
    water_liters, transport_load, waste_kg, weather_temp,
    weather_humidity, hour_of_day, day_of_week, is_weekend,
    is_peak_hour, rolling_aqi_3h, lat, lng
"""

from __future__ import annotations

import os
import pickle
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional

import numpy as np
import pandas as pd


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

REQUIRED_COLUMNS: List[str] = [
    "timestamp",
    "district_id",
    "traffic_density",
    "aqi",
    "consumption_kwh",
    "water_liters",
    "transport_load",
    "waste_kg",
    "weather_temp",
    "weather_humidity",
    "hour_of_day",
    "day_of_week",
    "is_weekend",
    "is_peak_hour",
    "rolling_aqi_3h",
    "lat",
    "lng",
]


# ---------------------------------------------------------------------------
# Abstract Base Class
# ---------------------------------------------------------------------------


class BaseUrbanModel(ABC):
    """Abstract base class for all UrbanMind ML models.

    Subclasses **must** implement:
        - ``train(df)``           – fit the model on a DataFrame
        - ``predict(input_dict)`` – return predictions dict for a single input
        - ``evaluate(df)``        – return a metrics dict on evaluation data

    Concrete helpers provided:
        - ``save(path)`` / ``load(path)``   – pickle / .h5 serialisation
        - ``_get_feature_cols()``           – default feature column list
        - ``_log_metrics(metrics)``         – pretty box-formatted metrics
    """

    # Override in subclasses
    MODEL_NAME: str = "BaseUrbanModel"
    ALGORITHM: str = "N/A"

    def __init__(self) -> None:
        self.model: Any = None
        self.is_trained: bool = False
        self.feature_columns: List[str] = self._get_feature_cols()

    # ------------------------------------------------------------------
    # Abstract methods
    # ------------------------------------------------------------------

    @abstractmethod
    def train(self, df: pd.DataFrame) -> None:
        """Train the model on a pre-processed DataFrame.

        Parameters
        ----------
        df : pd.DataFrame
            Must contain at least the columns in ``REQUIRED_COLUMNS``.
        """
        ...

    @abstractmethod
    def predict(self, input_dict: Dict[str, Any]) -> Dict[str, Any]:
        """Generate predictions for a single input sample.

        Parameters
        ----------
        input_dict : dict
            Keys must match the feature columns.

        Returns
        -------
        dict
            Prediction results (keys depend on the concrete model).
        """
        ...

    @abstractmethod
    def evaluate(self, df: pd.DataFrame) -> Dict[str, float]:
        """Evaluate the model and return a metrics dictionary.

        Parameters
        ----------
        df : pd.DataFrame
            Evaluation dataset.

        Returns
        -------
        dict
            Metric name → float value mapping.
        """
        ...

    # ------------------------------------------------------------------
    # Serialisation
    # ------------------------------------------------------------------

    def save(self, path: Optional[str] = None) -> str:
        """Persist the model to disk.

        Supports ``.pkl`` (pickle) and ``.h5`` (joblib) formats.
        Defaults to ``saved_models/<MODEL_NAME>.pkl``.

        Parameters
        ----------
        path : str, optional
            Full file path including extension.

        Returns
        -------
        str
            Absolute path where the model was saved.
        """
        from . import _resolve_saved_models_dir

        if path is None:
            save_dir = _resolve_saved_models_dir()
            path = os.path.join(save_dir, f"{self.MODEL_NAME}.pkl")

        os.makedirs(os.path.dirname(path), exist_ok=True)

        if path.endswith(".h5"):
            import joblib
            joblib.dump(self, path)
        else:
            with open(path, "wb") as f:
                pickle.dump(self, f)

        print(f"[✓] Model '{self.MODEL_NAME}' saved → {path}")
        return os.path.abspath(path)

    @classmethod
    def load(cls, path: str) -> "BaseUrbanModel":
        """Load a previously saved model from disk.

        Parameters
        ----------
        path : str
            Path to the serialised model file (``.pkl`` or ``.h5``).

        Returns
        -------
        BaseUrbanModel
            The deserialised model instance.

        Raises
        ------
        FileNotFoundError
            If *path* does not exist.
        """
        if not os.path.isfile(path):
            raise FileNotFoundError(f"No model file found at: {path}")

        if path.endswith(".h5"):
            import joblib
            model_instance = joblib.load(path)
        else:
            with open(path, "rb") as f:
                model_instance = pickle.load(f)

        print(f"[✓] Model loaded ← {path}")
        return model_instance

    # ------------------------------------------------------------------
    # Feature helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _get_feature_cols() -> List[str]:
        """Return the default numeric feature columns used by most models.

        Override in subclasses that need a different feature set.

        Returns
        -------
        list[str]
            Column names used as model inputs.
        """
        return [
            "traffic_density",
            "aqi",
            "consumption_kwh",
            "water_liters",
            "transport_load",
            "waste_kg",
            "weather_temp",
            "weather_humidity",
            "hour_of_day",
            "day_of_week",
            "is_weekend",
            "is_peak_hour",
            "rolling_aqi_3h",
            "lat",
            "lng",
        ]

    # ------------------------------------------------------------------
    # Data validation & loading
    # ------------------------------------------------------------------

    @staticmethod
    def validate_dataframe(df: pd.DataFrame) -> None:
        """Verify that *df* contains every required column.

        Parameters
        ----------
        df : pd.DataFrame
            DataFrame to validate.

        Raises
        ------
        ValueError
            Lists any missing columns.
        """
        missing = [c for c in REQUIRED_COLUMNS if c not in df.columns]
        if missing:
            raise ValueError(f"DataFrame is missing required columns: {missing}")

    @staticmethod
    def load_data(path: Optional[str] = None) -> pd.DataFrame:
        """Load the shared processed-data CSV.

        Parameters
        ----------
        path : str, optional
            Override the default ``DATA_PATH`` from config.

        Returns
        -------
        pd.DataFrame
            Validated DataFrame with parsed timestamps.
        """
        from config import DATA_PATH

        csv_path = path or DATA_PATH
        if not os.path.isfile(csv_path):
            raise FileNotFoundError(f"Processed data CSV not found at: {csv_path}")

        df = pd.read_csv(csv_path, parse_dates=["timestamp"])
        BaseUrbanModel.validate_dataframe(df)
        print(f"[✓] Loaded {len(df):,} rows from {csv_path}")
        return df

    # ------------------------------------------------------------------
    # Metrics logging
    # ------------------------------------------------------------------

    def _log_metrics(self, metrics: Dict[str, float]) -> None:
        """Pretty-print metrics in a box-drawing formatted table.

        Example output::

            ┌─────────────────────────────┐
            │ Model: TrafficPredictor     │
            │ Algorithm: XGBoost          │
            │ RMSE:  0.043                │
            │ R²:    0.91                 │
            └─────────────────────────────┘

        Parameters
        ----------
        metrics : dict
            Metric name → numeric value.
        """
        if not metrics:
            print("[!] No metrics to display.")
            return

        # Build content lines
        lines: List[str] = [
            f"Model: {self.MODEL_NAME}",
            f"Algorithm: {self.ALGORITHM}",
        ]
        for key, value in metrics.items():
            if isinstance(value, float):
                lines.append(f"{key}:  {value:.4f}")
            else:
                lines.append(f"{key}:  {value}")

        # Calculate box width
        max_len = max(len(line) for line in lines)
        width = max_len + 4  # 2 padding each side

        # Print box
        print(f"\n┌{'─' * width}┐")
        for line in lines:
            print(f"│ {line.ljust(max_len)}   │")
        print(f"└{'─' * width}┘\n")

    # ------------------------------------------------------------------
    # Dunder helpers
    # ------------------------------------------------------------------

    def __repr__(self) -> str:
        status = "trained" if self.is_trained else "untrained"
        return f"<{self.MODEL_NAME} ({status})>"
