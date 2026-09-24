from typing import Literal

from pydantic import BaseModel, Field


VocalStyle = Literal[
    "auto",
    "male_solo",
    "female_solo",
    "male_female_duet",
    "female_duet",
    "male_duet",
    "call_response",
]


class MusicRequest(BaseModel):


    theme: str | None = Field(
        default=None,
        max_length=300,
    )

    lyrics: str = Field(
        min_length=3,
    )


    mood: Literal[
        "nostalgic",
        "romantic",
        "joyful",
        "emotional",
    ]

    instruments: list[
        Literal[
            "madal",
            "sarangi",
            "bansuri",
        ]
    ] = Field(
        min_length=1,
        max_length=3,
    )

    duration: Literal[
        60,
        90,
        150,
    ]

    vocal_style: VocalStyle = (
        "auto"
    )