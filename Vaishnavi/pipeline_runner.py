"""
pipeline_runner.py — UrbanMind Smart City Analytics Platform
=============================================================
Full orchestration script that executes the end-to-end data pipeline:

    1. Load all 5 clean CSVs from sample_data/
    2. Merge on [timestamp, district_id]
    3. Clean the merged dataset
    4. Engineer features
    5. Save to output/processed_data.csv
    6. Upload to Firestore collection 'processed_data'
    7. Print pipeline summary

Usage:
    python pipeline_runner.py
    python pipeline_runner.py --skip-upload   # skip Firestore upload
"""

from __future__ import annotations

import argparse
import logging
import os
import sys
import time

import pandas as pd

# ── Resolve paths ───────────────────────────────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, SCRIPT_DIR)

SAMPLE_DIR = os.path.join(SCRIPT_DIR, "data_pipeline", "sample_data")
OUTPUT_DIR = os.path.join(SCRIPT_DIR, "output")
CREDENTIALS = os.path.join(SCRIPT_DIR, "firebase_credentials.json")
SCALER_PATH = os.path.join(SCRIPT_DIR, "data_pipeline", "scalers.json")

os.makedirs(OUTPUT_DIR, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)

# ── Pipeline imports ────────────────────────────────────────────────
from data_pipeline.ingestor import DataIngestor
from data_pipeline.cleaner import DataCleaner
from data_pipeline.feature_engineer import FeatureEngineer

# ── Source files ────────────────────────────────────────────────────
SOURCE_FILES = [
    "pollution_clean.csv",
    "traffic_clean.csv",
    "energy_clean.csv",
    "transport_clean.csv",
    "water_waste_clean.csv",
]


def run_pipeline(skip_upload: bool = False) -> None:
    """Execute the full UrbanMind data pipeline."""

    t_start = time.time()
    print()
    print("=" * 62)
    print("  UrbanMind — Smart City Data Pipeline")
    print("=" * 62)

    # ── Step 1: Load ────────────────────────────────────────────────
    print("\n▸ Step 1 — Loading source CSVs")
    ingestor = DataIngestor()
    loaded: list[pd.DataFrame] = []

    for fname in SOURCE_FILES:
        fpath = os.path.join(SAMPLE_DIR, fname)
        if not os.path.exists(fpath):
            logger.warning("  ⚠ %s not found — skipping", fname)
            continue
        df = ingestor.load_csv(fpath)
        print(f"    ✅ {fname:<28s} → {len(df):>6,} rows × {len(df.columns)} cols")
        loaded.append(df)

    if len(loaded) < 2:
        logger.error("Need at least 2 source files to merge. Aborting.")
        sys.exit(1)

    input_rows = sum(len(d) for d in loaded)

    # ── Step 2: Merge ───────────────────────────────────────────────
    print("\n▸ Step 2 — Merging on [timestamp, district_id]")
    merged = ingestor.merge_datasets(loaded, on=["timestamp", "district_id"])
    print(f"    Merged: {len(merged):,} rows × {len(merged.columns)} cols")

    # ── Step 3: Clean ───────────────────────────────────────────────
    print("\n▸ Step 3 — Cleaning")
    cleaner = DataCleaner(scaler_path=SCALER_PATH)
    cleaned = cleaner.clean(merged)
    after_clean = len(cleaned)
    print(f"    After cleaning: {after_clean:,} rows")

    # ── Step 4: Feature engineering ─────────────────────────────────
    print("\n▸ Step 4 — Feature engineering")
    fe = FeatureEngineer()
    engineered = fe.engineer(cleaned)
    new_features = len(engineered.columns) - len(cleaned.columns)
    print(f"    After engineering: {len(engineered):,} rows (added {new_features} features)")

    # ── Step 5: Save ────────────────────────────────────────────────
    print("\n▸ Step 5 — Saving to output/processed_data.csv")
    out_path = os.path.join(OUTPUT_DIR, "processed_data.csv")
    engineered.to_csv(out_path, index=False)
    size_mb = os.path.getsize(out_path) / (1024 * 1024)
    print(f"    ✅ Saved: {out_path} ({size_mb:.1f} MB)")

    # ── Step 6: Upload to Firestore ─────────────────────────────────
    uploaded_count = 0
    if skip_upload:
        print("\n▸ Step 6 — Firestore upload SKIPPED (--skip-upload)")
    else:
        print("\n▸ Step 6 — Uploading to Firestore collection: 'processed_data'")
        try:
            from data_pipeline.firebase_uploader import FirebaseUploader

            uploader = FirebaseUploader(CREDENTIALS)
            result = uploader.upload_batch(engineered, collection="processed_data")
            uploaded_count = result["uploaded"]
            print(f"    ✅ Uploaded: {uploaded_count:,} docs  |  Failed: {result['failed']}")
        except ImportError:
            print("    ⚠ firebase-admin not installed — skipping upload")
            print("      Install with: pip install firebase-admin")
        except FileNotFoundError:
            print(f"    ⚠ Credentials not found at {CREDENTIALS} — skipping upload")
        except Exception as exc:
            logger.error("    ❌ Firestore upload failed: %s", exc)

    # ── Step 7: Summary ────────────────────────────────────────────
    elapsed = time.time() - t_start
    print()
    print("─" * 62)
    print("  Pipeline Complete")
    print("─" * 62)
    print(f"  Input rows:                  {input_rows:,}")
    print(f"  After cleaning:              {after_clean:,}")
    print(f"  After feature engineering:   {len(engineered):,} (added {new_features} features)")
    if not skip_upload:
        print(f"  Uploaded to Firestore:       {uploaded_count:,} docs")
    print(f"  Output:                      {out_path}")
    print(f"  Scaler params:               {SCALER_PATH}")
    print(f"  Elapsed:                     {elapsed:.1f}s")
    print(f"  Final schema ({len(engineered.columns)} cols):")
    print(f"    {list(engineered.columns)}")
    print("─" * 62)
    print()


# ── CLI ─────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        description="UrbanMind — run the full data pipeline"
    )
    parser.add_argument(
        "--skip-upload",
        action="store_true",
        help="Skip the Firestore upload step",
    )
    args = parser.parse_args()
    run_pipeline(skip_upload=args.skip_upload)


if __name__ == "__main__":
    main()
