"""
UrbanMind - Algorithm Benchmark
=================================
Compares multiple ML algorithms for each prediction target to find the
best performer. Tests: XGBoost, Random Forest, Gradient Boosting,
Ridge Regression, and SVR.

Usage:
    cd Abhishek/
    python benchmark_algorithms.py
"""

import os
import sys
import time
import warnings

warnings.filterwarnings("ignore")

sys.path.insert(0, os.path.dirname(__file__))

import numpy as np
import pandas as pd
from sklearn.ensemble import (
    GradientBoostingRegressor,
    RandomForestRegressor,
    ExtraTreesRegressor,
)
from sklearn.linear_model import Ridge
from sklearn.svm import SVR
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from xgboost import XGBRegressor

import config
from models.base_model import BaseUrbanModel


# ═══════════════════════════════════════════════════════════════
# Algorithm registry — each entry is (name, model_factory)
# ═══════════════════════════════════════════════════════════════

ALGORITHMS = {
    "XGBoost": lambda: XGBRegressor(
        n_estimators=300, max_depth=6, learning_rate=0.05,
        subsample=0.8, colsample_bytree=0.8, random_state=42, verbosity=0,
    ),
    "Random Forest": lambda: RandomForestRegressor(
        n_estimators=300, max_depth=12, min_samples_split=5,
        random_state=42, n_jobs=-1,
    ),
    "Gradient Boosting": lambda: GradientBoostingRegressor(
        n_estimators=300, max_depth=6, learning_rate=0.05,
        subsample=0.8, random_state=42,
    ),
    "Extra Trees": lambda: ExtraTreesRegressor(
        n_estimators=300, max_depth=12, min_samples_split=5,
        random_state=42, n_jobs=-1,
    ),
    "Ridge Regression": lambda: Ridge(alpha=1.0),
    "SVR (RBF)": lambda: SVR(kernel="rbf", C=1.0, epsilon=0.01),
}

# ═══════════════════════════════════════════════════════════════
# Target definitions — features, target, lag source column
# ═══════════════════════════════════════════════════════════════

TARGETS = {
    "traffic_density": {
        "features": [
            "hour_of_day", "day_of_week", "is_weekend", "is_peak_hour",
            "rolling_aqi_3h", "weather_temp", "weather_humidity",
            "lag_1h", "lag_24h",
        ],
        "lag_source": "traffic_density",
    },
    "aqi": {
        "features": [
            "traffic_density", "hour_of_day", "day_of_week",
            "weather_temp", "weather_humidity", "is_weekend",
            "lag_1h", "lag_24h",
        ],
        "lag_source": "aqi",
    },
    "transport_load": {
        "features": [
            "hour_of_day", "day_of_week", "is_weekend", "is_peak_hour",
            "traffic_density", "weather_temp",
            "lag_1h", "lag_24h",
        ],
        "lag_source": "transport_load",
    },
}


def prepare_data(df: pd.DataFrame, target_name: str, target_cfg: dict) -> tuple:
    """Create lag features and return (X_train, y_train, X_test, y_test)."""

    data = df.sort_values(["district_id", "timestamp"]).copy()

    # Boolean -> int
    for col in ["is_weekend", "is_peak_hour"]:
        if col in data.columns:
            data[col] = data[col].astype(int)

    # Create lag features
    src = target_cfg["lag_source"]
    data["lag_1h"] = data.groupby("district_id")[src].shift(1)
    data["lag_24h"] = data.groupby("district_id")[src].shift(24)

    # Target is 1h-ahead prediction
    data["target"] = data.groupby("district_id")[target_name].shift(-1)

    # Drop NaN rows
    feature_cols = target_cfg["features"]
    data = data.dropna(subset=feature_cols + ["target"]).reset_index(drop=True)

    # 80/20 time-ordered split
    split = int(len(data) * 0.8)
    X_train = data.iloc[:split][feature_cols]
    y_train = data.iloc[:split]["target"]
    X_test = data.iloc[split:][feature_cols]
    y_test = data.iloc[split:]["target"]

    return X_train, y_train, X_test, y_test


def benchmark_one(
    algo_name: str, model_factory, X_train, y_train, X_test, y_test
) -> dict:
    """Train a single algorithm and return metrics + timing."""

    model = model_factory()
    t0 = time.time()

    if algo_name == "XGBoost":
        model.fit(X_train, y_train, eval_set=[(X_test, y_test)], verbose=False)
    else:
        model.fit(X_train, y_train)

    train_time = time.time() - t0
    y_pred = model.predict(X_test)

    return {
        "RMSE": float(np.sqrt(mean_squared_error(y_test, y_pred))),
        "MAE": float(mean_absolute_error(y_test, y_pred)),
        "R2": float(r2_score(y_test, y_pred)),
        "Time_s": round(train_time, 2),
    }


def print_results_table(target_name: str, results: dict) -> None:
    """Pretty-print a benchmark results table for one target."""

    # Sort by R2 descending
    sorted_algos = sorted(results.items(), key=lambda x: x[1]["R2"], reverse=True)

    print(f"\n{'='*70}")
    print(f"  TARGET: {target_name}")
    print(f"{'='*70}")
    print(f"  {'Algorithm':<22} {'RMSE':>8} {'MAE':>8} {'R^2':>8} {'Time(s)':>8}")
    print(f"  {'-'*22} {'-'*8} {'-'*8} {'-'*8} {'-'*8}")

    for i, (name, m) in enumerate(sorted_algos):
        marker = " <<< BEST" if i == 0 else ""
        print(
            f"  {name:<22} {m['RMSE']:>8.4f} {m['MAE']:>8.4f} "
            f"{m['R2']:>8.4f} {m['Time_s']:>8.2f}{marker}"
        )


def main() -> None:
    print("=" * 70)
    print("  UrbanMind - Algorithm Benchmark")
    print("  Comparing: XGBoost, Random Forest, Gradient Boosting,")
    print("             Extra Trees, Ridge Regression, SVR")
    print("=" * 70)

    # Load data
    df = BaseUrbanModel.load_data(config.DATA_PATH)
    print(f"  Dataset: {df.shape[0]:,} rows x {df.shape[1]} columns\n")

    # Store winners
    winners = {}

    for target_name, target_cfg in TARGETS.items():
        print(f"\n--- Preparing data for: {target_name} ---")
        X_train, y_train, X_test, y_test = prepare_data(df, target_name, target_cfg)
        print(f"  Train: {len(X_train):,} rows | Test: {len(X_test):,} rows")

        results = {}
        for algo_name, factory in ALGORITHMS.items():
            print(f"  Training {algo_name} ...", end="", flush=True)
            try:
                metrics = benchmark_one(
                    algo_name, factory, X_train, y_train, X_test, y_test
                )
                results[algo_name] = metrics
                print(f"  R2={metrics['R2']:.4f}")
            except Exception as e:
                print(f"  FAILED: {e}")

        print_results_table(target_name, results)

        # Record winner
        best_algo = max(results.items(), key=lambda x: x[1]["R2"])
        winners[target_name] = (best_algo[0], best_algo[1])

    # Final summary
    print(f"\n{'='*70}")
    print("  FINAL RECOMMENDATION")
    print(f"{'='*70}")
    for target, (algo, m) in winners.items():
        print(f"  {target:<22} -> {algo:<22} (R2={m['R2']:.4f}, RMSE={m['RMSE']:.4f})")
    print(f"{'='*70}\n")


if __name__ == "__main__":
    main()
