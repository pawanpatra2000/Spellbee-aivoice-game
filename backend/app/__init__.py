from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

from app.api.routes import router
from app.db import init_db


def _warmup():
    """Pre-import heavy modules so first game starts instantly."""
    logger.info("Warming up — pre-loading modules...")

    # Heavy Pipecat imports (aiortc, pipeline classes)
    import pipecat.transports.smallwebrtc.transport  # noqa: F401
    import pipecat.transports.smallwebrtc.connection  # noqa: F401
    import pipecat.services.deepgram.stt  # noqa: F401
    import pipecat.services.deepgram.tts  # noqa: F401
    import pipecat.services.google.llm  # noqa: F401
    import pipecat.pipeline.pipeline  # noqa: F401
    import pipecat.pipeline.runner  # noqa: F401
    import pipecat.processors.aggregators.llm_context  # noqa: F401
    import pipecat.processors.aggregators.llm_response_universal  # noqa: F401

    # Our own modules
    import app.bot.pipeline  # noqa: F401
    import app.bot.processors  # noqa: F401
    import app.game.prompts  # noqa: F401

    logger.info("Warmup complete — ready for connections")


def create_app() -> FastAPI:
    """Application factory."""
    app = FastAPI(title="Spell Bee Voice Bot")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    init_db()
    _warmup()

    app.include_router(router, prefix="/api")

    return app
