"""
UrbanMind - Train All Models + Clustering + Anomaly Detection
================================================================
One-shot script that:
  1. Loads processed data
  2. Trains all ML models (Traffic, Pollution, Transport)
  3. Runs urban district clustering
  4. Runs anomaly detection
  5. Saves all outputs

Usage:
    cd Abhishek/
    python train_all.py
"""

import os
import sys

# Ensure Abhishek/ is on the path so config and packages resolve correctly
sys.path.insert(0, os.path.dirname(__file__))

import config
from models.base_model import BaseUrbanModel
from models.traffic_model import TrafficPredictor
from models.pollution_model import PollutionPredictor
from models.transport_model import TransportDemandPredictor
from clustering.urban_clusters import UrbanClusterer
from anomaly.anomaly_detector import AnomalyDetector


# Expected healthy RMSE ranges (normalised 0-1 scale)
EXPECTED_RMSE = {
    "TrafficPredictor": (0.03, 0.10),
    "PollutionPredictor": (0.03, 0.10),
    "TransportDemandPredictor": (0.04, 0.10),
}


def _check_rmse(model_name: str, metrics: dict) -> str:
    """Return a status icon based on 1h RMSE range check."""
    rmse_1h = metrics.get("RMSE_1h", None)
    if rmse_1h is None:
        return "[?]"
    lo, hi = EXPECTED_RMSE.get(model_name, (0, 1))
    return "[OK]" if lo <= rmse_1h <= hi else "[!!]"


def main() -> None:
    """Load data, train all models, cluster, detect anomalies."""

    print("=" * 60)
    print("  UrbanMind - Full Pipeline")
    print("=" * 60)

    # ------------------------------------------------------------------
    # 1. Load processed data
    # ------------------------------------------------------------------
    print(f"\n[*] Loading data from {config.DATA_PATH} ...")
    df = BaseUrbanModel.load_data(config.DATA_PATH)
    print(f"[ok] Dataset shape: {df.shape}")
    print(f"[ok] Columns: {list(df.columns)}")

    # ------------------------------------------------------------------
    # 2. Train ML models
    # ------------------------------------------------------------------
    models: list[BaseUrbanModel] = [
        TrafficPredictor(),
        PollutionPredictor(),
        TransportDemandPredictor(),
    ]

    results: list[tuple[str, dict]] = []

    for model in models:
        print(f"\n{'_' * 60}")
        print(f"  Training: {model.MODEL_NAME} ({model.ALGORITHM})")
        print(f"{'_' * 60}")

        model.train(df)
        metrics = model.evaluate(df)
        model.save()
        results.append((model.MODEL_NAME, metrics))

    # Print model summary
    print("\n" + "=" * 60)
    print("  MODEL TRAINING SUMMARY")
    print("=" * 60)
    for name, metrics in results:
        rmse_1h = metrics.get("RMSE_1h", 0)
        r2_1h = metrics.get("R2_1h", 0)
        status = _check_rmse(name, metrics)
        print(f"  {status} {name:30s} -> RMSE: {rmse_1h:.4f} | R2: {r2_1h:.4f} | saved")

    # ------------------------------------------------------------------
    # 3. Urban clustering
    # ------------------------------------------------------------------
    print(f"\n{'_' * 60}")
    print("  Running: Urban District Clustering")
    print(f"{'_' * 60}")

    clusterer = UrbanClusterer()
    cluster_df = clusterer.cluster(df, n_clusters=4)
    cluster_path = os.path.join(config.OUTPUT_DIR, "clusters.json")
    clusterer.save_results(cluster_df, path=cluster_path)

    # ------------------------------------------------------------------
    # 4. Anomaly detection
    # ------------------------------------------------------------------
    print(f"\n{'_' * 60}")
    print("  Running: Anomaly Detection")
    print(f"{'_' * 60}")

    detector = AnomalyDetector(contamination=0.05)
    alerts = detector.detect(df)
    alerts_path = os.path.join(config.OUTPUT_DIR, "alerts.json")
    detector.save_alerts(alerts, path=alerts_path)

    # ------------------------------------------------------------------
    # 5. Final status
    # ------------------------------------------------------------------
    print("=" * 60)
    print("  PIPELINE COMPLETE")
    print("=" * 60)
    print(f"  [ok] ML Models trained  : {len(models)}")
    print(f"  [ok] Clustering done    : {cluster_path}")
    print(f"  [ok] Anomaly detection  : {alerts_path}")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    main()
