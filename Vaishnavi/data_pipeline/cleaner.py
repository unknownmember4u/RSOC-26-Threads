"""
cleaner.py — UrbanMind Data Pipeline
Handles NaN filling, type conversion, schema validation.
"""
import pandas as pd
import numpy as np


REQUIRED_COLUMNS = [
    'timestamp', 'district_id', 'lat', 'lng',
    'pm25', 'pm10', 'aqi', 'weather_temp', 'weather_humidity',
    'vehicle_count', 'avg_speed_kmh', 'incident_flag',
    'consumption_kwh', 'peak_demand_kw', 'renewable_pct',
    'route_id', 'passenger_count', 'capacity', 'delay_min',
    'water_liters', 'waste_kg',
]


def fill_missing(df, strategy='median'):
    """
    Fill NaN values in numeric columns.
    strategy: 'median' | 'mean' | 'zero'
    """
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    for col in numeric_cols:
        if df[col].isnull().any():
            if strategy == 'median':
                df[col] = df[col].fillna(df[col].median())
            elif strategy == 'mean':
                df[col] = df[col].fillna(df[col].mean())
            elif strategy == 'zero':
                df[col] = df[col].fillna(0)
    return df


def validate_schema(df, expected_columns=None):
    """
    Validate that the dataframe has the expected columns.
    Returns (is_valid, missing_columns).
    """
    if expected_columns is None:
        expected_columns = REQUIRED_COLUMNS
    missing = [c for c in expected_columns if c not in df.columns]
    return len(missing) == 0, missing


def normalize_timestamp(df, col='timestamp'):
    """
    Parse timestamps flexibly and format to YYYY-MM-DD HH:MM:SS.
    Removes timezone info.
    """
    df[col] = pd.to_datetime(df[col], infer_datetime_format=True, errors='coerce')
    df[col] = df[col].dt.tz_localize(None) if df[col].dt.tz is not None else df[col]
    df[col] = df[col].dt.strftime('%Y-%m-%d %H:%M:%S')
    return df


def normalize_district_ids(df, col='district_id'):
    """Ensure district IDs are zero-padded like D01, D02, … D10."""
    df[col] = df[col].astype(str).str.strip().str.upper()
    return df


def clean_merged(df):
    """Full cleaning pass on the final merged dataframe."""
    df = fill_missing(df, strategy='median')
    df = normalize_timestamp(df, 'timestamp')
    df = normalize_district_ids(df, 'district_id')
    return df
