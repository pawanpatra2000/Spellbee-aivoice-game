"""API routes for the Spell Bee bot."""

import asyncio

from fastapi import APIRouter, HTTPException
from loguru import logger

from app.core.daily import create_room_and_token
from app.bot.pipeline import run_bot

router = APIRouter()


@router.post("/connect")
async def connect():
    """Create a Daily room and spawn the Spell Bee bot.

    The bot runs as a background task so the HTTP response
    returns immediately with room credentials for the client.
    """
    try:
        room_url, token = await create_room_and_token()
    except Exception as e:
        logger.error(f"Failed to create Daily room: {e}")
        raise HTTPException(status_code=500, detail="Failed to create voice session")

    # Spawn bot in background — don't block the HTTP response
    asyncio.create_task(run_bot(room_url, token))
    logger.info(f"Bot spawned for room: {room_url}")

    return {"room_url": room_url, "token": token}


@router.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "ok"}
