"""API routes for the Spell Bee bot."""

from fastapi import APIRouter, BackgroundTasks
from loguru import logger

from pipecat.transports.smallwebrtc.connection import SmallWebRTCConnection
from pipecat.transports.smallwebrtc.request_handler import (
    SmallWebRTCPatchRequest,
    SmallWebRTCRequest,
    SmallWebRTCRequestHandler,
)

from app.bot.pipeline import run_bot

router = APIRouter()

webrtc_handler = SmallWebRTCRequestHandler()


@router.post("/offer")
async def offer(request: SmallWebRTCRequest, background_tasks: BackgroundTasks):
    """Handle WebRTC offer and spawn the Spell Bee bot."""

    async def on_connection(connection: SmallWebRTCConnection):
        background_tasks.add_task(run_bot, connection)

    answer = await webrtc_handler.handle_web_request(
        request=request,
        webrtc_connection_callback=on_connection,
    )
    logger.info("WebRTC connection established, bot spawned")
    return answer


@router.patch("/offer")
async def ice_candidate(request: SmallWebRTCPatchRequest):
    """Handle trickle ICE candidates from the browser."""
    await webrtc_handler.handle_patch_request(request)
    return {"status": "ok"}


@router.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "ok"}
