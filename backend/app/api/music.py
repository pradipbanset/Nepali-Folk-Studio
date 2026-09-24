# ============================================================
# MUSIC API ROUTE
# ============================================================

from pathlib import Path
from uuid import uuid4

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)

from fastapi.responses import (
    Response,
)

from sqlalchemy.orm import (
    Session,
)

from app.db.database import (
    get_db,
)

from app.dependencies.auth import (
    get_current_user,
)

from app.models.song import (
    Song,
)

from app.models.user import (
    User,
)

from app.schemas.music import (
    MusicRequest,
)

from app.services.gpu_client import (
    generate_song_on_gpu,
)


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/api",
    tags=["Music"],
)


# ============================================================
# GENERATE MUSIC
# ============================================================

@router.post(
    "/music",
    responses={
        200: {
            "content": {
                "audio/wav": {}
            },
            "description":
                "Generated Nepali folk song.",
        },

        401: {
            "description":
                "Authentication required."
        },

        503: {
            "description":
                "GPU music service unavailable."
        },
    },
)
async def generate_music(

    request: MusicRequest,

    current_user: User = Depends(
        get_current_user
    ),

    db: Session = Depends(
        get_db
    ),

):

    try:

        # ----------------------------------------------------
        # BUILD PAYLOAD FOR KAGGLE
        #
        # theme is database metadata only.
        # ACE-Step does not need it.
        # ----------------------------------------------------

        gpu_payload = request.model_dump(
            exclude={
                "theme"
            }
        )


        # ----------------------------------------------------
        # GENERATE SONG ON KAGGLE GPU
        # ----------------------------------------------------

        result = await generate_song_on_gpu(
            gpu_payload
        )


        # ----------------------------------------------------
        # SAVE GENERATED WAV LOCALLY
        # ----------------------------------------------------

        backend_root = (
            Path(__file__)
            .resolve()
            .parents[2]
        )


        audio_directory = (

            backend_root

            / "storage"

            / "generated_audio"

            / str(
                current_user.id
            )
        )


        audio_directory.mkdir(
            parents=True,
            exist_ok=True,
        )


        audio_filename = (
            f"{uuid4().hex}.wav"
        )


        audio_path = (
            audio_directory
            / audio_filename
        )


        audio_path.write_bytes(
            result["content"]
        )


        # ----------------------------------------------------
        # SAVE SONG RECORD TO POSTGRESQL
        # ----------------------------------------------------

        song = Song(

            user_id=(
                current_user.id
            ),

            theme=(
                request.theme
            ),

            mood=(
                request.mood
            ),

            instruments=[
                str(item)
                for item
                in request.instruments
            ],

            duration=(
                request.duration
            ),

            vocal_style=(
                request.vocal_style
            ),

            lyrics=(
                request.lyrics
            ),

            audio_path=str(
                audio_path
            ),

            status="completed",
        )


        db.add(
            song
        )


        try:

            db.commit()

            db.refresh(
                song
            )

        except Exception:

            db.rollback()


            # Remove WAV if database save fails.

            if audio_path.exists():

                audio_path.unlink()


            raise


        # ----------------------------------------------------
        # RESPONSE HEADERS
        # ----------------------------------------------------

        headers = {}


        if result.get(
            "request_id"
        ):

            headers[
                "X-Request-ID"
            ] = result[
                "request_id"
            ]


        if result.get(
            "device"
        ):

            headers[
                "X-Device"
            ] = result[
                "device"
            ]


        if result.get(
            "lora_scale"
        ):

            headers[
                "X-LoRA-Scale"
            ] = result[
                "lora_scale"
            ]


        if result.get(
            "vocal_style"
        ):

            headers[
                "X-Vocal-Style"
            ] = result[
                "vocal_style"
            ]


        # ----------------------------------------------------
        # OUR DATABASE SONG ID
        # ----------------------------------------------------

        headers[
            "X-Song-ID"
        ] = str(
            song.id
        )


        # ----------------------------------------------------
        # RETURN WAV DIRECTLY TO FRONTEND
        # ----------------------------------------------------

        return Response(

            content=(
                result[
                    "content"
                ]
            ),

            media_type=(
                result.get(
                    "content_type",
                    "audio/wav",
                )
            ),

            headers=headers,
        )


    # ========================================================
    # GPU / CLOUDFLARE / KAGGLE FAILURE
    # ========================================================

    except RuntimeError as error:

        print(
            "Music GPU error:",
            repr(error)
        )


        raise HTTPException(

            status_code=503,

            detail=str(
                error
            ),
        )


    # ========================================================
    # UNEXPECTED BACKEND ERROR
    # ========================================================

    except Exception as error:

        print(
            "Music API error:",
            repr(error)
        )


        raise HTTPException(

            status_code=500,

            detail=str(
                error
            ),
        )