from datetime import datetime

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
)


# ============================================================
# REGISTER REQUEST
# ============================================================

class RegisterRequest(
    BaseModel
):

    name: str = Field(
        min_length=2,
        max_length=100,
    )

    email: EmailStr

    password: str = Field(
        min_length=8,
        max_length=128,
    )


# ============================================================
# LOGIN REQUEST
# ============================================================

class LoginRequest(
    BaseModel
):

    email: EmailStr

    password: str = Field(
        min_length=8,
        max_length=128,
    )


# ============================================================
# TOKEN RESPONSE
# ============================================================

class TokenResponse(
    BaseModel
):

    access_token: str

    token_type: str = (
        "bearer"
    )


# ============================================================
# USER RESPONSE
# ============================================================

class UserResponse(
    BaseModel
):

    model_config = ConfigDict(
        from_attributes=True
    )

    id: int

    name: str

    email: EmailStr

    created_at: datetime