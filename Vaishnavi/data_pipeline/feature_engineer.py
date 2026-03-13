"""
feature_engineer.py — UrbanMind Data Pipeline
Adds derived features: congestion index, anomaly scores, time features.
"""
import pandas as pd
import numpy as np


def add_time_features(df, ts_col='timestamp'):
    """Add hour, day_of_week, is_weekend, month columns."""
    ts = pd.to_datetime(df[ts_col])
    df['hour'] = ts.dt.hour
    df['day_of_week'] = ts.dt.dayofweek        # 0=Mon, 6=Sun
    df['is_weekend'] = (ts.dt.dayofweek >= 5).astype(int)
    df['month'] = ts.dt.month
    return df


def add_congestion_index(df):
    """
    Congestion index: 0–1 based on vehicle_count percentile.
    Higher = more congested.
    """
    if 'vehicle_count' in df.columns:
        vmax = df['vehicle_count'].quantile(0.99)
        vmin = df['vehicle_count'].quantile(0.01)
        df['congestion_index'] = ((df['vehicle_count'] - vmin) / (vmax - vmin)).clip(0, 1)
    return df


def add_aqi_category(df):
    """Add AQI category label based on India NAQI scale."""
    bins = [0, 50, 100, 200, 300, 400, 500, float('inf')]
    labels = ['Good', 'Satisfactory', 'Moderate', 'Poor', 'Very Poor', 'Severe', 'Hazardous']
    if 'aqi' in df.columns:
        df['aqi_category'] = pd.cut(df['aqi'], bins=bins, labels=labels, right=True)
    return df


def add_transport_utilization(df):
    """Transport utilization = passenger_count / capacity."""
    if 'passenger_count' in df.columns and 'capacity' in df.columns:
        df['transport_utilization'] = (df['passenger_count'] / df['capacity']).clip(0, 2)
    return df


def add_anomaly_flags(df):
    """Flag statistical anomalies (z-score > 3) on key numeric columns."""
    anomaly_cols = ['pm25', 'vehicle_count', 'consumption_kwh', 'water_liters', 'waste_kg']
    for col in anomaly_cols:
        if col in df.columns:
            mean = df[col].mean()
            std = df[col].std()
            if std > 0:
                df[f'{col}_anomaly'] = (np.abs(df[col] - mean) / std > 3).astype(int)
    return df


def engineer_all(df):
    """Apply all feature engineering steps."""
    df = add_time_features(df)
    df = add_congestion_index(df)
    df = add_aqi_category(df)
    df = add_transport_utilization(df)
    df = add_anomaly_flags(df)
    return df
