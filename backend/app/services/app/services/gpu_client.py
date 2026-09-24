import os

import httpx

from dotenv import load_dotenv


load_dotenv()


KAGGLE_GPU_URL = os.getenv(
    "KAGGLE_GPU_URL",
    "",
).rstrip("/")


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

        return {
            "online": (
                data.get("status") == "ok"
                and
                data.get("gpu") is True
            ),
            "detail": data,
        }

    except Exception as error:
        return {
            "online": False,
            "detail": str(error),
        }


async def generate_lyrics_on_gpu(
    payload: dict,
):
    if not KAGGLE_GPU_URL:
        raise RuntimeError(
            "KAGGLE_GPU_URL is not configured."
        )

    try:
        async with httpx.AsyncClient(
            timeout=240.0
        ) as client:

            response = await client.post(
                (
                    f"{KAGGLE_GPU_URL}"
                    "/generate-lyrics"
                ),
                json=payload,
            )

    except httpx.RequestError as error:
        raise RuntimeError(
            f"Could not reach Kaggle GPU: {error}"
        )

    if response.status_code != 200:

        try:
            data = response.json()

            detail = data.get(
                "detail",
                "GPU generation failed.",
            )

        except Exception:
            detail = (
                "GPU generation failed."
            )

        raise RuntimeError(
            detail
        )

    return response.json()