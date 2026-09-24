# ============================================================
# SONG HISTORY API
# ============================================================

from pathlib import Path

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)

from fastapi.responses import (
    FileResponse,
)

from sqlalchemy import (
    select,
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

from app.schemas.song import (
    SongResponse,
)


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/api/songs",
    tags=["Songs"],
)


# ============================================================
# HELPER
# ============================================================

def song_to_response(
    song: Song,
) -> SongResponse:

    return SongResponse(

        id=song.id,

        theme=song.theme,

        mood=song.mood,

        instruments=song.instruments,

        duration=song.duration,

        vocal_style=song.vocal_style,

        lyrics=song.lyrics,

        status=song.status,

        created_at=song.created_at,

        audio_url=(
            f"/api/songs/"
            f"{song.id}/audio"
        ),
    )


# ============================================================
# MY SONGS
# ============================================================

@router.get(
    "",
    response_model=list[SongResponse],
)
def get_my_songs(

    current_user: User = Depends(
        get_current_user
    ),

    db: Session = Depends(
        get_db
    ),
):

    songs = db.scalars(

        select(Song)

        .where(
            Song.user_id
            == current_user.id
        )

        .order_by(
            Song.created_at.desc()
        )

    ).all()


    return [
        song_to_response(song)
        for song in songs
    ]


# ============================================================
# GET SONG AUDIO
# ============================================================

@router.get(
    "/{song_id}/audio"
)
def get_song_audio(

    song_id: int,

    current_user: User = Depends(
        get_current_user
    ),

    db: Session = Depends(
        get_db
    ),
):

    song = db.scalar(

        select(Song).where(

            Song.id == song_id,

            Song.user_id
            == current_user.id,
        )
    )


    if song is None:

        raise HTTPException(
            status_code=404,
            detail="Song not found.",
        )


    audio_file = Path(
        song.audio_path
    )


    if not audio_file.exists():

        raise HTTPException(
            status_code=404,
            detail=(
                "Song audio file "
                "was not found."
            ),
        )


    return FileResponse(

        path=audio_file,

        media_type="audio/wav",

        filename=(
            f"nepali-folk-"
            f"{song.id}.wav"
        ),
    )


# ============================================================
# DELETE SONG
# ============================================================

@router.delete(
    "/{song_id}",
    status_code=(
        status.HTTP_204_NO_CONTENT
    ),
)
def delete_song(

    song_id: int,

    current_user: User = Depends(
        get_current_user
    ),

    db: Session = Depends(
        get_db
    ),
):

    song = db.scalar(

        select(Song).where(

            Song.id == song_id,

            Song.user_id
            == current_user.id,
        )
    )


    if song is None:

        raise HTTPException(
            status_code=404,
            detail="Song not found.",
        )


    audio_file = Path(
        song.audio_path
    )


    if audio_file.exists():

        audio_file.unlink()


    db.delete(
        song
    )

    db.commit()