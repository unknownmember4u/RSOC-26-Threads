import os
import sys
import time
import numpy as np
import pandas as pd
from fastapi import APIRouter, Query, HTTPException
from typing import Optional

# Ensure config is importable
_PROJECT_ROOT = os.path.normpath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, _PROJECT_ROOT)
import config

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

try:
    df = pd.read_csv(config.DATA_PATH)
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    print(f"[ok] Dashboard router loaded {len(df)} rows from {config.DATA_PATH}")
except Exception as e:
    print(f"[!!] Dashboard router CSV load failed: {e}")
    df = pd.DataFrame()

def generate_mock_district_data(district_id: str, hours: int):
    """Generate deterministic but time-varying mock data for a requested city."""
    # Current window changes every 30 seconds
    current_window = int(time.time() // 30)
    
    now = pd.Timestamp.now().round('h')
    timestamps = [now - pd.Timedelta(hours=i) for i in range(hours-1, -1, -1)]
    
    df_mock = pd.DataFrame({'timestamp': timestamps})
    df_mock['district_id'] = district_id
    
    # Use modulo hash to ensure deterministic ranges per city, offset by the 30-second window
    seed = (hash(district_id) % 10000) + current_window
    np.random.seed(seed)
    
    df_mock['vehicle_count'] = np.random.randint(2000, 6000, size=hours)
    df_mock['traffic_density'] = df_mock['vehicle_count'] / 6000.0
    df_mock['aqi'] = np.random.randint(50, 220, size=hours)
    df_mock['pm25'] = df_mock['aqi'] * 0.4 + np.random.normal(0, 5, size=hours)
    df_mock['pm10'] = df_mock['aqi'] * 0.8 + np.random.normal(0, 10, size=hours)
    df_mock['weather_temp'] = np.random.uniform(25, 38, size=hours)
    df_mock['weather_humidity'] = np.random.uniform(40, 85, size=hours)
    df_mock['consumption_kwh'] = np.random.uniform(1000, 5000, size=hours)
    df_mock['peak_demand_kw'] = df_mock['consumption_kwh'] * 1.5
    df_mock['renewable_pct'] = np.random.uniform(10, 40, size=hours)
    df_mock['transport_load'] = np.random.uniform(0.4, 0.9, size=hours)
    df_mock['passenger_count'] = np.random.randint(1000, 5000, size=hours)
    df_mock['delay_min'] = np.random.randint(0, 30, size=hours)
    df_mock['water_liters'] = np.random.uniform(20000, 80000, size=hours)
    df_mock['waste_kg'] = np.random.uniform(2000, 8000, size=hours)
    df_mock['incident_flag'] = np.random.choice([0, 1], size=hours, p=[0.9, 0.1])
    
    return df_mock

def get_filtered_df(district_id: Optional[str], hours: int):
    temp_df = df.copy()
    if district_id and district_id != "All Cities" and district_id != "All":
        if 'district_id' in temp_df.columns:
            temp_df = temp_df[temp_df['district_id'] == district_id]
        if temp_df.empty:
            return generate_mock_district_data(district_id, hours)
            
    if not temp_df.empty:
        max_time = temp_df['timestamp'].max()
        cutoff = max_time - pd.Timedelta(hours=hours)
        temp_df = temp_df[temp_df['timestamp'] >= cutoff]
    return temp_df

@router.get("/overview")
def get_overview(district_id: Optional[str] = None):
    try:
        temp_df = get_filtered_df(district_id, 24)
        if temp_df.empty: return {"error": "No data"}
        return {
            "avg_traffic_density": temp_df.get('traffic_density', temp_df['vehicle_count']/1000).mean(),
            "avg_aqi": temp_df['aqi'].mean(),
            "total_energy_kwh": temp_df['consumption_kwh'].sum(),
            "avg_transport_load": temp_df['transport_load'].mean(),
            "total_water_liters": temp_df['water_liters'].sum(),
            "total_waste_kg": temp_df['waste_kg'].sum(),
            "critical_alerts": int(temp_df['incident_flag'].sum()),
            "timestamp": temp_df['timestamp'].max().isoformat()
        }
    except Exception as e:
        return {"error": str(e)}

@router.get("/traffic")
def get_traffic(district_id: Optional[str] = None, hours: int = 24):
    try:
        temp_df = get_filtered_df(district_id, hours)
        hourly = temp_df.groupby(temp_df['timestamp'].dt.strftime('%H:00')).agg(
            traffic_density=('vehicle_count', lambda x: x.mean()/1000), # placeholder
            vehicle_count=('vehicle_count', 'mean'),
            incidents=('incident_flag', 'sum')
        ).reset_index()
        return {
            "labels": hourly['timestamp'].tolist(),
            "traffic_density": hourly['traffic_density'].tolist(),
            "vehicle_count": hourly['vehicle_count'].tolist(),
            "incidents": hourly['incidents'].tolist()
        }
    except Exception as e:
        return {"error": str(e)}

@router.get("/pollution")
def get_pollution(district_id: Optional[str] = None, hours: int = 24):
    try:
        temp_df = get_filtered_df(district_id, hours)
        hourly = temp_df.groupby(temp_df['timestamp'].dt.strftime('%H:00'))[['aqi', 'pm25', 'pm10', 'weather_temp', 'weather_humidity']].mean().reset_index()
        return {
            "labels": hourly['timestamp'].tolist(),
            "aqi": hourly['aqi'].tolist(),
            "pm25": hourly['pm25'].tolist(),
            "pm10": hourly['pm10'].tolist(),
            "weather_temp": hourly['weather_temp'].tolist(),
            "weather_humidity": hourly['weather_humidity'].tolist()
        }
    except Exception as e:
        return {"error": str(e)}

@router.get("/energy")
def get_energy(district_id: Optional[str] = None, hours: int = 24):
    try:
        temp_df = get_filtered_df(district_id, hours)
        hourly = temp_df.groupby(temp_df['timestamp'].dt.strftime('%H:00'))[['consumption_kwh', 'peak_demand_kw', 'renewable_pct']].mean().reset_index()
        return {
            "labels": hourly['timestamp'].tolist(),
            "consumption_kwh": hourly['consumption_kwh'].tolist(),
            "peak_demand_kw": hourly['peak_demand_kw'].tolist(),
            "renewable_pct": hourly['renewable_pct'].tolist()
        }
    except Exception as e:
        return {"error": str(e)}

@router.get("/transport")
def get_transport(district_id: Optional[str] = None, hours: int = 24):
    try:
        temp_df = get_filtered_df(district_id, hours)
        hourly = temp_df.groupby(temp_df['timestamp'].dt.strftime('%H:00'))[['transport_load', 'passenger_count', 'delay_min']].mean().reset_index()
        return {
            "labels": hourly['timestamp'].tolist(),
            "transport_load": hourly['transport_load'].tolist(),
            "passenger_count": hourly['passenger_count'].tolist(),
            "delay_min": hourly['delay_min'].tolist()
        }
    except Exception as e:
        return {"error": str(e)}

@router.get("/map")
def get_map():
    try:
        latest = df.sort_values('timestamp').groupby('district_id').last().reset_index()
        return latest.apply(lambda row: {
            "district_id": row['district_id'],
            "name": f"District {row['district_id']}",
            "lat": row['lat'],
            "lng": row['lng'],
            "traffic_density": row.get('traffic_density', row['vehicle_count']/1000),
            "aqi": row['aqi'],
            "energy_kwh": row['consumption_kwh'],
            "transport_load": row['transport_load'],
            "cluster_label": "Standard Zone",
            "risk_score": 0.5,
            "alert_count": int(row['incident_flag'])
        }, axis=1).tolist()
    except Exception as e:
        return {"error": str(e)}

@router.get("/correlation")
def get_correlation():
    try:
        if 'traffic_density' not in df.columns:
            df['traffic_density'] = df['vehicle_count']/1000
        corr = df['traffic_density'].corr(df['aqi'])
        sample = df.tail(100)
        return {
            "data": sample.apply(lambda r: {
                "district_id": r['district_id'],
                "traffic_density": r['traffic_density'],
                "aqi": r['aqi'],
                "hour": r['timestamp'].hour
            }, axis=1).tolist(),
            "overall_correlation": corr if pd.notnull(corr) else 0.0
        }
    except Exception as e:
        return {"error": str(e)}

@router.get("/peak_hours")
def get_peak_hours():
    try:
        if 'traffic_density' not in df.columns:
            df['traffic_density'] = df['vehicle_count']/1000
        hourly = df.groupby(df['timestamp'].dt.hour)['traffic_density'].mean()
        return {
            "hours": hourly.index.tolist(),
            "avg_traffic": hourly.values.tolist()
        }
    except Exception as e:
        return {"error": str(e)}
