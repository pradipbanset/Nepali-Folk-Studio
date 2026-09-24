# ============================================================
# LYRICS API ROUTE
# ============================================================

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)

from app.dependencies.auth import (
    get_current_user,
)

from app.models.user import (
    User,
)

from app.schemas.lyrics import (
    LyricsRequest,
    LyricsResponse,
)

from app.services.gpu_client import (
    generate_lyrics_on_gpu,
)


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/api",
    tags=["Lyrics"],
)


# ============================================================
# GENERATE LYRICS
# ============================================================

@router.post(
    "/lyrics",
    response_model=LyricsResponse,
    responses={
        401: {
            "description":
                "Authentication required."
        },

        503: {
            "description":
                "GPU service unavailable."
        },
    },
)
async def generate_lyrics(

    request: LyricsRequest,

    current_user: User = Depends(
        get_current_user
    ),

):

    # --------------------------------------------------------
    # REQUEST LOG
    # --------------------------------------------------------

    print("=" * 60)
    print("LYRICS REQUEST RECEIVED")
    print("=" * 60)

    print(
        "User ID:",
        current_user.id
    )

    print(
        "User:",
        current_user.email
    )

    print(
        "Theme:",
        request.theme
    )

    print(
        "Mood:",
        request.mood
    )

    print(
        "Instruments:",
        request.instruments
    )

    print(
        "Duration:",
        request.duration
    )


    # --------------------------------------------------------
    # BUILD KAGGLE PAYLOAD
    # --------------------------------------------------------

    payload = {

        "theme":
            request.theme,

        "mood":
            request.mood,

        "instruments":
            request.instruments,

        "duration":
            request.duration,
    }


    # --------------------------------------------------------
    # GENERATE LYRICS
    # --------------------------------------------------------

    try:

        result = (
            await generate_lyrics_on_gpu(
                payload
            )
        )


        print("=" * 60)
        print("GPU RESPONSE")
        print("=" * 60)

        print(
            result
        )


        lyrics = result.get(
            "lyrics"
        )


        model_name = result.get(
            "model"
        )


        # ----------------------------------------------------
        # VALIDATE GPU RESPONSE
        # ----------------------------------------------------

        if not lyrics:

            raise RuntimeError(
                "GPU response did not "
                "contain generated lyrics."
            )


        if not model_name:

            model_name = (
                "gemma-3-4b-"
                "nepali-lyrics-lora"
            )


        # ----------------------------------------------------
        # RETURN RESPONSE
        # ----------------------------------------------------

        return LyricsResponse(

            status="success",

            lyrics=lyrics,

            model=model_name,
        )


    # ========================================================
    # GPU FAILURE
    # ========================================================

    except RuntimeError as error:

        print("=" * 60)
        print("GPU RUNTIME ERROR")
        print("=" * 60)

        print(
            repr(error)
        )


        raise HTTPException(

            status_code=503,

            detail=str(
                error
            ),
        )


    # ========================================================
    # UNEXPECTED ERROR
    # ========================================================

    except Exception as error:

        print("=" * 60)
        print(
            "UNEXPECTED BACKEND ERROR"
        )
        print("=" * 60)

        print(
            type(error).__name__,
            repr(error)
        )


        raise HTTPException(

            status_code=500,

            detail=(
                f"{type(error).__name__}: "
                f"{error}"
            ),
        )