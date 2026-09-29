# ============================================================
# AUTH API ROUTES
# ============================================================

import os

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)

from google.auth.transport import (
    requests as google_requests,
)

from google.oauth2 import (
    id_token,
)

from sqlalchemy import (
    select,
)

from sqlalchemy.exc import (
    IntegrityError,
)

from sqlalchemy.orm import (
    Session,
)

from dotenv import (
    load_dotenv,
)


from app.core.security import (
    create_access_token,
    hash_password,
    verify_password,
)

from app.db.database import (
    get_db,
)

from app.dependencies.auth import (
    get_current_user,
)

from app.models.user import (
    User,
)

from app.schemas.auth import (
    GoogleAuthRequest,
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)


# ============================================================
# ENVIRONMENT
# ============================================================

load_dotenv()


GOOGLE_CLIENT_ID = os.getenv(
    "GOOGLE_CLIENT_ID",
    "",
).strip()


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"],
)


# ============================================================
# REGISTER USER
# ============================================================

@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register_user(
    request: RegisterRequest,
    db: Session = Depends(
        get_db
    ),
):

    email = (
        str(request.email)
        .strip()
        .lower()
    )

    name = (
        request.name
        .strip()
    )


    existing_user = db.scalar(

        select(User).where(
            User.email == email
        )
    )


    if existing_user:

        raise HTTPException(

            status_code=(
                status.HTTP_409_CONFLICT
            ),

            detail=(
                "A user with this "
                "email already exists."
            ),
        )


    hashed_password = (
        hash_password(
            request.password
        )
    )


    user = User(

        name=name,

        email=email,

        password_hash=(
            hashed_password
        ),
    )


    db.add(
        user
    )


    try:

        db.commit()

    except IntegrityError:

        db.rollback()

        raise HTTPException(

            status_code=(
                status.HTTP_409_CONFLICT
            ),

            detail=(
                "A user with this "
                "email already exists."
            ),
        )


    db.refresh(
        user
    )


    return user


# ============================================================
# LOGIN USER
# ============================================================

@router.post(
    "/login",
    response_model=TokenResponse,
)
def login_user(
    request: LoginRequest,
    db: Session = Depends(
        get_db
    ),
):

    email = (
        str(request.email)
        .strip()
        .lower()
    )


    user = db.scalar(

        select(User).where(
            User.email == email
        )
    )


    if user is None:

        raise HTTPException(

            status_code=(
                status.HTTP_401_UNAUTHORIZED
            ),

            detail=(
                "Invalid email or password."
            ),

            headers={
                "WWW-Authenticate":
                    "Bearer"
            },
        )


    password_valid = (
        verify_password(
            request.password,
            user.password_hash,
        )
    )


    if not password_valid:

        raise HTTPException(

            status_code=(
                status.HTTP_401_UNAUTHORIZED
            ),

            detail=(
                "Invalid email or password."
            ),

            headers={
                "WWW-Authenticate":
                    "Bearer"
            },
        )


    access_token = (
        create_access_token(
            user.id
        )
    )


    return TokenResponse(

        access_token=(
            access_token
        ),

        token_type="bearer",
    )


# ============================================================
# GOOGLE LOGIN
# ============================================================

