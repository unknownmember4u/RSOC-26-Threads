import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from Vaishnavi.api.ingest_router import router as ingest_router
from Vaishnavi.api.stream_router import router as stream_router
from Abhishek.api.ml_router import router as ml_router
from Abhishek.api.dashboard_router import router as dashboard_router

load_dotenv()

OLLAMA_NGROK_URL = os.getenv("OLLAMA_NGROK_URL", "https://placeholder.ngrok.io")

app = FastAPI(title="UrbanMind API", version="1.0.0")

app.add_middleware(CORSMiddleware,
  allow_origins=["*"],
  allow_methods=["*"],
  allow_headers=["*"]
)

app.include_router(ingest_router, prefix="/api")
app.include_router(stream_router, prefix="/api")
app.include_router(ml_router, prefix="/api")
app.include_router(dashboard_router, prefix="/api")

@app.get("/")
def root():
  return { "status": "UrbanMind API running", "version": "1.0.0" }

@app.get("/health")
def health():
  return {
    "api": "ok",
    "firebase": "connected",
    "ollama": OLLAMA_NGROK_URL,
    "models": ["traffic", "pollution", "transport"]
  }
