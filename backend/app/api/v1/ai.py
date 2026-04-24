from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.services.groq_llm import groq_chat_completion

# Request/response schemas
class HandoffNoteRequest(BaseModel):
    patient_id: Optional[str]
    clinical_notes: str

class HandoffNoteResponse(BaseModel):
    handoff_note: str

class MedicationUrgencyRequest(BaseModel):
    medications: List[str]

class MedicationUrgencyItem(BaseModel):
    medication: str
    urgency: str

class MedicationUrgencyResponse(BaseModel):
    results: List[MedicationUrgencyItem]


class VoiceNavigateRequest(BaseModel):
    utterance: str
    current_route: Optional[str] = None


class VoiceNavigateResponse(BaseModel):
    intent: str                       # "navigate" | "search_patient" | "unknown"
    route: Optional[str] = None       # e.g. "/dashboard"
    patient_query: Optional[str] = None  # e.g. "Robert Miller" or "bed 7"
    speech_response: str              # what the assistant says back
    raw: Optional[str] = None         # raw LLM output (debug)


router = APIRouter()


# Updated AI logic using Groq LLM

def generate_handoff_note(notes: str) -> str:
    prompt = (
        "You are an expert clinical workflow assistant. "
        "Summarize the following clinical notes into a concise, structured SBAR handoff note for nurses. "
        "Use clear, professional language.\n\n"
        f"Clinical Notes:\n{notes}\n\nSBAR Handoff Note:"
    )
    messages = [
        {"role": "system", "content": "You are a clinical workflow assistant."},
        {"role": "user", "content": prompt},
    ]
    return groq_chat_completion(messages, max_tokens=400)

def categorize_medication_urgency(medications: List[str]) -> List[dict]:
    prompt = (
        "You are an AI nurse assistant. For each medication in the following list, "
        "categorize its urgency as 'High', 'Medium', or 'Low' based on typical hospital workflow. "
        "Return a JSON array of objects with 'medication' and 'urgency'.\n\nMedications:\n"
        + "\n".join(medications)
        + "\n\nJSON:"
    )
    messages = [
        {"role": "system", "content": "You are a clinical workflow assistant."},
        {"role": "user", "content": prompt},
    ]
    import json
    resp = groq_chat_completion(messages, max_tokens=400)
    try:
        return json.loads(resp)
    except Exception:
        # fallback: assign all as Medium
        return [{"medication": m, "urgency": "Medium"} for m in medications]

@router.post("/handoff-note", response_model=HandoffNoteResponse)
async def handoff_note(request: HandoffNoteRequest):
    note = generate_handoff_note(request.clinical_notes)
    return {"handoff_note": note}

@router.post("/medication-urgency", response_model=MedicationUrgencyResponse)
async def medication_urgency(request: MedicationUrgencyRequest):
    results = categorize_medication_urgency(request.medications)
    return {"results": results}


# ---------------------------------------------------------------------------
# Voice navigation
# ---------------------------------------------------------------------------

NAV_SYSTEM_PROMPT = """You are the voice navigation assistant for NurseFlow, a clinical nursing workflow app.

Your job: convert a nurse's spoken command into a single JSON object that drives
in-app navigation. Do NOT answer medical questions. Only route the user.

Available routes:
  /dashboard       — main dashboard, unit overview, shift summary
  /patients        — patient registry list
  /patients/{id}   — a specific patient's detail (requires patient_query)
  /alerts          — clinical alerts and escalations
  /medications     — medication queue / MAR
  /fall-risk       — fall risk monitoring + CV mobility camera
  /handoff         — SBAR handoff / end-of-shift
  /voice           — voice notes / documentation studio
  /settings        — user profile & preferences

Output strictly valid JSON with this shape and nothing else:
{
  "intent": "navigate" | "search_patient" | "unknown",
  "route": "<one of the routes above, or null>",
  "patient_query": "<free text like 'Robert Miller' or 'bed 7', or null>",
  "speech_response": "<short sentence the assistant will speak back>"
}

Rules:
- If the user names a patient ("open Robert Miller", "go to bed 7"), set intent="search_patient",
  route="/patients", patient_query to their spoken reference.
- If the request is clearly a page ("show me alerts", "take me to medications"), set intent="navigate"
  and route accordingly.
- If the command is unclear, ambiguous, or not about navigation, set intent="unknown",
  route=null, and politely ask for clarification in speech_response.
- Keep speech_response under 15 words and friendly.
- Never invent routes that are not in the list above.
"""


def _parse_nav_json(raw: str) -> dict:
    """Best-effort extraction of the JSON object from the LLM output."""
    import json, re
    # Strip code fences if the model wrapped it
    cleaned = raw.strip()
    fence = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", cleaned, re.DOTALL)
    if fence:
        cleaned = fence.group(1)
    else:
        # Fall back to the first {...} block
        brace = re.search(r"\{.*\}", cleaned, re.DOTALL)
        if brace:
            cleaned = brace.group(0)
    try:
        return json.loads(cleaned)
    except Exception:
        return {}


@router.post("/navigate", response_model=VoiceNavigateResponse)
async def voice_navigate(request: VoiceNavigateRequest):
    """Turn a spoken nurse command into a structured navigation intent via Groq."""
    utterance = (request.utterance or "").strip()
    if not utterance:
        raise HTTPException(status_code=400, detail="utterance is required")

    user_content = f"Nurse said: \"{utterance}\""
    if request.current_route:
        user_content += f"\nCurrent page: {request.current_route}"
    user_content += "\nReturn only the JSON object."

    messages = [
        {"role": "system", "content": NAV_SYSTEM_PROMPT},
        {"role": "user", "content": user_content},
    ]

    try:
        raw = groq_chat_completion(messages, temperature=0.1, max_tokens=200)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"LLM call failed: {e}")

    parsed = _parse_nav_json(raw)

    # Whitelist routes for safety
    allowed_routes = {
        "/dashboard", "/patients", "/alerts", "/medications",
        "/fall-risk", "/handoff", "/voice", "/settings",
    }
    route = parsed.get("route")
    if route is not None and route not in allowed_routes:
        # allow /patients/<id> path but we don't resolve IDs here
        if not (isinstance(route, str) and route.startswith("/patients")):
            route = None

    intent = parsed.get("intent") or "unknown"
    if intent not in {"navigate", "search_patient", "unknown"}:
        intent = "unknown"

    speech = parsed.get("speech_response") or "Sorry, I didn't catch that. Could you say it again?"

    return VoiceNavigateResponse(
        intent=intent,
        route=route,
        patient_query=parsed.get("patient_query"),
        speech_response=speech,
        raw=raw if not parsed else None,
    )
