"""
UrbanMind - AI Chat Engine
============================
Multi-backend chat assistant (Ollama / Gemini) for city analytics queries.
Includes RAG (Retrieval Augmented Generation) for data-grounded answers
and chart/image explanation via Gemini Vision.
"""

from __future__ import annotations

import os
import sys
from typing import Any, Dict, List, Optional, Tuple

_PROJECT_ROOT = os.path.normpath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, _PROJECT_ROOT)


class UrbanChatEngine:
    """AI chat assistant with RAG + Ollama/Gemini dual backend."""

    def __init__(self, data_summary: Dict[str, Any]) -> None:
        import config

        self.ollama_url = config.OLLAMA_NGROK_URL
        self.ollama_model = config.OLLAMA_MODEL
        self.gemini_api_key = config.GEMINI_API_KEY
        self.backend = config.CHAT_BACKEND
        self.data_summary = data_summary

        # Initialize RAG engine
        from chatbot.rag_engine import RAGEngine
        self.rag = RAGEngine(config.DATA_PATH)
        print("[ok] RAG engine initialized")

        # Initialize Gemini
        self.gemini_model = None
        if self.gemini_api_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=self.gemini_api_key)
                self.gemini_model = genai.GenerativeModel("gemini-1.5-flash")
                print("[ok] Gemini model initialised")
            except Exception as e:
                print(f"[!!] Gemini init failed: {e}")

        print(f"[ok] UrbanChatEngine ready (backend={self.backend})")

    # ------------------------------------------------------------------
    # System prompt
    # ------------------------------------------------------------------

    @property
    def system_prompt(self) -> str:
        s = self.data_summary
        return (
            "You are UrbanMind AI, a smart city analytics assistant for Pune, India.\n"
            "You have access to real-time data for 10 districts (D01-D10):\n"
            "D01 Shivajinagar, D02 Kothrud, D03 Hadapsar, D04 Wakad, D05 Pimpri,\n"
            "D06 Baner, D07 Magarpatta, D08 Kharadi, D09 Viman Nagar, D10 Swargate.\n\n"
            "Current city summary:\n"
            f"- Highest pollution: {s.get('highest_pollution_district', 'N/A')}\n"
            f"- Worst traffic: {s.get('worst_traffic_district', 'N/A')}\n"
            f"- Peak hours: {s.get('peak_traffic_hours', '8-10 AM, 5-7 PM')}\n"
            f"- Critical alerts: {s.get('critical_alerts_count', 0)}\n"
            f"- Top energy usage: {s.get('top_energy_district', 'N/A')}\n"
            f"- Most overcrowded: {s.get('most_overcrowded_route', 'N/A')}\n\n"
            "Rules:\n"
            "- Always mention specific district IDs (D01-D10) in answers\n"
            "- Always include actual numbers from the data\n"
            "- Keep responses under 5 sentences\n"
            "- End every response with one actionable recommendation\n"
            "- If asked about something outside city data, redirect politely\n"
            "- Use the RETRIEVED CITY DATA section to ground your answers in facts"
        )

    # ------------------------------------------------------------------
    # Chat (main entry)
    # ------------------------------------------------------------------

    def chat(
        self,
        user_message: str,
        history: Optional[List[Dict[str, str]]] = None,
        backend: Optional[str] = None,
    ) -> Tuple[str, str]:
        """Send a message and get a RAG-augmented response.

        Parameters
        ----------
        user_message : str
            The user's message.
        history : list[dict], optional
            Previous messages [{role, content}, ...].
        backend : str, optional
            Override default backend ("ollama" | "gemini").

        Returns
        -------
        tuple[str, str]
            (response_text, backend_used)
        """
        history = history or []
        backend_to_use = backend or self.backend

        if backend_to_use == "ollama":
            try:
                response = self._chat_ollama(user_message, history)
                return (response, "ollama")
            except Exception as e:
                print(f"[!!] Ollama failed: {e} -- falling back to Gemini")
                if self.gemini_model:
                    response = self._chat_gemini(user_message, history)
                    return (response, "gemini_fallback")
                return (f"Both backends unavailable. Ollama error: {e}", "error")

        elif backend_to_use == "gemini":
            if not self.gemini_model:
                return ("Gemini is not configured. Set GEMINI_API_KEY.", "error")
            response = self._chat_gemini(user_message, history)
            return (response, "gemini")

        return ("Unknown backend specified.", "error")

    # ------------------------------------------------------------------
    # Ollama backend (RAG-augmented)
    # ------------------------------------------------------------------

    def _chat_ollama(self, user_message: str, history: List[Dict]) -> str:
        """Chat via Ollama API with RAG context injection."""
        import requests

        # RAG retrieval
        retrieved_context = self.rag.retrieve(user_message, top_k=5)

        augmented_message = (
            f"{retrieved_context}\n\n"
            f"Based on the above retrieved city data, answer this question:\n"
            f"{user_message}"
        )

        url = f"{self.ollama_url}/api/chat"
        messages = [
            {"role": "system", "content": self.system_prompt},
            *history[-5:],
            {"role": "user", "content": augmented_message},
        ]
        body = {
            "model": self.ollama_model,
            "messages": messages,
            "stream": False,
        }
        resp = requests.post(
            url,
            json=body,
            headers={"Content-Type": "application/json"},
            timeout=30,
        )
        resp.raise_for_status()
        return resp.json()["message"]["content"]

    # ------------------------------------------------------------------
    # Gemini backend (RAG-augmented)
    # ------------------------------------------------------------------

    def _chat_gemini(self, user_message: str, history: List[Dict]) -> str:
        """Chat via Google Gemini API with RAG context injection."""
        # RAG retrieval
        retrieved_context = self.rag.retrieve(user_message, top_k=5)

        history_text = "\n".join(
            f"{m['role'].upper()}: {m['content']}" for m in history[-5:]
        )
        full_prompt = (
            f"{self.system_prompt}\n\n"
            f"{retrieved_context}\n\n"
            f"Conversation history:\n{history_text}\n\n"
            f"User question: {user_message}\nAssistant:"
        )
        response = self.gemini_model.generate_content(full_prompt)
        return response.text

    # ------------------------------------------------------------------
    # Chart explanation (Gemini Vision)
    # ------------------------------------------------------------------

    def explain_chart(self, image_bytes: bytes) -> str:
        """Use Gemini Vision to explain a chart image.

        Parameters
        ----------
        image_bytes : bytes
            PNG image data.

        Returns
        -------
        str
            Natural-language explanation of the chart.
        """
        if not self.gemini_model:
            return "Gemini is not configured. Cannot analyze images."

        prompt = (
            "You are UrbanMind AI analyzing a smart city analytics "
            "chart for Pune, India. Explain this chart to a city "
            "administrator in exactly 3-4 sentences:\n"
            "1. What metric is shown and the current trend\n"
            "2. The most important anomaly or pattern visible\n"
            "3. One specific actionable recommendation\n"
            "Be concise, data-driven, mention district names if visible."
        )
        image_part = {"mime_type": "image/png", "data": image_bytes}
        response = self.gemini_model.generate_content([prompt, image_part])
        return response.text
