"""Custom Pipecat frame processors for the Spell Bee game."""

import re

from loguru import logger

from pipecat.frames.frames import Frame, TextFrame
from pipecat.processors.frame_processor import FrameDirection, FrameProcessor


class GameStateProcessor(FrameProcessor):
    """Monitors LLM output to track game state.

    Sits between the LLM and TTS in the pipeline. Intercepts
    TextFrames to parse game events (score changes, word progression,
    game end) and logs them. Passes all frames through unchanged.

    This demonstrates a custom frame processor as required by the
    assignment, showing how to observe and react to pipeline data
    without disrupting the flow.
    """

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.word_count = 0
        self.score = 0
        self.game_active = True
        self._buffer = ""

    async def process_frame(self, frame: Frame, direction: FrameDirection):
        await super().process_frame(frame, direction)

        if isinstance(frame, TextFrame):
            self._buffer += frame.text
            self._parse_game_events()

            # Prevent unbounded buffer growth
            if len(self._buffer) > 2000:
                self._buffer = self._buffer[-500:]

        # Always push frames through — never consume them
        await self.push_frame(frame, direction)

    def _parse_game_events(self):
        """Extract game state from accumulated LLM text."""
        # Score: "score is now 3" or "score is 3 out of 5"
        score_match = re.search(
            r"score\s+(?:is\s+(?:now\s+)?)?(\d+)", self._buffer, re.IGNORECASE
        )
        if score_match:
            new_score = int(score_match.group(1))
            if new_score != self.score:
                self.score = new_score
                logger.info(f"[GameState] Score: {self.score}")

        # Word number: "word number 3" or "word 3"
        word_match = re.search(
            r"word\s+(?:number\s+)?(\d+)", self._buffer, re.IGNORECASE
        )
        if word_match:
            new_count = int(word_match.group(1))
            if new_count != self.word_count:
                self.word_count = new_count
                logger.info(f"[GameState] Word #{self.word_count}")

        # Game end detection
        if re.search(
            r"(final score|game over|thanks for playing|goodbye)",
            self._buffer,
            re.IGNORECASE,
        ):
            if self.game_active:
                self.game_active = False
                logger.info(
                    f"[GameState] Game ended — Final score: {self.score}/{self.word_count}"
                )
