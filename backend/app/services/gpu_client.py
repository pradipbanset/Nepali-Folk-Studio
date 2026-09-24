import os

import httpx
from dotenv import load_dotenv


# ============================================================
# ENVIRONMENT
# ============================================================

load_dotenv()


KAGGLE_GPU_URL = os.getenv(
    "KAGGLE_GPU_URL",
    "",
).rstrip("/")


# ============================================================
# GPU HEALTH
# ============================================================

async def check_gpu_health():

    if not KAGGLE_GPU_URL:

        return {
            "online": False,
            "detail": (
                "KAGGLE_GPU_URL is not configured."
            ),
        }


    try:

        async with httpx.AsyncClient(
            timeout=15.0
        ) as client:

            response = await client.get(
                f"{KAGGLE_GPU_URL}/health"
            )


        if response.status_code != 200:

            return {
                "online": False,
                "detail": (
                    "GPU service returned "
                    f"HTTP {response.status_code}."
                ),
            }


        data = response.json()


        # ----------------------------------------------------
        # DUAL-GPU HEALTH FORMAT
        # ----------------------------------------------------

        gemma = data.get(
            "gemma",
            {}
        )

        ace = data.get(
            "ace",
            {}
        )


        online = (

            data.get("status")
            == "ok"

            and

            data.get(
                "gpu_count",
                0
            ) >= 2

            and

            gemma.get(
                "loaded"
            ) is True

            and

            ace.get(
                "loaded"
            ) is True
        )


        return {

            "online":
                online,

            "detail":
                data,
        }


    except Exception as error:

        return {

            "online": False,

            "detail":
                str(error),
        }


# ============================================================
# GENERATE LYRICS
# ============================================================

async def generate_lyrics_on_gpu(
    payload: dict,
):

    if not KAGGLE_GPU_URL:

        raise RuntimeError(
            "KAGGLE_GPU_URL is not configured."
        )


    try:

        async with httpx.AsyncClient(
            timeout=300.0
        ) as client:

            response = await client.post(

                (
                    f"{KAGGLE_GPU_URL}/"
                    "generate-lyrics"
                ),

                json=payload,
            )


    except httpx.RequestError as error:

        raise RuntimeError(
            f"Could not reach Kaggle GPU: {error}"
        )


    # --------------------------------------------------------
    # GPU ERROR RESPONSE
    # --------------------------------------------------------

    if response.status_code != 200:

        try:

            data = response.json()

            detail = data.get(
                "detail",
                "GPU lyrics generation failed.",
            )

        except Exception:

            detail = (
                "GPU lyrics generation failed."
            )


        raise RuntimeError(
            detail
        )


    # --------------------------------------------------------
    # RETURN GEMMA RESPONSE
    # --------------------------------------------------------

    return response.json()


# ============================================================
# GENERATE MUSIC
# ============================================================

async def generate_song_on_gpu(
    payload: dict,
):

    if not KAGGLE_GPU_URL:

        raise RuntimeError(
            "KAGGLE_GPU_URL is not configured."
        )


    try:

        async with httpx.AsyncClient(
            timeout=1200.0
        ) as client:

            response = await client.post(

                (
                    f"{KAGGLE_GPU_URL}/"
                    "generate-song"
                ),

                json=payload,
            )


    except httpx.RequestError as error:

        raise RuntimeError(
            f"Could not reach Kaggle GPU: {error}"
        )


    # --------------------------------------------------------
    # GPU ERROR RESPONSE
    # --------------------------------------------------------

    if response.status_code != 200:

        try:

            data = response.json()

            detail = data.get(
                "detail",
                "GPU music generation failed.",
            )

        except Exception:

            detail = (
                "GPU music generation failed."
            )


        raise RuntimeError(
            detail
        )


    # --------------------------------------------------------
    # KAGGLE RETURNS WAV FILE DIRECTLY
    # --------------------------------------------------------

    return {

        "content":
            response.content,

        "content_type":
            response.headers.get(
                "content-type",
                "audio/wav",
            ),

        "request_id":
            response.headers.get(
                "x-request-id"
            ),

        "device":
            response.headers.get(
                "x-device"
            ),

        "lora_scale":
            response.headers.get(
                "x-lora-scale"
            ),

        "vocal_style":
            response.headers.get(
                "x-vocal-style"
            ),
    }