from typing import Literal

from pydantic import BaseModel, Field


MoodType = Literal[
    "nostalgic",
    "romantic",
    "joyful",
    "emotional",
]


InstrumentType = Literal[
    "madal",
    "sarangi",
    "bansuri",
]


class LyricsRequest(BaseModel):
    theme: str = Field(
        min_length=3,
        max_length=300,
    )

    mood: MoodType

    instruments: list[InstrumentType] = Field(
        min_length=1,
        max_length=3,
    )

    duration: Literal[
        60,
        90,
        150,
    ]


class LyricsResponse(BaseModel):
    status: str

    lyrics: str

    model: str