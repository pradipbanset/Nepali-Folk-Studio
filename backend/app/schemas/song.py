from datetime import datetime

from pydantic import (
    BaseModel,
)


# ============================================================
# SONG RESPONSE
# ============================================================

class SongResponse(
    BaseModel
):

    id: int

    theme: str | None

    mood: str

    instruments: list[str]

    duration: int

    vocal_style: str

    lyrics: str

    status: str

    created_at: datetime

    audio_url: str