from fastapi import FastAPI

from fastapi.middleware.cors import (
    CORSMiddleware,
)

from app.api.lyrics import (
    router as lyrics_router,
)
from app.api.music import router as music_router

from app.services.gpu_client import (
    check_gpu_health,
)

from app.api.auth import (
    router as auth_router,
)

from app.api.songs import (
    router as songs_router,
)


app = FastAPI(
    title="Nepali Folk Studio API",

    description=(
        "Backend API for AI-powered "
        "Nepali folk music generation."
    ),

    version="0.3.0",
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "http://localhost:3000",
    ],

    allow_credentials=True,

    allow_methods=[
        "*",
    ],

    allow_headers=[
        "*",
    ],
)


# ============================================================
# ROUTERS
# ============================================================

app.include_router(
    lyrics_router
)

app.include_router(
    music_router
)

app.include_router(
    auth_router
)

app.include_router(
    songs_router
)



# ============================================================
# ROOT
# ============================================================

@app.get("/")
async def root():
    return {
        "name":
            "Nepali Folk Studio API",

        "status":
            "running",

        "version":
            "0.3.0",
    }


# ============================================================
# HEALTH
# ============================================================

@app.get("/api/health")
async def health():

    gpu_status = (
        await check_gpu_health()
    )

    return {
        "status":
            "ok",

        "service":
            "nepali-folk-studio-backend",

        "gpu":
            (
                "online"
                if gpu_status["online"]
                else "offline"
            ),
    }