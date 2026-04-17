import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class VoiceNoteResponse(BaseModel):
    id: uuid.UUID
    patient_id: uuid.UUID
    nurse_id: uuid.UUID
    audio_file_path: str
    duration_seconds: Optional[float]
    transcript: Optional[str]
    structured_data: Optional[dict]
    actionable_items: Optional[list]
    flagged_concerns: Optional[list]
    recorded_at: datetime
    transcribed_at: Optional[datetime]

    model_config = {"from_attributes": True}
