"""
generate_synthetic.py — UrbanMind Data Pipeline
Generates ONLY water_waste_clean.csv synthetically.

Step 5: Water + Waste data using exact same timestamps and district_ids
         from pollution_clean.csv.
"""
import os
import sys
import warnings
warnings.filterwarnings('ignore')

import pandas as pd
import numpy as np

np.random.seed(42)

# ─── Paths ─────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SAMPLE_DIR = os.path.join(BASE_DIR, 'data_pipeline', 'sample_data')

# Population proxy per district (for waste correlation)
# D05 Pimpri has highest population
DISTRICT_POP_FACTOR = {
    'D01': 1.10,  # Shivajinagar
    'D02': 0.95,  # Kothrud
    'D03': 1.05,  # Hadapsar
    'D04': 0.85,  # Wakad
    'D05': 1.30,  # Pimpri (highest)
    'D06': 0.90,  # Baner
    'D07': 0.80,  # Magarpatta
    'D08': 0.88,  # Kharadi
    'D09': 0.92,  # Viman Nagar
    'D10': 1.15,  # Swargate
}


def generate_water_waste():
    """
    Step 5: Generate synthetic water + waste data.
    Uses EXACT same timestamps and district_ids from pollution_clean.csv.
    """
    print("\n" + "━" * 60)
    print("  STEP 5 — Generating Synthetic Water + Waste Data")
    print("━" * 60)

    # Load pollution_clean.csv for timestamps and district_ids
    pollution_path = os.path.join(SAMPLE_DIR, 'pollution_clean.csv')
    if not os.path.exists(pollution_path):
        raise FileNotFoundError(
            f"pollution_clean.csv not found at {pollution_path}. "
            "Run adapt_real_data.py first."
        )

    poll_df = pd.read_csv(pollution_path)
    timestamps = pd.to_datetime(poll_df['timestamp'].unique())
    district_ids = sorted(poll_df['district_id'].unique())

    print(f"  Using {len(timestamps)} timestamps × {len(district_ids)} districts")
    print(f"  Timestamp range: {timestamps.min()} → {timestamps.max()}")

    rows = []
    for ts in timestamps:
        hour = ts.hour
        dow = ts.dayofweek
        is_weekend = dow >= 5

        for did in district_ids:
            pop_factor = DISTRICT_POP_FACTOR.get(did, 1.0)

            # ─── Water (liters per district per hour) ──────────────
            water_base = np.random.uniform(15000, 20000)

            # Morning spike (6–9 AM): +40%
            if 6 <= hour <= 9:
                water_factor = 1.4
            # Night (11 PM–5 AM): -60%
            elif hour >= 23 or hour <= 5:
                water_factor = 0.4
            # Daytime normal
            elif 10 <= hour <= 17:
                water_factor = 1.0
            # Evening
            else:
                water_factor = 1.1

            # Weekend: +10% (people home longer)
            if is_weekend:
                water_factor *= 1.10

            water_liters = water_base * water_factor * pop_factor
            water_liters += np.random.normal(0, 500)  # noise
            water_liters = max(500, water_liters)

            # ─── Waste (kg per district per hour) ──────────────────
            waste_base = np.random.uniform(300, 500)

            # Mid-morning peak (9–11 AM): +30%
            if 9 <= hour <= 11:
                waste_factor = 1.3
            # Post-lunch (1–3 PM): +20%
            elif 13 <= hour <= 15:
                waste_factor = 1.2
            # Night: -50%
            elif hour >= 22 or hour <= 5:
                waste_factor = 0.5
            else:
                waste_factor = 1.0

            waste_kg = waste_base * waste_factor * pop_factor
            waste_kg += np.random.normal(0, 20)  # noise
            waste_kg = max(10, waste_kg)

            # ─── Inject 3% anomaly spikes ──────────────────────────
            if np.random.random() < 0.03:
                spike = np.random.uniform(2.0, 4.0)
                if np.random.random() < 0.5:
                    water_liters *= spike
                else:
                    waste_kg *= spike

            rows.append({
                'timestamp': ts.strftime('%Y-%m-%d %H:%M:%S'),
                'district_id': did,
                'water_liters': round(water_liters, 1),
                'waste_kg': round(waste_kg, 1),
            })

    result = pd.DataFrame(rows)

    outpath = os.path.join(SAMPLE_DIR, 'water_waste_clean.csv')
    result.to_csv(outpath, index=False)
    print(f"\n  ✅ water_waste_clean.csv → {len(result):,} rows")
    print(f"     Saved to: {outpath}")

    # Quick stats
    print(f"\n  Water stats (liters/hr):")
    print(f"    Min: {result['water_liters'].min():.0f}")
    print(f"    Mean: {result['water_liters'].mean():.0f}")
    print(f"    Max: {result['water_liters'].max():.0f}")
    print(f"\n  Waste stats (kg/hr):")
    print(f"    Min: {result['waste_kg'].min():.0f}")
    print(f"    Mean: {result['waste_kg'].mean():.0f}")
    print(f"    Max: {result['waste_kg'].max():.0f}")

    # Count anomalies
    water_q99 = result['water_liters'].quantile(0.99)
    waste_q99 = result['waste_kg'].quantile(0.99)
    n_water_anom = (result['water_liters'] > water_q99).sum()
    n_waste_anom = (result['waste_kg'] > waste_q99).sum()
    print(f"\n  Anomalies (>99th pctile): water={n_water_anom}, waste={n_waste_anom}")

    return result


if __name__ == '__main__':
    print("=" * 60)
    print("  UrbanMind — Generating Synthetic Water + Waste Data")
    print("=" * 60)
    generate_water_waste()
    print("\n" + "=" * 60)
    print("  ✅ Done! Now run adapt_real_data.py to merge all datasets.")
    print("=" * 60)
