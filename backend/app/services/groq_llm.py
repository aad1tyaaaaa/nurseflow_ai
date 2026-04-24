import httpx
from app.config import settings

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"


def get_groq_headers():
    return {
        "Authorization": f"Bearer {settings.GROQ_API_KEY}",
        "Content-Type": "application/json",
    }


def groq_chat_completion(messages, model=None, temperature=0.2, max_tokens=512):
    if not settings.GROQ_API_KEY:
        raise RuntimeError("GROQ_API_KEY not set in environment.")
    payload = {
        "model": model or settings.GROQ_MODEL or "llama-3.3-70b-versatile",
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }
    try:
        response = httpx.post(GROQ_API_URL, headers=get_groq_headers(), json=payload, timeout=30)
    except httpx.RequestError as e:
        raise RuntimeError(f"Could not reach Groq API: {e}") from e

    if response.status_code >= 400:
        # Surface Groq's actual error body (e.g. "Invalid API Key") instead of a generic httpx message.
        try:
            body = response.json()
            detail = body.get("error", {}).get("message") or body
        except Exception:
            detail = response.text[:300]
        if response.status_code == 401:
            raise RuntimeError(
                f"Groq rejected the API key (401). Check GROQ_API_KEY in backend/.env "
                f"and restart uvicorn. Details: {detail}"
            )
        raise RuntimeError(f"Groq API error {response.status_code}: {detail}")

    data = response.json()
    return data["choices"][0]["message"]["content"]
