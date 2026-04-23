"""Pipecat voice pipeline for the Spell Bee bot."""

from loguru import logger

from pipecat.audio.vad.silero import SileroVADAnalyzer
from pipecat.frames.frames import EndFrame, LLMMessagesFrame
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.runner import PipelineRunner
from pipecat.pipeline.task import PipelineParams, PipelineTask
from pipecat.processors.aggregators.openai_llm_context import OpenAILLMContext
from pipecat.services.deepgram.stt import DeepgramSTTService
from pipecat.services.deepgram.tts import DeepgramTTSService
from pipecat.services.google.llm import GoogleLLMService
from pipecat.transports.services.daily import DailyParams, DailyTransport

from app.config import settings
from app.bot.processors import GameStateProcessor
from app.game.prompts import build_system_prompt


async def run_bot(room_url: str, token: str):
    """Create and run the full Pipecat pipeline for one session."""

    # ── Transport ──────────────────────────────────────────
    transport = DailyTransport(
        room_url,
        token,
        "Spell Bee Bot",
        DailyParams(
            audio_in_enabled=True,
            audio_out_enabled=True,
            transcription_enabled=False,
            vad_enabled=True,
            vad_analyzer=SileroVADAnalyzer(),
        ),
    )

    # ── Services ───────────────────────────────────────────
    stt = DeepgramSTTService(
        api_key=settings.DEEPGRAM_API_KEY,
        live_options={"model": settings.DEEPGRAM_STT_MODEL, "language": "en"},
    )

    tts = DeepgramTTSService(
        api_key=settings.DEEPGRAM_API_KEY,
        voice=settings.DEEPGRAM_TTS_VOICE,
    )

    llm = GoogleLLMService(
        model=settings.GOOGLE_MODEL,
        api_key=settings.GOOGLE_API_KEY,
    )

    # ── Context ────────────────────────────────────────────
    system_prompt = build_system_prompt()
    messages = [
        {"role": "system", "content": system_prompt},
        {
            "role": "user",
            "content": "Start the spell bee game. Introduce yourself and present the first word.",
        },
    ]
    context = OpenAILLMContext(messages)
    context_aggregator = llm.create_context_aggregator(context)

    # ── Custom Processor ───────────────────────────────────
    game_state = GameStateProcessor(name="GameStateProcessor")

    # ── Pipeline ───────────────────────────────────────────
    #
    # Audio Flow:
    #   User Mic → Daily → STT → Context(user) → LLM → GameState → TTS → Daily → Speaker
    #                                                                        ↓
    #                                                              Context(assistant)
    #
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
    @transport.event_handler("on_first_participant_joined")
    async def on_first_participant_joined(transport, participant):
        logger.info(f"Participant joined: {participant['id']}")
        await task.queue_frames([LLMMessagesFrame(messages)])

    @transport.event_handler("on_participant_left")
    async def on_participant_left(transport, participant, reason):
        logger.info(f"Participant left: {participant['id']}")
        await task.queue_frame(EndFrame())

    # ── Run ────────────────────────────────────────────────
    runner = PipelineRunner(handle_sigint=False)
    await runner.run(task)
