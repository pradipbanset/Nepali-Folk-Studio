import os

from dotenv import load_dotenv

from sqlalchemy import (
    create_engine,
    text,
)

from sqlalchemy.orm import (
    DeclarativeBase,
    sessionmaker,
)


# ============================================================
# ENVIRONMENT
# ============================================================

load_dotenv()


DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "",
).strip()


if not DATABASE_URL:

    raise RuntimeError(
        "DATABASE_URL is not configured."
    )


# ============================================================
# SQLALCHEMY ENGINE
# ============================================================

engine = create_engine(

    DATABASE_URL,

    pool_pre_ping=True,
)


# ============================================================
# DATABASE SESSION
# ============================================================

SessionLocal = sessionmaker(

    bind=engine,

    autoflush=False,

    autocommit=False,
)


# ============================================================
# BASE MODEL
# ============================================================

class Base(
    DeclarativeBase
):
    pass


# ============================================================
# FASTAPI DATABASE DEPENDENCY
# ============================================================

def get_db():

    db = SessionLocal()

    try:

        yield db

    finally:

        db.close()


# ============================================================
# DATABASE HEALTH CHECK
# ============================================================

def check_database_connection():

    with engine.connect() as connection:

        result = connection.execute(
            text(
                "SELECT 1"
            )
        )

        return (
            result.scalar_one()
            == 1
        )