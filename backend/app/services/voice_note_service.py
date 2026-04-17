import os
import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.voice_note import VoiceNote


class VoiceNoteService:
    """
    Handles voice note recording, transcription, and NLP parsing.
    In production, integrates with speech-to-text (e.g., Whisper) and clinical NLP models.
    """

    @staticmethod
    async def create_voice_note(
        db: AsyncSession,
        patient_id: uuid.UUID,
        nurse_id: uuid.UUID,
        audio_file_path: str,
        duration_seconds: float = None,
    ) -> VoiceNote:
        voice_note = VoiceNote(
            patient_id=patient_id,
            nurse_id=nurse_id,
            audio_file_path=audio_file_path,
            duration_seconds=duration_seconds,
        )
        db.add(voice_note)
        await db.flush()
        return voice_note

    @staticmethod
    async def transcribe_and_parse(db: AsyncSession, voice_note_id: uuid.UUID) -> VoiceNote:
        """
        Transcribe audio and extract structured clinical data via NLP.
        In production, this calls Whisper for transcription and a clinical NLP model.
        """
        result = await db.execute(select(VoiceNote).where(VoiceNote.id == voice_note_id))
        voice_note = result.scalar_one_or_none()
        if not voice_note:
            raise ValueError("Voice note not found")

        # Placeholder: In production, call speech-to-text API
        voice_note.transcript = "[Transcription pending — requires speech-to-text model integration]"
        voice_note.transcribed_at = datetime.now(timezone.utc)

        # Placeholder: In production, call clinical NLP for extraction
        voice_note.structured_data = {
            "symptoms": [],
            "observations": [],
            "actions_needed": [],
        }
        voice_note.actionable_items = []
        voice_note.flagged_concerns = []

        await db.flush()
        return voice_note

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
