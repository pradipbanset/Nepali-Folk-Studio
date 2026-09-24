# ============================================================
# AUTH API ROUTES
# ============================================================

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
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
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)


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

    # --------------------------------------------------------
    # NORMALISE INPUT
    # --------------------------------------------------------

    email = (
        str(request.email)
        .strip()
        .lower()
    )

    name = (
        request.name
        .strip()
    )


    # --------------------------------------------------------
    # CHECK EXISTING EMAIL
    # --------------------------------------------------------

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


    # --------------------------------------------------------
    # HASH PASSWORD
    # --------------------------------------------------------

    hashed_password = (
        hash_password(
            request.password
        )
    )


    # --------------------------------------------------------
    # CREATE USER
    # --------------------------------------------------------

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


    # --------------------------------------------------------
    # RETURN SAFE USER DATA
    # --------------------------------------------------------

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

    # --------------------------------------------------------
    # NORMALISE EMAIL
    # --------------------------------------------------------

    email = (
        str(request.email)
        .strip()
        .lower()
    )


    # --------------------------------------------------------
    # FIND USER
    # --------------------------------------------------------

    user = db.scalar(

        select(User).where(
            User.email == email
        )
    )


    # --------------------------------------------------------
    # INVALID EMAIL
    # --------------------------------------------------------

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


    # --------------------------------------------------------
    # VERIFY PASSWORD
    # --------------------------------------------------------

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


    # --------------------------------------------------------
    # CREATE JWT ACCESS TOKEN
    # --------------------------------------------------------

    access_token = (
        create_access_token(
            user.id
        )
    )


    # --------------------------------------------------------
    # RETURN TOKEN
    # --------------------------------------------------------

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