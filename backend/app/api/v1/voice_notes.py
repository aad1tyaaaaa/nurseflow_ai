import uuid
import aiofiles

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.api.deps import get_current_user, require_permission
from app.config import settings
from app.models.user import User
from app.schemas.voice_note import VoiceNoteResponse
from app.services.voice_note_service import VoiceNoteService

router = APIRouter(prefix="/voice-notes", tags=["Voice Notes"])


class StructureRequest(BaseModel):
    transcript: str


class StructureResponse(BaseModel):
    structured_data: dict
    actionable_items: list[str]
    flagged_concerns: list[str]


@router.post("", response_model=VoiceNoteResponse, status_code=status.HTTP_201_CREATED)
async def upload_voice_note(
    patient_id: uuid.UUID = Form(...),
    audio: UploadFile = File(...),
    duration_seconds: float = Form(None),
    transcript: str = Form(None),
    current_user: User = Depends(require_permission("voice_notes:create")),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload a recorded voice note for a patient.

    The browser captures audio via MediaRecorder and the transcript via the
    Web Speech API. The backend stores the audio blob, saves the transcript,
    and runs the transcript through the Groq LLM to extract structured
    clinical data (symptoms, observations, actionable items, flagged concerns).
    """
    # Validate file size
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    contents = await audio.read()
    if len(contents) > max_bytes:
        raise HTTPException(status_code=413, detail=f"File too large. Max {settings.MAX_UPLOAD_SIZE_MB}MB")

    # Validate content type — be permissive: accept anything with audio/* or the
    # common generic fallbacks some browsers emit for MediaRecorder.
    ct = (audio.content_type or "").lower()
    allowed_prefixes = ("audio/",)
    allowed_exact = {"application/octet-stream", "video/webm"}
    if not (ct.startswith(allowed_prefixes) or ct in allowed_exact):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported audio format: {ct!r}. Expected audio/* (e.g. audio/webm, audio/mp4).",
        )

    # Save file
    file_path = VoiceNoteService.get_upload_path(patient_id, audio.filename or "note.webm")
    async with aiofiles.open(file_path, "wb") as f:
        await f.write(contents)

    # Create record with transcript (if any)
    voice_note = await VoiceNoteService.create_voice_note(
        db,
        patient_id=patient_id,
        nurse_id=current_user.id,
        audio_file_path=file_path,
        duration_seconds=duration_seconds,
        transcript=(transcript or None),
    )

    # Structure the transcript via LLM (no-op if transcript is empty or no API key)
    await VoiceNoteService.structure_transcript(db, voice_note.id)
    await db.refresh(voice_note)

    return voice_note


@router.post("/structure", response_model=StructureResponse)
async def structure_transcript_preview(
    body: StructureRequest,
    current_user: User = Depends(require_permission("voice_notes:create")),
):
    """
    Run the Groq LLM over a transcript and return structured clinical data
    without persisting anything. Used by the Voice Studio preview pane.
    """
    transcript = (body.transcript or "").strip()
    if not transcript:
        raise HTTPException(status_code=400, detail="transcript is required")
    if not settings.GROQ_API_KEY:
        raise HTTPException(status_code=503, detail="GROQ_API_KEY is not configured on the server")

    try:
        structured, actionable, flagged = VoiceNoteService._groq_structure(transcript)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"LLM call failed: {e}")

    return StructureResponse(
        structured_data=structured,
        actionable_items=actionable,
        flagged_concerns=flagged,
    )


@router.get("/patient/{patient_id}", response_model=list[VoiceNoteResponse])
async def get_patient_voice_notes(
    patient_id: uuid.UUID,
    current_user: User = Depends(require_permission("voice_notes:read")),
    db: AsyncSession = Depends(get_db),
):
    """Get all voice notes for a patient."""
    notes = await VoiceNoteService.get_patient_voice_notes(db, patient_id)
    return notes


@router.get("", response_model=list[VoiceNoteResponse])
async def list_voice_notes(
    limit: int = 50,
    current_user: User = Depends(require_permission("voice_notes:read")),
    db: AsyncSession = Depends(get_db),
):
    """List the most recent voice notes across all patients."""
    from sqlalchemy import select
    from app.models.voice_note import VoiceNote

    result = await db.execute(
        select(VoiceNote).order_by(VoiceNote.recorded_at.desc()).limit(limit)
    )
    return list(result.scalars().all())


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

