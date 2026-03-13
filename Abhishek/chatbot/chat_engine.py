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
        self.mistral_api_key = config.MISTRAL_API_KEY
        self.backend = config.CHAT_BACKEND
        self.data_summary = data_summary

        # Initialize RAG engine
        from chatbot.rag_engine import RAGEngine
        self.rag = RAGEngine(config.DATA_PATH)
        print("[ok] RAG engine initialized")

        # Initialize Mistral
        self.mistral_client = None
        if self.mistral_api_key:
            try:
                from mistralai import Mistral
                self.mistral_client = Mistral(api_key=self.mistral_api_key)
                print("[ok] Mistral client initialised")
            except Exception as e:
                print(f"[!!] Mistral init failed: {e}")

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
                print(f"[!!] Ollama failed: {e} -- falling back to Mistral")
                if self.mistral_client:
                    response = self._chat_mistral(user_message, history)
                    return (response, "mistral_fallback")
                return (f"Both backends unavailable. Ollama error: {e}", "error")

        elif backend_to_use == "mistral":
            if not self.mistral_client:
                return ("Mistral is not configured. Set MISTRAL_API_KEY in .env.", "error")
            response = self._chat_mistral(user_message, history)
            return (response, "mistral")

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
    # Mistral backend (RAG-augmented)
    # ------------------------------------------------------------------

    def _chat_mistral(self, user_message: str, history: List[Dict]) -> str:
        """Chat via Mistral API with RAG context injection."""
        # RAG retrieval
        retrieved_context = self.rag.retrieve(user_message, top_k=5)

        augmented_message = (
            f"{retrieved_context}\n\n"
            f"Based on the above retrieved city data, answer this question:\n"
            f"{user_message}"
        )

        messages = [{"role": "system", "content": self.system_prompt}]
        for msg in history[-5:]:
            messages.append({"role": msg["role"], "content": msg["content"]})
        messages.append({"role": "user", "content": augmented_message})

        response = self.mistral_client.chat.complete(
            model="mistral-large-latest",
            messages=messages,
        )
        return response.choices[0].message.content

    # ------------------------------------------------------------------
    # Chart explanation (Gemini Vision)
    # ------------------------------------------------------------------

    def explain_chart(self, image_bytes: bytes) -> str:
        """Use Mistral Pixtral Vision to explain a chart image."""
        if not self.mistral_client:
            return "Mistral is not configured. Cannot analyze images."

        prompt = (
            "You are UrbanMind AI analyzing a smart city analytics "
            "chart. Explain this chart to a city "
            "administrator in exactly 3-4 sentences:\n"
            "1. What metric is shown and the current trend\n"
            "2. The most important anomaly or pattern visible\n"
            "3. One specific actionable recommendation\n"
            "Be concise, data-driven, mention district names if visible."
        )
        
        try:
            import base64
            base64_image = base64.b64encode(image_bytes).decode('utf-8')
            
            messages = [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": f"data:image/png;base64,{base64_image}"}
                    ]
                }
            ]
            response = self.mistral_client.chat.complete(
                model="pixtral-12b-2409",
                messages=messages
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"[!!] Mistral Vision Error: {str(e)}")
            return f"Error analyzing chart: {str(e)}"
