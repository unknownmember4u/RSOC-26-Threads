"""
UrbanMind ML Models Package
============================
Contains all prediction models for smart city analytics.
"""

import os
from typing import Optional

from .base_model import BaseUrbanModel
from .traffic_model import TrafficPredictor
from .pollution_model import PollutionPredictor
from .transport_model import TransportDemandPredictor


def _resolve_saved_models_dir() -> str:
    """Return the absolute path to the saved_models/ directory."""
    return os.path.normpath(
        os.path.join(os.path.dirname(__file__), "..", "saved_models")
    )


__all__ = [
    "BaseUrbanModel",
    "TrafficPredictor",
    "PollutionPredictor",
    "TransportDemandPredictor",
    "_resolve_saved_models_dir",
]
