from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List, Dict
from pydantic import BaseModel
import uvicorn
import random
from datetime import datetime
from backend.firebase_client import FirebaseClient

app = FastAPI(title="UrbanMind Intelligence API")

# Enable CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Firebase (Requires credentials.json in backend/ or env var)
# For this scaffold, we'll gracefully handle missing creds
fb = FirebaseClient(credentials_path="backend/credentials.json")

# --- Models ---
class PredictRequest(BaseModel):
    district: str
    hour: int
    temperature: Optional[float] = 25.0
    weather: Optional[str] = "Clear"

class SimulateRequest(BaseModel):
    district: str
    scenario: str
    intensity: int

class ChatRequest(BaseModel):
    message: str

# --- Routes ---

@app.get("/")
async def health_check():
    return {"status": "online", "system": "UrbanMind Intelligence AI"}

@app.get("/dashboard/stats")
async def get_dashboard_stats(district: str = "All"):
    """Returns aggregated KPI stats for the dashboard."""
    # In a real app, logic would aggregate data from fb.get_latest_data()
    # Providing realistic mock responses based on district
    return {
        "traffic": random.uniform(0.1, 0.95),
        "aqi": random.randint(30, 200),
        "energy": f"{random.uniform(1.0, 5.0):.1f}M",
        "transport": f"{random.randint(40, 95)}%",
        "water": f"{random.randint(100, 600)}kL",
        "waste": f"{random.randint(20, 150)}t"
    }

@app.get("/alerts")
async def get_alerts():
    """Returns the latest active alerts."""
    try:
        return fb.get_alerts()
    except Exception:
        # Fallback to realistic mock if firebase fails
        return [
            {"type": "Critical AQI Spike", "district": "D03", "severity": "critical", "timestamp": "5m ago", "message": "PM2.5 exceeded threshold."},
            {"type": "Congestion Warning", "district": "D05", "severity": "warning", "timestamp": "12m ago", "message": "Heavy traffic detected near Sector 4."}
        ]

@app.get("/clusters")
async def get_clusters():
    """Returns urban grouping clusters."""
    try:
        return fb.get_clusters()
    except Exception:
        return [
            {"id": "C1", "name": "Industrial Hub", "color": "#FF4757", "districts": "D01, D07", "risk": 82},
            {"id": "C2", "name": "Residential Zone", "color": "#2ED573", "districts": "D02, D04", "risk": 15}
        ]

@app.get("/stream/latest")
async def get_live_telemetry():
    """Returns direct IoT sensor feed."""
    try:
        return fb.get_live_data()
    except Exception:
        return [{"node": f"S-{i}", "status": "Online", "aqi": random.randint(20, 100)} for i in range(5)]

@app.post("/ml/predict/{ptype}")
async def predict(ptype: str, request: PredictRequest):
    """Executes ML prediction model based on input parameters."""
    # Logic for model inference would go here
    forecast = [random.uniform(0.3, 0.9) for _ in range(4)]
    return {
        "value": f"{random.uniform(0.6, 0.9):.2f}" if ptype=="traffic" else random.randint(50, 200),
        "confidence": random.randint(85, 98),
        "level": "Critical" if random.random() > 0.7 else "Normal",
        "forecast": forecast
    }

@app.post("/ml/simulate")
async def simulate(request: SimulateRequest):
    """Simulates policy impact on urban metrics."""
    # Logic for twin simulation
    reduction = request.intensity / 200.0
    return {
        "metrics": [
            {"label": "Traffic", "before": 0.82, "after": 0.82 - reduction, "type": "improvement"},
            {"label": "AQI", "before": 140, "after": 140 - (reduction * 100), "type": "improvement"}
        ],
        "recommendation": f"The {request.scenario} at {request.intensity}% intensity is highly effective for {request.district}."
    }

@app.post("/ml/chat")
async def chat(request: ChatRequest):
    """AI Assistant interface."""
    return {
        "response": f"Analyzing city telemetry for: '{request.message}'. I've identified a 12% increase in traffic density in the North sector. Recommending signal offset adjustment."
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
