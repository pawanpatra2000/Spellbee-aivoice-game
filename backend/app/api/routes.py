"""API routes for the Spell Bee bot."""

from fastapi import APIRouter, BackgroundTasks, Query
from loguru import logger

from pipecat.transports.smallwebrtc.connection import SmallWebRTCConnection
from pipecat.transports.smallwebrtc.request_handler import (
    SmallWebRTCPatchRequest,
    SmallWebRTCRequest,
    SmallWebRTCRequestHandler,
)

from app.bot.pipeline import run_bot
from app.db import get_leaderboard, get_recent_games, get_player_stats

router = APIRouter()

webrtc_handler = SmallWebRTCRequestHandler()


# Store player info per connection (keyed by SDP offer hash)
_pending_sessions: dict[str, dict] = {}


@router.post("/session")
async def create_session(body: dict):
    """Register player name + difficulty before WebRTC offer."""
    name = body.get("name", "Player").strip() or "Player"
    difficulty = body.get("difficulty", "medium")
    if difficulty not in ("easy", "medium", "hard"):
        difficulty = "medium"

    import uuid
    session_id = str(uuid.uuid4())
    _pending_sessions[session_id] = {"name": name, "difficulty": difficulty}
    logger.info(f"Session created: {session_id} — {name} ({difficulty})")
    return {"session_id": session_id}


@router.post("/offer")
async def offer(request: SmallWebRTCRequest, background_tasks: BackgroundTasks, session_id: str = Query(default="")):
    """Handle WebRTC offer and spawn the Spell Bee bot."""

    session = _pending_sessions.pop(session_id, {})
    player_name = session.get("name", "Player")
    difficulty = session.get("difficulty", "medium")

    async def on_connection(connection: SmallWebRTCConnection):
        background_tasks.add_task(run_bot, connection, player_name, difficulty)

    answer = await webrtc_handler.handle_web_request(
        request=request,
        webrtc_connection_callback=on_connection,
    )
    logger.info(f"WebRTC connection established: {player_name} ({difficulty})")
    return answer


@router.patch("/offer")
async def ice_candidate(request: SmallWebRTCPatchRequest):
    """Handle trickle ICE candidates from the browser."""
    await webrtc_handler.handle_patch_request(request)
    return {"status": "ok"}


@router.get("/leaderboard")
async def leaderboard(limit: int = Query(default=20, le=100)):
    """Top scores."""
    return get_leaderboard(limit)


@router.get("/games/recent")
async def recent_games(limit: int = Query(default=20, le=100)):
    """Most recent games."""
    return get_recent_games(limit)


@router.get("/player/{name}")
async def player_stats(name: str):
    """Stats for a specific player."""
    stats = get_player_stats(name)
    if not stats:
        return {"name": name, "games_played": 0, "best_score": 0, "avg_score": 0}
    return stats


@router.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "ok"}
