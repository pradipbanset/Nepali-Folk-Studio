# ============================================================
# AUTHENTICATION DEPENDENCIES
# ============================================================

from fastapi import (
    Depends,
    HTTPException,
    status,
)

from fastapi.security import (
    HTTPAuthorizationCredentials,
    HTTPBearer,
)

from sqlalchemy.orm import (
    Session,
)

from app.core.security import (
    decode_access_token,
)

from app.db.database import (
    get_db,
)

from app.models.user import (
    User,
)


# ============================================================
# BEARER AUTHENTICATION
# ============================================================

bearer_scheme = HTTPBearer()


# ============================================================
# CURRENT USER
# ============================================================

def get_current_user(

    credentials:
        HTTPAuthorizationCredentials
        = Depends(
            bearer_scheme
        ),

    db: Session = Depends(
        get_db
    ),

) -> User:

    # --------------------------------------------------------
    # EXTRACT TOKEN
    # --------------------------------------------------------

    token = (
        credentials.credentials
    )


    # --------------------------------------------------------
    # DECODE TOKEN
    # --------------------------------------------------------

    try:

        user_id = (
            decode_access_token(
                token
            )
        )

    except ValueError:

        raise HTTPException(

            status_code=(
                status.HTTP_401_UNAUTHORIZED
            ),

            detail=(
                "Invalid or expired "
                "authentication token."
            ),

            headers={
                "WWW-Authenticate":
                    "Bearer"
            },
        )


    # --------------------------------------------------------
    # FIND USER
    # --------------------------------------------------------

    user = db.get(
        User,
        user_id,
    )


    # --------------------------------------------------------
    # USER NOT FOUND
    # --------------------------------------------------------

    if user is None:

        raise HTTPException(

            status_code=(
                status.HTTP_401_UNAUTHORIZED
            ),

            detail=(
                "User no longer exists."
            ),

            headers={
                "WWW-Authenticate":
                    "Bearer"
            },
        )


    # --------------------------------------------------------
    # RETURN AUTHENTICATED USER
    # --------------------------------------------------------

    return user