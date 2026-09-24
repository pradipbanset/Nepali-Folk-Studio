import os

from datetime import (
    datetime,
    timedelta,
    timezone,
)

import jwt

from jwt.exceptions import (
    InvalidTokenError,
)

from pwdlib import PasswordHash

from dotenv import load_dotenv


# ============================================================
# ENVIRONMENT
# ============================================================

load_dotenv()


JWT_SECRET_KEY = os.getenv(
    "JWT_SECRET_KEY",
    "",
).strip()


if not JWT_SECRET_KEY:

    raise RuntimeError(
        "JWT_SECRET_KEY is not configured."
    )


JWT_ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = 60


# ============================================================
# PASSWORD HASHING
# ============================================================

password_hash = (
    PasswordHash.recommended()
)


def hash_password(
    password: str,
) -> str:

    return password_hash.hash(
        password
    )


def verify_password(
    plain_password: str,
    hashed_password: str,
) -> bool:

    return password_hash.verify(
        plain_password,
        hashed_password,
    )


# ============================================================
# CREATE JWT ACCESS TOKEN
# ============================================================

def create_access_token(
    user_id: int,
) -> str:

    expires_at = (
        datetime.now(
            timezone.utc
        )
        + timedelta(
            minutes=(
                ACCESS_TOKEN_EXPIRE_MINUTES
            )
        )
    )


    payload = {

        "sub": str(
            user_id
        ),

        "exp": expires_at,
    }


    return jwt.encode(

        payload,

        JWT_SECRET_KEY,

        algorithm=(
            JWT_ALGORITHM
        ),
    )


# ============================================================
# DECODE JWT ACCESS TOKEN
# ============================================================

def decode_access_token(
    token: str,
) -> int:

    try:

        payload = jwt.decode(

            token,

            JWT_SECRET_KEY,

            algorithms=[
                JWT_ALGORITHM
            ],
        )


        user_id = payload.get(
            "sub"
        )


        if not user_id:

            raise InvalidTokenError(
                "Missing token subject."
            )


        return int(
            user_id
        )


    except (
        InvalidTokenError,
        ValueError,
        TypeError,
    ) as error:

        raise ValueError(
            "Invalid or expired token."
        ) from error