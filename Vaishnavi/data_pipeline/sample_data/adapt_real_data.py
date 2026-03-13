"""
adapt_real_data.py — UrbanMind Data Pipeline
Adapts real CSV datasets to the unified schema for Pune Smart City.

Steps 1–4:
  1. Pollution data (air_quality.csv.csv) → pollution_clean.csv
  2. Traffic data (generated from patterns) → traffic_clean.csv
  3. Energy data (energy_data.csv.csv calibrated) → energy_clean.csv
  4. Transport data (generated from fleet info) → transport_clean.csv

Also runs Step 6: Merge all + water_waste into processed_data_raw.csv
"""
import sys
import os
import warnings
warnings.filterwarnings('ignore')

import pandas as pd
import numpy as np

# ─── Add parent to path so we can import pipeline modules ──────────────
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))
from data_pipeline.ingestor import read_csv_flexible, inspect_csv, DISTRICT_COORDS, add_coordinates
from data_pipeline.cleaner import fill_missing, normalize_timestamp, validate_schema, REQUIRED_COLUMNS

np.random.seed(42)

# ─── Paths ─────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
RAW_DIR = BASE_DIR  # CSVs are in the rsoc root
SAMPLE_DIR = os.path.join(BASE_DIR, 'data_pipeline', 'sample_data')
OUTPUT_DIR = os.path.join(BASE_DIR, 'output')
os.makedirs(SAMPLE_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Map 10 cities from air_quality dataset to Pune districts
CITY_TO_DISTRICT = {}  # Will be populated after inspecting data


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  STEP 1 — Adapt Pollution Data
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def find_best_30day_window(df):
    """Find the 30-day window with the most non-null data rows."""
    df['_date'] = pd.to_datetime(df['Date'], errors='coerce')
    df = df.dropna(subset=['_date'])
    df = df.sort_values('_date')

    # Count non-null AQI or PM2.5 per date
    df['_has_data'] = df[['PM2.5', 'AQI']].notna().any(axis=1).astype(int)

    best_start = None
    best_count = 0
    dates = df['_date'].unique()

    # Try windows starting from the end (prefer recent data)
    for i in range(len(dates) - 1, -1, -1):
        end_date = dates[i]
        start_date = end_date - pd.Timedelta(days=30)
        mask = (df['_date'] >= start_date) & (df['_date'] <= end_date)
        count = df.loc[mask, '_has_data'].sum()
        if count > best_count:
            best_count = count
            best_start = start_date
            best_end = end_date

    # If best window is poor, just use the most recent 30 days with any data
    if best_count < 50:
        latest = df.loc[df['_has_data'] == 1, '_date'].max()
        best_end = latest
        best_start = latest - pd.Timedelta(days=30)

    return best_start, best_end


def select_best_cities(df, start_date, end_date, n=10):
    """Select n cities with the most data points in the date window."""
    mask = (df['_date'] >= start_date) & (df['_date'] <= end_date)
    window_df = df[mask].copy()
    window_df['_has_data'] = window_df[['PM2.5', 'AQI']].notna().any(axis=1).astype(int)
    city_counts = window_df.groupby('City')['_has_data'].sum().sort_values(ascending=False)
    return list(city_counts.head(n).index)


def adapt_pollution():
    """Step 1: Adapt air_quality.csv to pollution_clean.csv."""
    print("\n" + "━" * 60)
    print("  STEP 1 — Adapting Pollution Data (air_quality.csv)")
    print("━" * 60)

    filepath = os.path.join(RAW_DIR, 'air_quality.csv.csv')
    df = inspect_csv(filepath)

    # Parse dates
    df['_date'] = pd.to_datetime(df['Date'], errors='coerce')
    df = df.dropna(subset=['_date'])
    df['City'] = df['City'].str.strip()

    # Find best 30-day window
    start_date, end_date = find_best_30day_window(df)
    print(f"  Selected 30-day window: {start_date.date()} to {end_date.date()}")

    # Select 10 best cities
    cities = select_best_cities(df, start_date, end_date, n=10)
    print(f"  Selected cities: {cities}")

    # Map cities to districts
    district_ids = [f'D{i+1:02d}' for i in range(10)]
    city_to_district = dict(zip(cities, district_ids))
    print(f"  Mapping:")
    for city, did in city_to_district.items():
        name = DISTRICT_COORDS[did][0]
        print(f"    {city} → {did} ({name})")

    # Store globally for other steps
    global CITY_TO_DISTRICT, GLOBAL_START, GLOBAL_END
    CITY_TO_DISTRICT = city_to_district
    GLOBAL_START = start_date
    GLOBAL_END = end_date

    # Filter to selected cities and window
    mask = (
        (df['_date'] >= start_date) &
        (df['_date'] <= end_date) &
        (df['City'].isin(cities))
    )
    filtered = df[mask].copy()
    filtered['district_id'] = filtered['City'].map(city_to_district)

    # Rename columns to target schema
    col_map = {'_date': 'timestamp', 'PM2.5': 'pm25', 'AQI': 'aqi'}
    filtered = filtered.rename(columns=col_map)

    # PM10 — check if usable, else generate synthetically
    if 'PM10' in filtered.columns and filtered['PM10'].notna().sum() > 10:
        filtered = filtered.rename(columns={'PM10': 'pm10'})
    else:
        print("  ⚠️ 'PM10' not found or mostly empty — generated synthetically")
        filtered['pm10'] = filtered['pm25'] * np.random.uniform(1.2, 2.0, size=len(filtered))

    # Generate weather_temp and weather_humidity synthetically
    print("  ⚠️ 'weather_temp' not found — generated synthetically")
    aqi_vals = filtered['aqi'].fillna(filtered['aqi'].median())
    filtered['weather_temp'] = 28 + (aqi_vals / 200) * 8 + np.random.normal(0, 1, size=len(filtered))

    print("  ⚠️ 'weather_humidity' not found — generated synthetically")
    filtered['weather_humidity'] = 65 - (aqi_vals / 200) * 15 + np.random.normal(0, 2, size=len(filtered))

    # Keep only target columns
    keep = ['timestamp', 'district_id', 'pm25', 'pm10', 'aqi', 'weather_temp', 'weather_humidity']
    filtered = filtered[keep].copy()

    # Resample to hourly per district with linear interpolation
    hourly_frames = []
    for did in district_ids:
        dist_df = filtered[filtered['district_id'] == did].copy()
        dist_df = dist_df.set_index('timestamp')
        dist_df.index = pd.to_datetime(dist_df.index)
        dist_df = dist_df.drop(columns=['district_id'])

        # Remove duplicate timestamps
        dist_df = dist_df[~dist_df.index.duplicated(keep='first')]

        # Resample to hourly
        dist_df = dist_df.resample('h').mean()
        dist_df = dist_df.interpolate(method='linear', limit_direction='both')

        dist_df['district_id'] = did
        dist_df = dist_df.reset_index()
        dist_df = dist_df.rename(columns={'index': 'timestamp'})
        hourly_frames.append(dist_df)

    result = pd.concat(hourly_frames, ignore_index=True)

    # Fill remaining NaN with column median
    result = fill_missing(result, strategy='median')

    # Format timestamps
    result['timestamp'] = pd.to_datetime(result['timestamp']).dt.strftime('%Y-%m-%d %H:%M:%S')

    # Save
    outpath = os.path.join(SAMPLE_DIR, 'pollution_clean.csv')
    result.to_csv(outpath, index=False)
    print(f"\n  ✅ pollution_clean.csv → {len(result)} rows")
    print(f"     Saved to: {outpath}")
    return result


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  STEP 2 — Generate Traffic Data
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def adapt_traffic(pollution_df):
    """Step 2: Generate realistic traffic data using same timestamps/districts."""
    print("\n" + "━" * 60)
    print("  STEP 2 — Generating Traffic Data")
    print("━" * 60)

    # Inspect the traffic file (it's a station registry)
    filepath = os.path.join(RAW_DIR, 'traffic_data.csv.csv')
    inspect_csv(filepath)
    print("  ⚠️ traffic_data.csv is a station registry, NOT time-series data")
    print("     → Generating realistic traffic data synthetically")

    # Use same timestamps and districts from pollution data
    timestamps = pd.to_datetime(pollution_df['timestamp'].unique())
    district_ids = sorted(pollution_df['district_id'].unique())

    # District-specific base vehicle counts (commercial areas busier)
    district_base = {
        'D01': 1200,  # Shivajinagar - central, very busy
        'D02': 800,   # Kothrud - residential
        'D03': 900,   # Hadapsar - IT hub
        'D04': 700,   # Wakad - suburban
        'D05': 1100,  # Pimpri - industrial
        'D06': 750,   # Baner - mixed
        'D07': 850,   # Magarpatta - IT city
        'D08': 800,   # Kharadi - IT hub
        'D09': 900,   # Viman Nagar - commercial
        'D10': 1300,  # Swargate - major transport hub
    }

    rows = []
    for ts in timestamps:
        hour = ts.hour
        dow = ts.dayofweek  # 0=Mon, 6=Sun
        is_weekend = dow >= 5

        # Time-of-day traffic pattern
        if 8 <= hour <= 10:       # Morning rush
            time_factor = 1.8
        elif 17 <= hour <= 19:    # Evening rush
            time_factor = 1.9
        elif 12 <= hour <= 14:    # Lunch
            time_factor = 1.2
        elif 22 <= hour or hour <= 5:  # Night
            time_factor = 0.2
        else:
            time_factor = 1.0

        # Weekend reduction
        if is_weekend:
            time_factor *= 0.6

        for did in district_ids:
            base = district_base.get(did, 800)
            vehicle_count = int(base * time_factor * np.random.uniform(0.85, 1.15))
            vehicle_count = max(10, vehicle_count)

            # Speed inversely correlated with traffic volume
            max_base = max(district_base.values())
            normalized = vehicle_count / (max_base * 2.0)
            avg_speed = 60 * (1 - min(normalized, 0.85)) + np.random.normal(0, 3)
            avg_speed = max(5, min(80, avg_speed))

            rows.append({
                'timestamp': ts.strftime('%Y-%m-%d %H:%M:%S'),
                'district_id': did,
                'vehicle_count': vehicle_count,
                'avg_speed_kmh': round(avg_speed, 1),
            })

    result = pd.DataFrame(rows)

    # Incident flag: 1 if vehicle_count > 95th percentile
    p95 = result['vehicle_count'].quantile(0.95)
    result['incident_flag'] = (result['vehicle_count'] > p95).astype(int)

    print(f"  ⚠️ 'vehicle_count' — generated synthetically (rush-hour patterns)")
    print(f"  ⚠️ 'avg_speed_kmh' — derived from vehicle_count")
    print(f"  ⚠️ 'incident_flag' — generated (>95th percentile)")

    outpath = os.path.join(SAMPLE_DIR, 'traffic_clean.csv')
    result.to_csv(outpath, index=False)
    print(f"\n  ✅ traffic_clean.csv → {len(result)} rows")
    print(f"     Saved to: {outpath}")
    return result


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  STEP 3 — Adapt Energy Data
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def adapt_energy(pollution_df):
    """Step 3: Adapt energy_data.csv to hourly energy consumption."""
    print("\n" + "━" * 60)
    print("  STEP 3 — Adapting Energy Data")
    print("━" * 60)

    filepath = os.path.join(RAW_DIR, 'energy_data.csv.csv')
    raw = inspect_csv(filepath)

    # The energy data has annual totals in lakh units.
    # Find a Pune-area entry to calibrate. Pimpri Chinchwad row exists.
    # Use its total consumption to derive a per-hour baseline.
    total_col = [c for c in raw.columns if 'total' in c.lower() or 'Total' in c]
    if total_col:
        total_col = total_col[0]
    else:
        total_col = raw.columns[-1]

    # Try to find Pune/Pimpri data
    pune_rows = raw[raw.iloc[:, 0].str.strip().str.lower().str.contains('pimpri|pune', na=False)]
    if len(pune_rows) > 0:
        # Get total consumption (in lakh units = 100,000 units)
        total_val = pd.to_numeric(pune_rows[total_col].iloc[0], errors='coerce')
        if pd.notna(total_val):
            annual_kwh = total_val * 100000  # Convert lakh units to units (kWh approximation)
        else:
            annual_kwh = 500000000  # Default fallback
        print(f"  Using Pimpri Chinchwad data: {total_val} lakh units → {annual_kwh:.0f} kWh/year")
    else:
        annual_kwh = 500000000
        print("  ⚠️ Pune data not found — using default annual consumption")

    # Per-district hourly base (divide by 10 districts, 8760 hours)
    hourly_base = annual_kwh / (10 * 8760)
    print(f"  Hourly base per district: {hourly_base:.1f} kWh")

    timestamps = pd.to_datetime(pollution_df['timestamp'].unique())
    district_ids = sorted(pollution_df['district_id'].unique())

    # District variation factors (industrial areas use more)
    district_factor = {
        'D01': 1.15,  # Shivajinagar - central commercial
        'D02': 0.90,  # Kothrud - residential
        'D03': 1.10,  # Hadapsar - IT/commercial
        'D04': 0.85,  # Wakad - suburban
        'D05': 1.25,  # Pimpri - industrial hub
        'D06': 0.95,  # Baner - mixed
        'D07': 1.10,  # Magarpatta - IT city
        'D08': 1.05,  # Kharadi - IT hub
        'D09': 1.00,  # Viman Nagar - commercial
        'D10': 1.10,  # Swargate - transport hub
    }

    rows = []
    for ts in timestamps:
        hour = ts.hour
        dow = ts.dayofweek

        # Time-of-day energy pattern
        if 9 <= hour <= 17:        # Business hours - high
            time_factor = 1.4
        elif 18 <= hour <= 22:     # Evening - medium-high
            time_factor = 1.3
        elif 6 <= hour <= 8:       # Morning ramp-up
            time_factor = 1.1
        elif 23 <= hour or hour <= 5:  # Night - low
            time_factor = 0.5
        else:
            time_factor = 0.8

        # Weekend slightly lower (no commercial)
        if dow >= 5:
            time_factor *= 0.85

        for did in district_ids:
            base = hourly_base * district_factor.get(did, 1.0)
            consumption = base * time_factor * np.random.uniform(0.9, 1.1)
            consumption = max(10, consumption)

            rows.append({
                'timestamp': ts.strftime('%Y-%m-%d %H:%M:%S'),
                'district_id': did,
                'consumption_kwh': round(consumption, 2),
                'peak_demand_kw': round(consumption * 1.3, 2),
                'renewable_pct': round(15 + np.random.uniform(-5, 10), 1),
            })

    result = pd.DataFrame(rows)

    print(f"  ⚠️ 'consumption_kwh' — derived from annual totals with time patterns")
    print(f"  ⚠️ 'peak_demand_kw' — consumption_kwh * 1.3")
    print(f"  ⚠️ 'renewable_pct' — generated synthetically")

    outpath = os.path.join(SAMPLE_DIR, 'energy_clean.csv')
    result.to_csv(outpath, index=False)
    print(f"\n  ✅ energy_clean.csv → {len(result)} rows")
    print(f"     Saved to: {outpath}")
    return result


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  STEP 4 — Adapt Transport Data
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def adapt_transport(pollution_df, traffic_df):
    """Step 4: Generate realistic transport data using fleet info + traffic."""
    print("\n" + "━" * 60)
    print("  STEP 4 — Adapting Transport Data")
    print("━" * 60)

    filepath = os.path.join(RAW_DIR, 'transport_data.csv.csv')
    raw = inspect_csv(filepath)
    print("  ⚠️ transport_data.csv is a static fleet summary, NOT ridership data")
    print("     → Generating synthetic ridership with rush-hour patterns")

    # Pune has 2035 buses (AC: 10, Non AC: 2025)
    pune_buses = raw[raw.iloc[:, 0].str.strip().str.lower().str.contains('pune', na=False)]
    if len(pune_buses) > 0:
        print(f"  Found Pune fleet data:")
        print(pune_buses.to_string(index=False))
    else:
        print("  ⚠️ Pune fleet data not found")

    timestamps = pd.to_datetime(pollution_df['timestamp'].unique())
    district_ids = sorted(pollution_df['district_id'].unique())
    routes = [f'R{r:02d}' for r in range(1, 6)]  # R01–R05

    # Build traffic lookup for delay correlation
    traffic_lookup = {}
    if traffic_df is not None:
        for _, row in traffic_df.iterrows():
            key = (row['timestamp'], row['district_id'])
            traffic_lookup[key] = row['vehicle_count']

    capacity = 80  # Standard bus capacity

    rows = []
    for ts in timestamps:
        hour = ts.hour
        dow = ts.dayofweek
        is_weekend = dow >= 5
        ts_str = ts.strftime('%Y-%m-%d %H:%M:%S')

        for did in district_ids:
            route = np.random.choice(routes)

            # Passenger count patterns
            if 8 <= hour <= 10:        # Morning rush - overcrowding
                base_passengers = int(capacity * np.random.uniform(0.9, 1.4))
            elif 17 <= hour <= 19:     # Evening rush - overcrowding
                base_passengers = int(capacity * np.random.uniform(0.85, 1.35))
            elif 12 <= hour <= 14:     # Lunch
                base_passengers = int(capacity * np.random.uniform(0.5, 0.7))
            elif 22 <= hour or hour <= 5:  # Night
                base_passengers = int(capacity * np.random.uniform(0.05, 0.2))
            else:
                base_passengers = int(capacity * np.random.uniform(0.3, 0.6))

            # Weekend reduction (30% lower)
            if is_weekend:
                base_passengers = int(base_passengers * 0.7)

            base_passengers = max(1, base_passengers)

            # Delay based on traffic congestion
            vc = traffic_lookup.get((ts_str, did), 500)
            delay = (vc / 100) * np.random.uniform(2, 8)
            delay = round(max(0, delay), 1)

            rows.append({
                'timestamp': ts_str,
                'district_id': did,
                'route_id': route,
                'passenger_count': base_passengers,
                'capacity': capacity,
                'delay_min': delay,
            })

    result = pd.DataFrame(rows)

    print(f"  ⚠️ 'passenger_count' — generated with rush-hour overcrowding")
    print(f"  ⚠️ 'delay_min' — derived from traffic vehicle_count")

    outpath = os.path.join(SAMPLE_DIR, 'transport_clean.csv')
    result.to_csv(outpath, index=False)
    print(f"\n  ✅ transport_clean.csv → {len(result)} rows")
    print(f"     Saved to: {outpath}")
    return result


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  STEP 6 — Merge All Datasets
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def merge_all():
    """Step 6: Merge all 5 clean CSVs into processed_data_raw.csv."""
    print("\n" + "━" * 60)
    print("  STEP 6 — Merging All Datasets")
    print("━" * 60)

    files = {
        'pollution_clean.csv': ['timestamp', 'district_id', 'pm25', 'pm10', 'aqi', 'weather_temp', 'weather_humidity'],
        'traffic_clean.csv': ['timestamp', 'district_id', 'vehicle_count', 'avg_speed_kmh', 'incident_flag'],
        'energy_clean.csv': ['timestamp', 'district_id', 'consumption_kwh', 'peak_demand_kw', 'renewable_pct'],
        'transport_clean.csv': ['timestamp', 'district_id', 'route_id', 'passenger_count', 'capacity', 'delay_min'],
        'water_waste_clean.csv': ['timestamp', 'district_id', 'water_liters', 'waste_kg'],
    }

    dfs = {}
    for fname, expected_cols in files.items():
        fpath = os.path.join(SAMPLE_DIR, fname)
        if os.path.exists(fpath):
            df = pd.read_csv(fpath)
            dfs[fname] = df
            print(f"  ✅ {fname:<28s} → {len(df):>6,} rows")
        else:
            print(f"  ⚠️  {fname:<28s} → NOT FOUND (will be filled with NaN)")

    # Start with pollution as base
    if 'pollution_clean.csv' in dfs:
        merged = dfs['pollution_clean.csv']
    else:
        print("  ❌ Cannot merge without pollution_clean.csv!")
        return None

    # Merge each subsequent dataset
    merge_keys = ['timestamp', 'district_id']
    for fname in ['traffic_clean.csv', 'energy_clean.csv', 'transport_clean.csv', 'water_waste_clean.csv']:
        if fname in dfs:
            merged = merged.merge(dfs[fname], on=merge_keys, how='outer', suffixes=('', f'_{fname}'))

    # Add coordinates
    merged = add_coordinates(merged)

    # Sort
    merged = merged.sort_values(['district_id', 'timestamp']).reset_index(drop=True)

    # Fill remaining NaN with median
    merged = fill_missing(merged, strategy='median')

    # Format timestamps
    merged['timestamp'] = pd.to_datetime(merged['timestamp']).dt.strftime('%Y-%m-%d %H:%M:%S')

    # Ensure all required columns exist
    for col in REQUIRED_COLUMNS:
        if col not in merged.columns:
            print(f"  ⚠️  Adding missing column '{col}' with NaN")
            merged[col] = np.nan

    # Reorder columns
    extra_cols = [c for c in merged.columns if c not in REQUIRED_COLUMNS]
    merged = merged[REQUIRED_COLUMNS + extra_cols]

    # Save
    outpath = os.path.join(OUTPUT_DIR, 'processed_data_raw.csv')
    merged.to_csv(outpath, index=False)

    print(f"\n  ✅ MERGED TOTAL → {len(merged):,} rows × {len(merged.columns)} columns")
    print(f"     Saved to: {outpath}")

    # Missing value report
    print(f"\n  ⚠️  Missing value report:")
    for col in REQUIRED_COLUMNS:
        pct = merged[col].isnull().mean() * 100
        if pct > 0:
            print(f"     {col}: {pct:.1f}% missing")

    if all(merged[col].isnull().mean() == 0 for col in REQUIRED_COLUMNS):
        print(f"     All required columns have 0% missing! ✅")

    print(f"\n  Districts: {sorted(merged['district_id'].unique())}")
    print(f"  Timestamp range: {merged['timestamp'].min()} → {merged['timestamp'].max()}")

    return merged


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  MAIN
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
if __name__ == '__main__':
    print("=" * 60)
    print("  UrbanMind — Adapting Real Data to Unified Schema")
    print("  Target: Pune, India (10 districts)")
    print("=" * 60)

    # Step 1: Pollution
    pollution_df = adapt_pollution()

    # Step 2: Traffic
    traffic_df = adapt_traffic(pollution_df)

    # Step 3: Energy
    energy_df = adapt_energy(pollution_df)

    # Step 4: Transport
    transport_df = adapt_transport(pollution_df, traffic_df)

    # Step 5: Water+Waste will be generated by generate_synthetic.py
    # Check if it already exists
    ww_path = os.path.join(SAMPLE_DIR, 'water_waste_clean.csv')
    if not os.path.exists(ww_path):
        print("\n  ℹ️  Run generate_synthetic.py next to create water_waste_clean.csv")
        print("     Then re-run this script OR run the merge step separately")
        # Generate it inline for convenience
        print("\n  → Auto-generating water+waste data...")
        from generate_synthetic import generate_water_waste
        generate_water_waste()

    # Step 6: Merge all
    merged = merge_all()

    print("\n" + "=" * 60)
    print("  ✅ Pipeline complete!")
    print("=" * 60)
