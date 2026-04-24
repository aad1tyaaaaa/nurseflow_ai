import json
import os
import re
import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.voice_note import VoiceNote


class VoiceNoteService:
    """
    Handles voice note recording, transcription, and NLP parsing.
    Transcription is produced client-side via the Web Speech API and uploaded
    with the audio; this service structures the transcript into clinical data
    via the Groq LLM.
    """

    @staticmethod
    async def create_voice_note(
        db: AsyncSession,
        patient_id: uuid.UUID,
        nurse_id: uuid.UUID,
        audio_file_path: str,
        duration_seconds: float = None,
        transcript: str = None,
    ) -> VoiceNote:
        voice_note = VoiceNote(
            patient_id=patient_id,
            nurse_id=nurse_id,
            audio_file_path=audio_file_path,
            duration_seconds=duration_seconds,
            transcript=transcript,
            transcribed_at=datetime.now(timezone.utc) if transcript else None,
        )
        db.add(voice_note)
        await db.flush()
        return voice_note

    @staticmethod
    async def structure_transcript(db: AsyncSession, voice_note_id: uuid.UUID) -> VoiceNote:
        """
        Run NLP over the transcript via the Groq LLM and persist the structured
        breakdown. Safe to call without an API key — will write empty placeholders.
        """
        result = await db.execute(select(VoiceNote).where(VoiceNote.id == voice_note_id))
        voice_note = result.scalar_one_or_none()
        if not voice_note:
            raise ValueError("Voice note not found")

        structured = {"symptoms": [], "observations": [], "actions_needed": []}
        actionable: list[str] = []
        flagged: list[str] = []

        if voice_note.transcript and settings.GROQ_API_KEY:
            try:
                structured, actionable, flagged = VoiceNoteService._groq_structure(voice_note.transcript)
            except Exception as e:  # pragma: no cover - network / model errors
                voice_note.structured_data = {
                    "symptoms": [],
                    "observations": [],
                    "actions_needed": [],
                    "error": f"LLM structuring failed: {e}",
                }
                voice_note.actionable_items = []
                voice_note.flagged_concerns = []
                await db.flush()
                return voice_note

        voice_note.structured_data = structured
        voice_note.actionable_items = actionable
        voice_note.flagged_concerns = flagged
        await db.flush()
        return voice_note

    @staticmethod
    def _groq_structure(transcript: str) -> tuple[dict, list[str], list[str]]:
        """Call Groq to turn a free-text nurse narration into structured fields."""
        # Local import to avoid hard dependency if disabled
        from app.services.groq_llm import groq_chat_completion

        system = (
            "You are a clinical NLP assistant for a nurse charting workflow. "
            "Extract structured data from a nurse's spoken observation. "
            "Return ONLY a valid JSON object with this exact shape:\n"
            '{\n'
            '  "symptoms": [string, ...],\n'
            '  "observations": [string, ...],\n'
            '  "actions_needed": [string, ...],\n'
            '  "actionable_items": [string, ...],\n'
            '  "flagged_concerns": [string, ...]\n'
            '}\n'
            "Rules:\n"
            "- symptoms: patient-reported or observed symptoms (chest pain, dyspnea, etc).\n"
            "- observations: objective findings the nurse describes (breath sounds, skin, affect).\n"
            "- actions_needed: interventions or follow-ups the nurse plans to do.\n"
            "- actionable_items: short imperative todo-style items derived from actions_needed.\n"
            "- flagged_concerns: anything clinically concerning that warrants escalation.\n"
            "- Use empty arrays if a category has nothing. Do not fabricate data.\n"
            "- Keep each item to a short phrase (<= 12 words)."
        )
        raw = groq_chat_completion(
            [
                {"role": "system", "content": system},
                {"role": "user", "content": f"Transcript:\n{transcript}\n\nReturn only the JSON object."},
            ],
            temperature=0.1,
            max_tokens=500,
        )

        parsed = VoiceNoteService._extract_json(raw) or {}
        structured = {
            "symptoms": [str(x) for x in (parsed.get("symptoms") or [])][:20],
            "observations": [str(x) for x in (parsed.get("observations") or [])][:20],
            "actions_needed": [str(x) for x in (parsed.get("actions_needed") or [])][:20],
        }
        actionable = [str(x) for x in (parsed.get("actionable_items") or structured["actions_needed"])][:20]
        flagged = [str(x) for x in (parsed.get("flagged_concerns") or [])][:20]
        return structured, actionable, flagged

    @staticmethod
    def _extract_json(raw: str) -> dict | None:
        cleaned = (raw or "").strip()
        fence = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", cleaned, re.DOTALL)
        if fence:
            cleaned = fence.group(1)
        else:
            brace = re.search(r"\{.*\}", cleaned, re.DOTALL)
            if brace:
                cleaned = brace.group(0)
        try:
            return json.loads(cleaned)
        except Exception:
            return None

    @staticmethod
    async def get_patient_voice_notes(db: AsyncSession, patient_id: uuid.UUID) -> list:
        result = await db.execute(
            select(VoiceNote)
            .where(VoiceNote.patient_id == patient_id)
            .order_by(VoiceNote.recorded_at.desc())
        )
        return list(result.scalars().all())

    @staticmethod
    def get_upload_path(patient_id: uuid.UUID, filename: str) -> str:
        upload_dir = os.path.join(settings.UPLOAD_DIR, "voice_notes", str(patient_id))
        os.makedirs(upload_dir, exist_ok=True)
        safe_filename = f"{uuid.uuid4()}_{filename}"
        return os.path.join(upload_dir, safe_filename)

