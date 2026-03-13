"""
UrbanMind - Project Configuration
===================================
Central configuration for paths, model settings, and LLM backends.
"""

import os

from dotenv import load_dotenv

load_dotenv()

# ---------------------------------------------------------------------------
# Paths (resolved relative to this file's location)
# ---------------------------------------------------------------------------

# Path to the pre-processed CSV from the data-engineering pipeline
DATA_PATH: str = os.path.normpath(
    os.path.join(os.path.dirname(__file__), "..", "Vaishnavi", "output", "processed_data.csv")
)

# Directory where trained model artefacts (.pkl / .h5) are persisted
SAVED_MODELS_DIR: str = os.path.normpath(
    os.path.join(os.path.dirname(__file__), "saved_models")
)

# Directory where JSON prediction outputs are written
OUTPUT_DIR: str = os.path.normpath(
    os.path.join(os.path.dirname(__file__), "output")
)

# ---------------------------------------------------------------------------
# LLM / Chatbot configuration
# ---------------------------------------------------------------------------

# Ollama endpoint (local or via ngrok tunnel)
OLLAMA_NGROK_URL: str = os.getenv(
    "OLLAMA_NGROK_URL",
    "https://aiden-vacuolar-captivatingly.ngrok-free.dev",
)

# Default Ollama model
OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "llama3")

# Mistral API key
MISTRAL_API_KEY: str = os.getenv(
    "MISTRAL_API_KEY",
    "", # User must provide this
)

# Chat backend selector: "ollama" | "mistral"
CHAT_BACKEND: str = os.getenv("CHAT_BACKEND", "ollama")

# ---------------------------------------------------------------------------
# Firebase
# ---------------------------------------------------------------------------

FIREBASE_CREDS: str = os.getenv(
    "FIREBASE_CREDENTIALS",
    "firebase_credentials.json",
)
