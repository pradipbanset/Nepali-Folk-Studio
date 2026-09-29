from datetime import datetime

from sqlalchemy import (
    DateTime,
    String,
    func,
)

from sqlalchemy.orm import (
    Mapped,
    mapped_column,
)

from app.db.database import Base


# ============================================================
# USER DATABASE MODEL
# ============================================================

class User(Base):

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
    )

    # Local email/password users will have this.
    # Google-only users may not have a password.
    password_hash: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    # Stable Google account identifier from the ID token "sub" claim.
    google_sub: Mapped[str | None] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )