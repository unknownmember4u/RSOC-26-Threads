"""
UrbanMind - Urban District Clustering
======================================
Groups districts by similarity using KMeans and DBSCAN on multi-metric
profiles. Auto-labels clusters based on centroid characteristics.
"""

from __future__ import annotations

import json
import os
from typing import Any, Dict, List, Optional

import numpy as np
import pandas as pd
from sklearn.cluster import KMeans, DBSCAN
from sklearn.preprocessing import MinMaxScaler


# Metrics used for clustering (must match dataset column names)
CLUSTER_FEATURES = ["traffic_density", "aqi", "consumption_kwh", "transport_load"]

# Weights for risk score computation
RISK_WEIGHTS = {
    "traffic_density": 0.4,
    "aqi": 0.4,
    "consumption_kwh": 0.2,
}

# Auto-label rules: (condition_fn, label)
# Applied to normalised centroids: [traffic, aqi, energy, transport]
LABEL_RULES = [
    ("High Congestion Zone",    lambda c: c[0] == max(c) and c[1] >= np.median(c)),
    ("Industrial Hotspot",      lambda c: c[1] == max(c) and c[0] < c[1]),
    ("Clean Energy District",   lambda c: c[1] == min(c) and c[0] <= np.median(c)),
    ("Balanced Urban Zone",     lambda c: True),  # fallback
]


class UrbanClusterer:
    """Cluster city districts based on aggregated urban metrics."""

    def __init__(self) -> None:
        self.scaler = MinMaxScaler()
        self.kmeans: Optional[KMeans] = None
        self.result_df: Optional[pd.DataFrame] = None

    # ------------------------------------------------------------------
    # Core clustering
    # ------------------------------------------------------------------

    def cluster(self, df: pd.DataFrame, n_clusters: int = 4) -> pd.DataFrame:
        """Run KMeans + DBSCAN clustering on district-aggregated metrics.

        Parameters
        ----------
        df : pd.DataFrame
            Raw processed data with ``district_id`` and metric columns.
        n_clusters : int
            Number of KMeans clusters.

        Returns
        -------
        pd.DataFrame
            Columns: district_id, cluster_id, cluster_label, risk_score, lat, lng
        """

        # ---- Step 1: Aggregate per district ----
        metrics = df.groupby("district_id").agg({
            "traffic_density": "mean",
            "aqi": "mean",
            "consumption_kwh": "mean",
            "transport_load": "mean",
        }).reset_index()

        # ---- Step 2: Normalise to [0, 1] ----
        feature_matrix = metrics[CLUSTER_FEATURES].values
        normalised = self.scaler.fit_transform(feature_matrix)
        norm_df = pd.DataFrame(normalised, columns=CLUSTER_FEATURES)

        # ---- Step 3: KMeans ----
        self.kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        km_labels = self.kmeans.fit_predict(normalised)

        # ---- Step 4: DBSCAN for comparison ----
        dbscan = DBSCAN(eps=0.3, min_samples=2)
        db_labels = dbscan.fit_predict(normalised)

        # Print side-by-side comparison
        print("\n" + "=" * 60)
        print("  CLUSTERING COMPARISON")
        print("=" * 60)
        print(f"  {'District':<14} {'KMeans':<10} {'DBSCAN':<10}")
        print(f"  {'-'*14} {'-'*10} {'-'*10}")
        for i, did in enumerate(metrics["district_id"]):
            db_lbl = db_labels[i] if db_labels[i] != -1 else "noise"
            print(f"  {did:<14} {km_labels[i]:<10} {str(db_lbl):<10}")

        n_db_clusters = len(set(db_labels) - {-1})
        n_noise = list(db_labels).count(-1)
        print(f"\n  KMeans clusters: {n_clusters}")
        print(f"  DBSCAN clusters: {n_db_clusters} (+ {n_noise} noise points)")
        print(f"  Using KMeans as final assignment.\n")

        # ---- Step 5: Auto-label clusters ----
        centroids = self.kmeans.cluster_centers_  # shape (n_clusters, 4)
        cluster_labels_map = self._auto_label_clusters(centroids)

        # ---- Step 6: Risk score per district ----
        risk_scores = (
            RISK_WEIGHTS["traffic_density"] * norm_df["traffic_density"]
            + RISK_WEIGHTS["aqi"] * norm_df["aqi"]
            + RISK_WEIGHTS["consumption_kwh"] * norm_df["consumption_kwh"]
        ).clip(0.0, 1.0).values

        # ---- Step 7: Lat/lng from district lookup ----
        district_coords = df.groupby("district_id").agg({
            "lat": "mean",
            "lng": "mean",
        }).reset_index()

        # Build result DataFrame
        result = pd.DataFrame({
            "district_id": metrics["district_id"],
            "cluster_id": km_labels.astype(int),
            "cluster_label": [cluster_labels_map[c] for c in km_labels],
            "risk_score": np.round(risk_scores, 4),
        })
        result = result.merge(district_coords, on="district_id", how="left")

        self.result_df = result
        return result

    # ------------------------------------------------------------------
    # Auto-labelling
    # ------------------------------------------------------------------

    @staticmethod
    def _auto_label_clusters(centroids: np.ndarray) -> Dict[int, str]:
        """Assign human-readable labels to clusters based on centroids."""
        labels: Dict[int, str] = {}
        used: set = set()

        # Sort clusters by overall magnitude to get a stable assignment
        for idx in range(len(centroids)):
            c = centroids[idx]
            for label, condition in LABEL_RULES:
                if label not in used and condition(c):
                    labels[idx] = label
                    used.add(label)
                    break
            else:
                labels[idx] = "Balanced Urban Zone"

        return labels

    # ------------------------------------------------------------------
    # Save results
    # ------------------------------------------------------------------

    def save_results(
        self,
        df: Optional[pd.DataFrame] = None,
        path: str = "output/clusters.json",
    ) -> str:
        """Save cluster results as JSON and print summary.

        Parameters
        ----------
        df : pd.DataFrame, optional
            Cluster results. Uses last ``cluster()`` output if not given.
        path : str
            Output file path.

        Returns
        -------
        str
            Absolute path to saved file.
        """
        if df is None:
            df = self.result_df
        if df is None:
            raise RuntimeError("No clustering results. Run cluster() first.")

        os.makedirs(os.path.dirname(path), exist_ok=True)
        records = df.to_dict(orient="records")

        with open(path, "w", encoding="utf-8") as f:
            json.dump(records, f, indent=2, default=str)

        # Print summary
        print("\n" + "-" * 50)
        print("  CLUSTER ASSIGNMENTS")
        print("-" * 50)
        for cid in sorted(df["cluster_id"].unique()):
            subset = df[df["cluster_id"] == cid]
            label = subset["cluster_label"].iloc[0]
            districts = ", ".join(subset["district_id"].tolist())
            print(f"  Cluster {cid} - {label}: {districts}")
        print(f"\n  [saved] {os.path.abspath(path)}\n")

        return os.path.abspath(path)
