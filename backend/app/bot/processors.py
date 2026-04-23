"""Custom Pipecat frame processors for the Spell Bee game."""

import re

from loguru import logger

from pipecat.frames.frames import Frame, TextFrame
from pipecat.processors.frame_processor import FrameDirection, FrameProcessor

from app.db import save_game

# Map spoken number words to ints
WORD_TO_NUM = {
    "zero": 0, "one": 1, "two": 2, "three": 3, "four": 4,
    "five": 5, "six": 6, "seven": 7, "eight": 8, "nine": 9,
    "ten": 10,
}
NUM_WORDS_PATTERN = "|".join(WORD_TO_NUM.keys())


def _parse_number(s: str) -> int | None:
    """Parse a digit string or word-form number."""
    s = s.strip().lower()
    if s.isdigit():
        return int(s)
    return WORD_TO_NUM.get(s)


class GameStateProcessor(FrameProcessor):
    """Monitors LLM output to track game state and save results.

    Instead of relying on the LLM to say exact score numbers,
    this counts "correct" and "incorrect" responses directly,
    which is far more reliable with voice-oriented LLMs that
    speak numbers as words.
    """

    def __init__(self, player_name: str = "Player", difficulty: str = "medium", **kwargs):
        super().__init__(**kwargs)
        self.player_name = player_name
        self.difficulty = difficulty
        self.word_count = 0
        self.score = 0
        self.game_active = True
        self._buffer = ""
        self._saved = False
        self._correct_counted = 0
        self._incorrect_counted = 0

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
        buf_lower = self._buffer.lower()

        # Count correct answers: "that is correct" / "that's correct"
        correct_count = len(re.findall(r"that(?:'s| is) correct", buf_lower))
        if correct_count > self._correct_counted:
            self._correct_counted = correct_count
            self.score = correct_count
            logger.info(f"[GameState] Score: {self.score}")

        # Count incorrect answers: "not quite" / "incorrect" / "that is incorrect"
        incorrect_count = len(re.findall(r"(?:not quite|that(?:'s| is) incorrect)", buf_lower))
        if incorrect_count > self._incorrect_counted:
            self._incorrect_counted = incorrect_count
            logger.info(f"[GameState] Incorrect: {incorrect_count}")

        # Word number from "word number X" — try digits first, then word-form
        word_match = re.search(
            rf"word\s+(?:number\s+)?(\d+|{NUM_WORDS_PATTERN})",
            buf_lower,
        )
        if word_match:
            num = _parse_number(word_match.group(1))
            if num is not None and num > self.word_count:
                self.word_count = num
                logger.info(f"[GameState] Word #{self.word_count}")

        # Total words answered = correct + incorrect
        total_answered = self._correct_counted + self._incorrect_counted
        if total_answered > self.word_count:
            self.word_count = total_answered

        # Game end detection
        if re.search(
            r"(final score|game over|thanks for playing|goodbye)",
            buf_lower,
        ):
            if self.game_active:
                self.game_active = False
                logger.info(
                    f"[GameState] Game ended — Final score: {self.score}/{self.word_count}"
                )
                self._save_game()

    def _save_game(self):
        """Persist the game result to the database."""
        if self._saved:
            return
        self._saved = True
        total = max(self.word_count, 10)
        try:
            game_id = save_game(self.player_name, self.difficulty, self.score, total)
            logger.info(
                f"[GameState] Saved game #{game_id}: {self.player_name} scored {self.score}/{total} ({self.difficulty})"
            )
        except Exception as e:
            logger.error(f"[GameState] Failed to save game: {e}")
