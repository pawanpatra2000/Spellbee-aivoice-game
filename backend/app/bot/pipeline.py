"""Pipecat voice pipeline for the Spell Bee bot."""

from loguru import logger

from pipecat.frames.frames import EndFrame, LLMContextFrame
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.runner import PipelineRunner
from pipecat.pipeline.task import PipelineParams, PipelineTask
from pipecat.processors.aggregators.llm_context import LLMContext
from pipecat.processors.aggregators.llm_response_universal import LLMContextAggregatorPair
from pipecat.services.deepgram.stt import DeepgramSTTService
from pipecat.services.deepgram.tts import DeepgramTTSService
from pipecat.services.google.llm import GoogleLLMService
from pipecat.transports.base_transport import TransportParams
from pipecat.transports.smallwebrtc.transport import SmallWebRTCTransport
from pipecat.transports.smallwebrtc.connection import SmallWebRTCConnection

from app.config import settings
from app.bot.processors import GameStateProcessor
from app.game.prompts import build_system_prompt


async def run_bot(connection: SmallWebRTCConnection, player_name: str = "Player", difficulty: str = "medium"):
    """Create and run the full Pipecat pipeline for one session."""

    # ── Transport ──────────────────────────────────────────
    transport = SmallWebRTCTransport(
        webrtc_connection=connection,
        params=TransportParams(
            audio_in_enabled=True,
            audio_out_enabled=True,
        ),
    )

    # ── Services ───────────────────────────────────────────
    stt = DeepgramSTTService(
        api_key=settings.DEEPGRAM_API_KEY,
        model=settings.DEEPGRAM_STT_MODEL,
    )

    tts = DeepgramTTSService(
        api_key=settings.DEEPGRAM_API_KEY,
        voice=settings.DEEPGRAM_TTS_VOICE,
    )

    llm = GoogleLLMService(
        model=settings.GOOGLE_MODEL,
        api_key=settings.GOOGLE_API_KEY,
        system_instruction=build_system_prompt(player_name, difficulty),
    )

    # ── Context ────────────────────────────────────────────
    context = LLMContext(
        messages=[
            {
                "role": "user",
                "content": "Start the spell bee game. Introduce yourself and present the first word.",
            }
        ]
    )
    context_aggregator = LLMContextAggregatorPair(context)

    # ── Custom Processor ───────────────────────────────────
    game_state = GameStateProcessor(
        player_name=player_name,
        difficulty=difficulty,
        name="GameStateProcessor",
    )

    # ── Pipeline ───────────────────────────────────────────
    pipeline = Pipeline(
        [
            transport.input(),
            stt,
            context_aggregator.user(),
            llm,
            game_state,
            tts,
            transport.output(),
            context_aggregator.assistant(),
        ]
    )

    task = PipelineTask(
        pipeline,
        params=PipelineParams(
            allow_interruptions=True,
            enable_metrics=True,
            enable_usage_metrics=True,
        ),
    )

    # ── Event Handlers ─────────────────────────────────────
    @transport.event_handler("on_client_connected")
    async def on_client_connected(transport, client):
        logger.info(f"Client connected: {player_name} ({difficulty})")
        await task.queue_frames([LLMContextFrame(context)])

    @transport.event_handler("on_client_disconnected")
    async def on_client_disconnected(transport, client):
        logger.info("Client disconnected")
        # Save game if it wasn't saved via natural game end
        if game_state.game_active and not game_state._saved:
            game_state._save_game()
        await task.queue_frame(EndFrame())

    # ── Run ────────────────────────────────────────────────
    runner = PipelineRunner(handle_sigint=False)
    await runner.run(task)
