import uuid
import aiofiles

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.api.deps import get_current_user, require_permission
from app.config import settings
from app.models.user import User
from app.schemas.voice_note import VoiceNoteResponse
from app.services.voice_note_service import VoiceNoteService

router = APIRouter(prefix="/voice-notes", tags=["Voice Notes"])


@router.post("", response_model=VoiceNoteResponse, status_code=status.HTTP_201_CREATED)
async def upload_voice_note(
    patient_id: uuid.UUID = Form(...),
    audio: UploadFile = File(...),
    duration_seconds: float = Form(None),
    current_user: User = Depends(require_permission("voice_notes:create")),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload a voice note for a patient. Triggers automatic transcription and NLP parsing.
    Supports hands-free voice recording workflow.
    """
    # Validate file size
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    contents = await audio.read()
    if len(contents) > max_bytes:
        raise HTTPException(status_code=413, detail=f"File too large. Max {settings.MAX_UPLOAD_SIZE_MB}MB")

    # Validate content type
    allowed_types = ["audio/mpeg", "audio/wav", "audio/ogg", "audio/webm", "audio/mp4"]
    if audio.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail=f"Unsupported audio format. Allowed: {allowed_types}")

    # Save file
    file_path = VoiceNoteService.get_upload_path(patient_id, audio.filename)
    async with aiofiles.open(file_path, "wb") as f:
        await f.write(contents)

    # Create record
    voice_note = await VoiceNoteService.create_voice_note(
        db, patient_id, current_user.id, file_path, duration_seconds
    )

    # Trigger async transcription (in production, this would be a background task)
    await VoiceNoteService.transcribe_and_parse(db, voice_note.id)

    return voice_note


@router.get("/patient/{patient_id}", response_model=list[VoiceNoteResponse])
async def get_patient_voice_notes(
    patient_id: uuid.UUID,
    current_user: User = Depends(require_permission("voice_notes:read")),
    db: AsyncSession = Depends(get_db),
):
    """Get all voice notes for a patient."""
    notes = await VoiceNoteService.get_patient_voice_notes(db, patient_id)
    return notes


@router.get("/{note_id}", response_model=VoiceNoteResponse)
async def get_voice_note(
    note_id: uuid.UUID,
    current_user: User = Depends(require_permission("voice_notes:read")),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific voice note with transcript and extracted data."""
    from sqlalchemy import select
    from app.models.voice_note import VoiceNote

    result = await db.execute(select(VoiceNote).where(VoiceNote.id == note_id))
    note = result.scalar_one_or_none()
    if not note:
        raise HTTPException(status_code=404, detail="Voice note not found")
    return note
