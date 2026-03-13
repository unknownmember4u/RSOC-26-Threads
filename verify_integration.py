import os
import json
import pandas as pd
import requests
import google.generativeai as genai
from dotenv import load_dotenv

# Ensure we look for .env in the current directory
load_dotenv(os.path.join(os.getcwd(), ".env"))

def verify():
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print("  URBANMIND INTEGRATION STATUS")
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    
    # Task 2: Step 1 — Check dataset
    dataset_status = "❌ Missing"
    try:
        path = "Vaishnavi/output/processed_data.csv"
        if os.path.exists(path):
            df = pd.read_csv(path)
            # Basic columns check
            req_cols = ["timestamp", "district_id", "aqi", "traffic_density"]
            missing = [c for c in req_cols if c not in df.columns]
            if missing:
                print(f"Dataset missing core columns: {missing}")
            else:
                print(f"✅ Dataset OK — {len(df):,} rows × {len(df.columns)} columns")
                dataset_status = "✅ Ready"
        else:
            print(f"❌ Dataset not found at {path}")
    except Exception as e:
        print(f"❌ Dataset error: {e}")

    # Task 2: Step 2 — Check ML models
    models_status = "❌ Missing"
    try:
        # Match actual names from train_all.py
        models = ["TrafficPredictor.pkl", "PollutionPredictor.pkl", "TransportDemandPredictor.pkl"]
        all_ok = True
        for m in models:
            path = f"Abhishek/saved_models/{m}"
            if os.path.exists(path):
                print(f"✅ {m} found ({os.path.getsize(path)/(1024*1024):.1f} MB)")
            else:
                print(f"❌ Missing {m} at {path}")
                all_ok = False
        if all_ok: models_status = "✅ Ready"
    except Exception as e:
        print(f"❌ Model check error: {e}")

    # Task 2: Step 3 — Check output JSONs
    try:
        if os.path.exists("Abhishek/output/clusters.json"):
            print(f"✅ clusters.json found")
        else:
            print("❌ clusters.json missing")
            
        if os.path.exists("Abhishek/output/alerts.json"):
            print(f"✅ alerts.json found")
        else:
            print("❌ alerts.json missing")
    except Exception as e:
        print(f"❌ JSON error: {e}")

    # Task 2: Step 4 — Check Firebase
    firebase_status = "❌ Failed"
    # User mentioned Abhishek/firebase_credentials.json or root
    fb_path = os.getenv("FIREBASE_CREDENTIALS", "Abhishek/firebase_credentials.json")
    if os.path.exists(fb_path):
        try:
            import firebase_admin
            from firebase_admin import credentials, firestore
            cred = credentials.Certificate(fb_path)
            if not firebase_admin._apps:
                firebase_admin.initialize_app(cred)
            print("✅ Firebase initialized")
            firebase_status = "✅ Ready"
        except Exception as e:
            print(f"⚠️ Firebase init warning: {e}")
            firebase_status = "⚠️ Configured"
    else:
        print(f"❌ Firebase credentials missing at {fb_path}")

    # Task 2: Step 5 — Check Ollama
    ollama_status = "❌ Failed"
    url = os.getenv("OLLAMA_NGROK_URL")
    if url:
        try:
            r = requests.get(f"{url}/api/tags", timeout=3)
            if r.status_code == 200:
                print(f"✅ Ollama reachable")
                ollama_status = "✅ Connected"
            else:
                ollama_status = "⚠️ Fallback"
        except Exception:
            ollama_status = "⚠️ Fallback"
    else:
        ollama_status = "⚠️ Fallback"

    # Task 2: Step 6 — Check Gemini
    gemini_status = "❌ Failed"
    gemini_key = os.getenv("GEMINI_API_KEY")
    if gemini_key:
        try:
            genai.configure(api_key=gemini_key)
            # Lightweight check
            for m in genai.list_models():
                if 'generateContent' in m.supported_generation_methods:
                    print(f"✅ Gemini API active (Model: {m.name})")
                    gemini_status = "✅ Connected"
                    break
        except Exception as e:
            print(f"❌ Gemini error: {e}")
    else:
        print("❌ Gemini API key missing (GEMINI_API_KEY not in .env)")

    print("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print("  URBANMIND INTEGRATION STATUS")
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print(f"  Dataset:    {dataset_status}")
    print(f"  ML Models:  {models_status}")
    print(f"  Firebase:   {firebase_status}")
    print(f"  Ollama:     {ollama_status}")
    print(f"  Gemini:     {gemini_status}")
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    
    if dataset_status == "✅ Ready" and models_status == "✅ Ready":
        print("  🎉 SYSTEM INTEGRATED SUCCESSFULLY")
        print("  Run: uvicorn Abhishek.api.ml_router:app --port 8000")
        exit(0)
    else:
        print("  ❌ Critical components missing.")
        exit(1)

if __name__ == "__main__":
    verify()

if __name__ == "__main__":
    verify()
