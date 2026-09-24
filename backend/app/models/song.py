from datetime import datetime

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
    func,
)

from sqlalchemy.orm import (
    Mapped,
    mapped_column,
)

from app.db.database import (
    Base,
)


# ============================================================
# SONG DATABASE MODEL
# ============================================================

class Song(Base):

    __tablename__ = "songs"


    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )


    # --------------------------------------------------------
    # OWNER
    # --------------------------------------------------------

    user_id: Mapped[int] = mapped_column(

        ForeignKey(
            "users.id",
            ondelete="CASCADE",
        ),

        nullable=False,
        index=True,
    )


    # --------------------------------------------------------
    # SONG INFORMATION
    # --------------------------------------------------------

    theme: Mapped[str | None] = mapped_column(
        String(300),
        nullable=True,
    )


    mood: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )


    instruments: Mapped[list] = mapped_column(
        JSON,
        nullable=False,
    )


    duration: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )


    vocal_style: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )


    lyrics: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )


    # --------------------------------------------------------
    # GENERATED AUDIO
    # --------------------------------------------------------

    audio_path: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
    )


    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="completed",
    )


    # --------------------------------------------------------
    # CREATED TIME
    # --------------------------------------------------------

    created_at: Mapped[datetime] = mapped_column(

        DateTime(
            timezone=True
        ),

        server_default=func.now(),

        nullable=False,
    )