@router.post(
    "/google",
    response_model=TokenResponse,
)
def google_login(
    request: GoogleAuthRequest,
    db: Session = Depends(
        get_db
    ),
):

    # --------------------------------------------------------
    # CHECK SERVER CONFIGURATION
    # --------------------------------------------------------

    if not GOOGLE_CLIENT_ID:

        raise HTTPException(

            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),

            detail=(
                "Google authentication "
                "is not configured."
            ),
        )


    # --------------------------------------------------------
    # VERIFY GOOGLE ID TOKEN
    # --------------------------------------------------------

    try:

        google_user = (
            id_token.verify_oauth2_token(

                request.credential,

                google_requests.Request(),

                GOOGLE_CLIENT_ID,
            )
        )

    except ValueError:

        raise HTTPException(

            status_code=(
                status.HTTP_401_UNAUTHORIZED
            ),

            detail=(
                "Invalid Google "
                "authentication token."
            ),
        )


    # --------------------------------------------------------
    # EXTRACT GOOGLE USER DETAILS
    # --------------------------------------------------------

    google_sub = str(
        google_user.get(
            "sub",
            "",
        )
    ).strip()


    email = str(
        google_user.get(
            "email",
            "",
        )
    ).strip().lower()


    email_verified = bool(
        google_user.get(
            "email_verified",
            False,
        )
    )


    name = str(
        google_user.get(
            "name",
            "",
        )
    ).strip()


    hosted_domain = str(
        google_user.get(
            "hd",
            "",
        )
    ).strip()


    # --------------------------------------------------------
    # VALIDATE REQUIRED CLAIMS
    # --------------------------------------------------------

    if (
        not google_sub
        or not email
        or not email_verified
    ):

        raise HTTPException(

            status_code=(
                status.HTTP_401_UNAUTHORIZED
            ),

            detail=(
                "Google account could "
                "not be verified."
            ),
        )


    if not name:

        name = (
            email
            .split("@")[0]
        )


    name = name[:100]


    # --------------------------------------------------------
    # FIRST LOOK UP BY GOOGLE ACCOUNT ID
    # --------------------------------------------------------

    user = db.scalar(

        select(User).where(
            User.google_sub == google_sub
        )
    )


    # --------------------------------------------------------
    # EXISTING GOOGLE USER
    # --------------------------------------------------------

    if user is not None:

        access_token = (
            create_access_token(
                user.id
            )
        )

        return TokenResponse(

            access_token=(
                access_token
            ),

            token_type="bearer",
        )


    # --------------------------------------------------------
    # CHECK WHETHER EMAIL ALREADY EXISTS
    # --------------------------------------------------------

    existing_user = db.scalar(

        select(User).where(
            User.email == email
        )
    )


    if existing_user is not None:

        # Google is authoritative for Gmail accounts
        # and verified Google Workspace domains.

        google_authoritative = (

            email.endswith(
                "@gmail.com"
            )

            or (

                email_verified

                and bool(
                    hosted_domain
                )
            )
        )


        if not google_authoritative:

            raise HTTPException(

                status_code=(
                    status.HTTP_409_CONFLICT
                ),

                detail=(
                    "An account already exists "
                    "with this email. Sign in "
                    "with your password first."
                ),
            )


        existing_user.google_sub = (
            google_sub
        )


        try:

            db.commit()

        except IntegrityError:

            db.rollback()

            raise HTTPException(

                status_code=(
                    status.HTTP_409_CONFLICT
                ),

                detail=(
                    "This Google account is "
                    "already linked."
                ),
            )


        db.refresh(
            existing_user
        )


        access_token = (
            create_access_token(
                existing_user.id
            )
        )


        return TokenResponse(

            access_token=(
                access_token
            ),

            token_type="bearer",
        )


    # --------------------------------------------------------
    # CREATE NEW GOOGLE USER
    # --------------------------------------------------------

    user = User(

        name=name,

        email=email,

        password_hash=None,

        google_sub=(
            google_sub
        ),
    )


    db.add(
        user
    )


    try:

        db.commit()

    except IntegrityError:

        db.rollback()

        raise HTTPException(

            status_code=(
                status.HTTP_409_CONFLICT
            ),

            detail=(
                "Unable to create "
                "Google account."
            ),
        )


    db.refresh(
        user
    )


    # --------------------------------------------------------
    # ISSUE OUR NORMAL APPLICATION JWT
    # --------------------------------------------------------

    access_token = (
        create_access_token(
            user.id
        )
    )


    return TokenResponse(

        access_token=(
            access_token
        ),

        token_type="bearer",
    )


# ============================================================
# CURRENT LOGGED-IN USER
# ============================================================

@router.get(
    "/me",
    response_model=UserResponse,
)
def get_me(
    current_user: User = Depends(
        get_current_user
    ),
):

    return current_user