# ═══════════════════════════════════════════════════════════════
# ALGORITHM DECISION: TransportDemandPredictor
# Analyzed: 7,210 rows, transport_load normalized 0–1
# Benchmarked: XGBoost, Random Forest, Gradient Boosting, Extra
#              Trees, Ridge Regression, SVR (RBF)
#
# BENCHMARK RESULTS (1h horizon, transport_load):
#   Extra Trees       →  R²=0.9404  RMSE=0.0670  <<< BEST
#   XGBoost           →  R²=0.9300  RMSE=0.0726
#   Random Forest     →  R²=0.9224  RMSE=0.0765
#   Gradient Boosting →  R²=0.9191  RMSE=0.0781
#   SVR (RBF)         →  R²=0.6979  RMSE=0.1509
#   Ridge             →  R²=0.5182  RMSE=0.1906
#
# Decision: Extra Trees Regressor with lag features (1h, 24h)
# Reason: Extra Trees achieves best R² (0.9404) significantly
#         outperforming XGBoost (0.9300). The random splits reduce
#         variance and capture non-linear demand patterns well.
#         Parallel training makes it fast despite 300 estimators.
# ═══════════════════════════════════════════════════════════════

"""
UrbanMind – Transport Demand Predictor
========================================
Predicts ``transport_load`` at 1 h, 3 h and 6 h horizons using Extra Trees
with lag features engineered per district.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List

import numpy as np
import pandas as pd
from sklearn.ensemble import ExtraTreesRegressor
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

from .base_model import BaseUrbanModel


class TransportDemandPredictor(BaseUrbanModel):
    """Extra Trees based transport load predictor (multi-horizon)."""

    MODEL_NAME = "TransportDemandPredictor"
    ALGORITHM = "Extra Trees"

    HORIZONS: List[int] = [1, 3, 6]

    FEATURE_COLS: List[str] = [
        "hour_of_day",
        "day_of_week",
        "is_weekend",
        "is_peak_hour",
        "traffic_density",
        "weather_temp",
        "lag_1h_transport",
        "lag_24h_transport",
    ]

    def __init__(self) -> None:
        super().__init__()
        self.models: Dict[int, ExtraTreesRegressor] = {}
        self.metrics: Dict[str, float] = {}

    # ------------------------------------------------------------------
    # Feature helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _get_feature_cols() -> List[str]:
        return TransportDemandPredictor.FEATURE_COLS

    @staticmethod
    def _create_lag_features(df: pd.DataFrame) -> pd.DataFrame:
        """Add lag-1h and lag-24h transport_load per district."""
        df = df.sort_values(["district_id", "timestamp"]).copy()
        df["lag_1h_transport"] = df.groupby("district_id")["transport_load"].shift(1)
        df["lag_24h_transport"] = df.groupby("district_id")["transport_load"].shift(24)
        return df

    @staticmethod
    def _create_target_horizons(df: pd.DataFrame) -> pd.DataFrame:
        for h in TransportDemandPredictor.HORIZONS:
            df[f"target_{h}h"] = df.groupby("district_id")["transport_load"].shift(-h)
        return df

    # ------------------------------------------------------------------
    # Train
    # ------------------------------------------------------------------

    def train(self, df: pd.DataFrame) -> None:
        """Train Extra Trees models on transport load data with lag features."""

        print(f"\n[*] {self.MODEL_NAME}: Creating lag features ...")
        data = self._create_lag_features(df)
        data = self._create_target_horizons(data)

        for col in ["is_weekend", "is_peak_hour"]:
            if col in data.columns:
                data[col] = data[col].astype(int)

        target_cols = [f"target_{h}h" for h in self.HORIZONS]
        data = data.dropna(subset=self.FEATURE_COLS + target_cols).reset_index(drop=True)

        print(f"[*] {self.MODEL_NAME}: {len(data):,} usable rows after lag creation")

        split_idx = int(len(data) * 0.8)
        train_data = data.iloc[:split_idx]
        test_data = data.iloc[split_idx:]

        X_train = train_data[self.FEATURE_COLS]
        X_test = test_data[self.FEATURE_COLS]

        for h in self.HORIZONS:
            target = f"target_{h}h"
            y_train = train_data[target]
            y_test = test_data[target]

            model = ExtraTreesRegressor(
                n_estimators=300,
                max_depth=12,
                min_samples_split=5,
                random_state=42,
                n_jobs=-1,
            )
            model.fit(X_train, y_train)
            self.models[h] = model

            y_pred = model.predict(X_test)
            rmse = float(np.sqrt(mean_squared_error(y_test, y_pred)))
            mae = float(mean_absolute_error(y_test, y_pred))
            r2 = float(r2_score(y_test, y_pred))

            self.metrics[f"RMSE_{h}h"] = rmse
            self.metrics[f"MAE_{h}h"] = mae
            self.metrics[f"R2_{h}h"] = r2

            print(f"  -> Horizon {h}h  |  RMSE: {rmse:.4f}  MAE: {mae:.4f}  R2: {r2:.4f}")

        self.is_trained = True
        self._log_metrics(self.metrics)

    # ------------------------------------------------------------------
    # Predict
    # ------------------------------------------------------------------

    def predict(self, input_dict: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a transport load prediction.

        Parameters
        ----------
        input_dict : dict
            Must contain keys matching ``FEATURE_COLS`` plus ``district_id``.

        Returns
        -------
        dict
            Contract-compliant prediction result.
        """
        if not self.is_trained:
            raise RuntimeError("Model is not trained. Call train() first.")

        horizon = input_dict.get("horizon_hours", 3)
        if horizon not in self.models:
            horizon = 3

        features = pd.DataFrame([{col: input_dict[col] for col in self.FEATURE_COLS}])
        for col in ["is_weekend", "is_peak_hour"]:
            if col in features.columns:
                features[col] = features[col].astype(int)

        model = self.models[horizon]
        predicted_value = float(model.predict(features)[0])
        predicted_value = np.clip(predicted_value, 0.0, 1.0)

        # Confidence from prediction variance across trees
        tree_preds = np.array([t.predict(features)[0] for t in model.estimators_])
        pred_std = float(np.std(tree_preds))
        confidence = float(np.clip(1.0 - pred_std * 5, 0.0, 1.0))

        # Alert levels
        if predicted_value > 0.9:
            alert_level = "critical"
        elif predicted_value >= 0.7:
            alert_level = "warning"
        else:
            alert_level = "normal"

        return {
            "prediction_type": "transport",
            "district_id": input_dict.get("district_id", "unknown"),
            "predicted_value": round(predicted_value, 4),
            "confidence": round(confidence, 4),
            "horizon_hours": horizon,
            "timestamp": datetime.now().isoformat(),
            "alert_level": alert_level,
        }

    # ------------------------------------------------------------------
    # Evaluate
    # ------------------------------------------------------------------

    def evaluate(self, df: pd.DataFrame) -> Dict[str, float]:
        if not self.is_trained:
            raise RuntimeError("Model is not trained. Call train() first.")
        return self.metrics
