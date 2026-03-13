"""
UrbanMind - ML API Router
============================
FastAPI application with endpoints for predictions, clustering,
anomaly alerts, policy simulation, and AI chat.

Usage:
    cd Abhishek/
    uvicorn api.ml_router:app --reload --port 8000
"""

from __future__ import annotations

import json
import os
import sys
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Ensure project root is importable
_PROJECT_ROOT = os.path.normpath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, _PROJECT_ROOT)

import config

# ═══════════════════════════════════════════════════════════════
# Pydantic request / response models
# ═══════════════════════════════════════════════════════════════


class TrafficPredictRequest(BaseModel):
    district_id: str
    hour_of_day: int
    day_of_week: int
    is_peak_hour: bool
    weather_temp: float
    weather_humidity: float
    lag_1h_traffic: float
    lag_24h_traffic: float
    rolling_aqi_3h: float = 0.3
    is_weekend: bool = False
    horizon_hours: int = 3


class PollutionPredictRequest(BaseModel):
    district_id: str
    traffic_density: float
    hour_of_day: int
    day_of_week: int
    weather_temp: float
    weather_humidity: float
    is_weekend: bool = False
    lag_1h_aqi: float
    lag_24h_aqi: float
    horizon_hours: int = 3


class TransportPredictRequest(BaseModel):
    district_id: str
    hour_of_day: int
    day_of_week: int
    is_weekend: bool
    is_peak_hour: bool
    traffic_density: float
    weather_temp: float
    lag_1h_transport: float = 0.5
    lag_24h_transport: float = 0.5
    horizon_hours: int = 3


class SimulateRequest(BaseModel):
    district_id: str
    change: str
    percent: int = Field(ge=5, le=50)


class ChatRequest(BaseModel):
    message: str
    history: List[Dict[str, str]] = []
    backend: Optional[str] = None


# ═══════════════════════════════════════════════════════════════
# FastAPI app
# ═══════════════════════════════════════════════════════════════

app = FastAPI(
    title="UrbanMind ML API",
    description="Smart city analytics API — predictions, clustering, anomaly detection, simulation, and AI chat.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount the dashboard data router
from api.dashboard_router import router as dashboard_router
app.include_router(dashboard_router, prefix="/api")

# Global references (populated on startup)
_state: Dict[str, Any] = {}


# ═══════════════════════════════════════════════════════════════
# Startup — load everything into memory once
# ═══════════════════════════════════════════════════════════════

@app.on_event("startup")
async def startup():
    import pandas as pd
    from models.base_model import BaseUrbanModel
    from simulation.policy_simulator import PolicySimulator
    from chatbot.chat_engine import UrbanChatEngine

    print("\n[*] UrbanMind API starting up ...")

    # Load ML models
    traffic_path = os.path.join(config.SAVED_MODELS_DIR, "TrafficPredictor.pkl")
    pollution_path = os.path.join(config.SAVED_MODELS_DIR, "PollutionPredictor.pkl")
    transport_path = os.path.join(config.SAVED_MODELS_DIR, "TransportDemandPredictor.pkl")

    _state["traffic_model"] = BaseUrbanModel.load(traffic_path)
    _state["pollution_model"] = BaseUrbanModel.load(pollution_path)
    _state["transport_model"] = BaseUrbanModel.load(transport_path)

    # Load data
    _state["df"] = pd.read_csv(config.DATA_PATH)
    df = _state["df"]

    # Compute data summary for chat engine
    aqi_by_dist = df.groupby("district_id")["aqi"].mean()
    traffic_by_dist = df.groupby("district_id")["traffic_density"].mean()
    energy_by_dist = df.groupby("district_id")["consumption_kwh"].mean()
    transport_by_dist = df.groupby("district_id")["transport_load"].mean()

    highest_poll_dist = aqi_by_dist.idxmax()
    highest_poll_val = int(aqi_by_dist.max() * 300)

    worst_traffic_dist = traffic_by_dist.idxmax()
    worst_traffic_val = round(traffic_by_dist.max(), 2)

    top_energy_dist = energy_by_dist.idxmax()
    top_energy_val = round(energy_by_dist.max(), 1)

    most_overcrowded_dist = transport_by_dist.idxmax()
    most_overcrowded_val = round(transport_by_dist.max(), 2)

    # Count critical alerts
    alerts_path = os.path.join(config.OUTPUT_DIR, "alerts.json")
    critical_count = 0
    if os.path.isfile(alerts_path):
        with open(alerts_path) as f:
            alerts = json.load(f)
        critical_count = sum(1 for a in alerts if a.get("severity") == "critical")

    data_summary = {
        "highest_pollution_district": f"{highest_poll_dist} - AQI {highest_poll_val}",
        "worst_traffic_district": f"{worst_traffic_dist} - density {worst_traffic_val}",
        "peak_traffic_hours": "8-10 AM, 5-7 PM",
        "critical_alerts_count": critical_count,
        "top_energy_district": f"{top_energy_dist} - {top_energy_val} kWh",
        "most_overcrowded_route": f"{most_overcrowded_dist} - load {most_overcrowded_val}",
        "city": "Pune, India",
        "districts": (
            "D01 Shivajinagar, D02 Kothrud, D03 Hadapsar, D04 Wakad, "
            "D05 Pimpri, D06 Baner, D07 Magarpatta, D08 Kharadi, "
            "D09 Viman Nagar, D10 Swargate"
        ),
    }
    _state["data_summary"] = data_summary

    # Initialise simulator and chat engine
    _state["simulator"] = PolicySimulator(
        traffic_model=_state["traffic_model"],
        pollution_model=_state["pollution_model"],
        data_path=config.DATA_PATH,
    )
    _state["chat_engine"] = UrbanChatEngine(data_summary)

    print("[ok] All models loaded and ready\n")


def _log(endpoint: str):
    print(f"[{datetime.now().isoformat()}] {endpoint} called")


# ═══════════════════════════════════════════════════════════════
# Endpoints
# ═══════════════════════════════════════════════════════════════


# -------------- Health Check ---------------

@app.get("/api/ml/health")
async def health():
    _log("/api/ml/health")
    return {
        "status": "ok",
        "models_loaded": ["traffic", "pollution", "transport"],
        "chat_backend": config.CHAT_BACKEND,
        "ollama_url": config.OLLAMA_NGROK_URL,
        "ollama_model": config.OLLAMA_MODEL,
        "gemini": "configured" if config.GEMINI_API_KEY else "not configured",
        "data_rows": len(_state.get("df", [])),
        "districts": 10,
    }


# -------------- Predictions ----------------

@app.post("/api/ml/predict/traffic")
async def predict_traffic(req: TrafficPredictRequest):
    _log("/api/ml/predict/traffic")
    try:
        model = _state["traffic_model"]
        result = model.predict(req.model_dump())
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ml/predict/pollution")
async def predict_pollution(req: PollutionPredictRequest):
    _log("/api/ml/predict/pollution")
    try:
        model = _state["pollution_model"]
        result = model.predict(req.model_dump())
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ml/predict/transport")
async def predict_transport(req: TransportPredictRequest):
    _log("/api/ml/predict/transport")
    try:
        model = _state["transport_model"]
        result = model.predict(req.model_dump())
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# -------------- Clusters -------------------

@app.get("/api/ml/clusters")
async def get_clusters():
    _log("/api/ml/clusters")
    try:
        clusters_path = os.path.join(config.OUTPUT_DIR, "clusters.json")
        if not os.path.isfile(clusters_path):
            raise HTTPException(status_code=404, detail="clusters.json not found")
        with open(clusters_path) as f:
            return json.load(f)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# -------------- Alerts ---------------------

@app.get("/api/ml/alerts")
async def get_alerts(severity: Optional[str] = Query(None)):
    _log(f"/api/ml/alerts?severity={severity}")
    try:
        alerts_path = os.path.join(config.OUTPUT_DIR, "alerts.json")
        if not os.path.isfile(alerts_path):
            raise HTTPException(status_code=404, detail="alerts.json not found")
        with open(alerts_path) as f:
            alerts = json.load(f)
        if severity:
            alerts = [a for a in alerts if a.get("severity") == severity]
        return alerts
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# -------------- Simulation -----------------

@app.post("/api/ml/simulate")
async def simulate(req: SimulateRequest):
    _log("/api/ml/simulate")
    valid_changes = [
        "reduce_traffic",
        "increase_green_transport",
        "restrict_industry",
        "increase_ev_adoption",
    ]
    if req.change not in valid_changes:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown scenario: '{req.change}'. Valid: {valid_changes}",
        )
    try:
        simulator = _state["simulator"]
        result = simulator.simulate(req.model_dump())
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# -------------- Chat -----------------------

