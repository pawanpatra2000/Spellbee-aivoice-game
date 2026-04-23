"""Daily.co room and token management."""

import time

import aiohttp

from app.config import settings


async def create_room_and_token() -> tuple[str, str]:
    """Create a temporary Daily room and generate a meeting token.

    Returns:
        Tuple of (room_url, token).
    """
    headers = {"Authorization": f"Bearer {settings.DAILY_API_KEY}"}

    async with aiohttp.ClientSession() as session:
        # Create room with 1-hour expiry
        room_payload = {
            "properties": {
                "exp": int(time.time()) + 3600,
                "enable_chat": False,
            }
        }
        async with session.post(
            f"{settings.DAILY_API_URL}/rooms",
            headers=headers,
            json=room_payload,
        ) as resp:
            resp.raise_for_status()
            room_data = await resp.json()

        room_url = room_data["url"]
        room_name = room_data["name"]

        # Create meeting token
        token_payload = {
            "properties": {
                "room_name": room_name,
                "is_owner": True,
            }
        }
        async with session.post(
            f"{settings.DAILY_API_URL}/meeting-tokens",
            headers=headers,
            json=token_payload,
        ) as resp:
            resp.raise_for_status()
            token_data = await resp.json()

    return room_url, token_data["token"]
