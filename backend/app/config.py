"""Centralized configuration loaded from environment variables."""

import os

from dotenv import load_dotenv

load_dotenv()


class Settings:
    """Application settings from .env file."""

    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "7860"))

    DEEPGRAM_API_KEY: str = os.getenv("DEEPGRAM_API_KEY", "")

    GOOGLE_API_KEY: str = os.getenv("GOOGLE_API_KEY", "")
    GOOGLE_MODEL: str = os.getenv("GOOGLE_MODEL", "gemini-2.0-flash")

    DEEPGRAM_TTS_VOICE: str = os.getenv("DEEPGRAM_TTS_VOICE", "aura-asteria-en")
    DEEPGRAM_STT_MODEL: str = os.getenv("DEEPGRAM_STT_MODEL", "nova-2")


settings = Settings()