@app.post("/api/ml/chat")
async def chat(req: ChatRequest):
    _log("/api/ml/chat")
    try:
        engine = _state["chat_engine"]
        response_text, backend_used = engine.chat(
            req.message, req.history, req.backend
        )
        return {"response": response_text, "backend_used": backend_used}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# -------------- Chart Explanation ----------

@app.post("/api/ml/explain-chart")
async def explain_chart(image: UploadFile = File(...)):
    _log("/api/ml/explain-chart")
    try:
        image_bytes = await image.read()
        engine = _state["chat_engine"]
        explanation = engine.explain_chart(image_bytes)
        return {"explanation": explanation, "model": "gemini-1.5-flash"}
    except Exception as e:
        return {
            "explanation": "Unable to analyze chart",
            "error": str(e),
            "model": "gemini-1.5-flash",
        }


# -------------- Live Stream ----------------

@app.get("/api/stream/latest")
async def stream_latest():
    """Return a completely dynamic, fluctuating live telemetry snapshot."""
    import time
    import numpy as np
    _log("/api/stream/latest")
    
    current_window = int(time.time() // 5)
    
    try:
        district_names = {
            "D01": "New Delhi", "D02": "Mumbai", "D03": "Bengaluru",
            "D04": "Chennai", "D05": "Kolkata", "D06": "Hyderabad",
            "D07": "Pune", "D08": "Ahmedabad", "D09": "Jaipur", "D10": "Surat"
        }
        
        districts = []
        for d_id, d_name in district_names.items():
            # Seed based on district and the 5-second window
            seed = (hash(d_id) % 10000) + current_window
            np.random.seed(seed)
            
            # Fluctuate around realistic baselines
            aqi_val = np.random.uniform(50, 350)
            traffic_val = np.random.uniform(0.3, 0.95)
            status = "CRITICAL" if aqi_val > 250 or traffic_val > 0.85 else "NORMAL"
            
            districts.append({
                "district_id": d_id,
                "name": d_name,
                "aqi": aqi_val,
                "traffic_density": traffic_val,
                "energy_kwh": np.random.uniform(1000, 5000),
                "transport_load": np.random.uniform(0.4, 0.9),
                "water_liters": np.random.uniform(20000, 80000),
                "waste_kg": np.random.uniform(2000, 8000),
                "status": status,
            })
            
        return districts
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
