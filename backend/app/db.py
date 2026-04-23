"""SQLite database for persisting game data."""

import sqlite3
import os
from datetime import datetime
from typing import Optional

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "spellbee.db")


def _get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    """Create tables if they don't exist."""
    conn = _get_conn()
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS players (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE COLLATE NOCASE,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS games (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player_id INTEGER NOT NULL REFERENCES players(id),
            difficulty TEXT NOT NULL DEFAULT 'medium',
            score INTEGER NOT NULL DEFAULT 0,
            total_words INTEGER NOT NULL DEFAULT 10,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE INDEX IF NOT EXISTS idx_games_player ON games(player_id);
        CREATE INDEX IF NOT EXISTS idx_games_score ON games(score DESC);
        """
    )
    conn.commit()
    conn.close()


def get_or_create_player(name: str) -> int:
    """Return player id, creating if needed."""
    conn = _get_conn()
    row = conn.execute("SELECT id FROM players WHERE name = ?", (name.strip(),)).fetchone()
    if row:
        player_id = row["id"]
    else:
        cur = conn.execute("INSERT INTO players (name) VALUES (?)", (name.strip(),))
        conn.commit()
        player_id = cur.lastrowid
    conn.close()
    return player_id


def save_game(player_name: str, difficulty: str, score: int, total_words: int = 10) -> int:
    """Save a completed game and return the game id."""
    player_id = get_or_create_player(player_name)
    conn = _get_conn()
    cur = conn.execute(
        "INSERT INTO games (player_id, difficulty, score, total_words) VALUES (?, ?, ?, ?)",
        (player_id, difficulty, score, total_words),
    )
    conn.commit()
    game_id = cur.lastrowid
    conn.close()
    return game_id


def get_leaderboard(limit: int = 20) -> list[dict]:
    """Top scores across all players."""
    conn = _get_conn()
    rows = conn.execute(
        """
        SELECT p.name, g.score, g.total_words, g.difficulty, g.created_at
        FROM games g
        JOIN players p ON p.id = g.player_id
        ORDER BY g.score DESC, g.created_at ASC
        LIMIT ?
        """,
        (limit,),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_recent_games(limit: int = 20) -> list[dict]:
    """Most recent games."""
    conn = _get_conn()
    rows = conn.execute(
        """
        SELECT p.name, g.score, g.total_words, g.difficulty, g.created_at
        FROM games g
        JOIN players p ON p.id = g.player_id
        ORDER BY g.created_at DESC
        LIMIT ?
        """,
        (limit,),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_player_stats(name: str) -> Optional[dict]:
    """Stats for a single player."""
    conn = _get_conn()
    row = conn.execute(
        """
        SELECT
            p.name,
            COUNT(g.id) as games_played,
            COALESCE(MAX(g.score), 0) as best_score,
            COALESCE(ROUND(AVG(g.score), 1), 0) as avg_score
        FROM players p
        LEFT JOIN games g ON g.player_id = p.id
        WHERE p.name = ?
        GROUP BY p.id
        """,
        (name.strip(),),
    ).fetchone()
    conn.close()
    return dict(row) if row else None
