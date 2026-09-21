import json
import logging
from typing import Any, Dict, List

import requests

from config import Config

logger = logging.getLogger(__name__)


class AIServiceError(Exception):
    """Raised when the configured AI provider cannot return a response."""


class AIService:
    def _system_instruction(self):
        return Config.BUSINESS_CONTEXT

    def _demo_response(self):
        return "Demo modu aktif. EMOVIA, duygularını anlaman ve psikolojik iyi oluşunu desteklemen için burada."

    def yanit_uret(self, mesaj: str, gecmis: List[Dict[str, str]] | None = None) -> str:
        if not Config.GROQ_API_KEY:
            return self._demo_response()

        messages = [{"role": "system", "content": self._system_instruction()}]
        messages.extend(gecmis or [])
        messages.append({"role": "user", "content": mesaj})
        payload = {
            "model": Config.GROQ_MODEL,
            "messages": messages,
            "temperature": 0.7,
        }
        if Config.GROQ_MODEL.startswith("openai/gpt-oss-"):
            payload["max_completion_tokens"] = 2048
            payload["reasoning_effort"] = "medium"
        else:
            payload["max_tokens"] = 350
        headers = {"Authorization": f"Bearer {Config.GROQ_API_KEY}", "Content-Type": "application/json"}

        try:
            response = requests.post(
                f"{Config.GROQ_API_BASE_URL}/chat/completions",
                headers=headers,
                data=json.dumps(payload),
                timeout=20,
            )
            response.raise_for_status()
            result = response.json()
            return result["choices"][0]["message"]["content"].strip()
        except (requests.RequestException, KeyError, IndexError, ValueError) as exc:
            status_code = getattr(getattr(exc, "response", None), "status_code", None)
            logger.error(
                "Groq request failed: status=%s model=%s key_configured=%s",
                status_code,
                Config.GROQ_MODEL,
                bool(Config.GROQ_API_KEY),
            )
            raise AIServiceError("AI sağlayıcısından yanıt alınamadı.") from exc


ai_service = AIService()


def generate_ai_response(user_message: str) -> Dict[str, Any]:
    """Compatibility wrapper for the previous service API."""
    return {"status": "success", "message": ai_service.yanit_uret(user_message, [])}
