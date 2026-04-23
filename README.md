# Spell Bee Voice Bot

A voice-based spelling bee game built with [Pipecat](https://github.com/pipecat-ai/pipecat). The bot speaks a word, the user spells it out loud, and the bot evaluates the response.

## Architecture

```
React Frontend  <--WebRTC (Daily)--> Pipecat Pipeline (FastAPI Backend)
                                          |
                                    Deepgram STT (Speech-to-Text)
                                          |
                                    Gemini LLM (Game Host)
                                          |
                                    Deepgram TTS (Text-to-Speech)
```

**Backend** (`backend/`): FastAPI server that creates Daily rooms and runs the Pipecat voice pipeline. The pipeline uses Deepgram for speech recognition and synthesis, Gemini as the AI game host, and a custom `GameStateProcessor` frame processor to track game events.

**Frontend** (`frontend/`): React app (Vite) that connects to the bot via Daily's WebRTC transport. Shows a real-time transcript and game status.

## Prerequisites

- Python 3.10+
- Node.js 18+
- API keys for:
  - [Daily](https://dashboard.daily.co/developers) (WebRTC transport)
  - [Deepgram](https://console.deepgram.com) (STT + TTS)
  - [Google AI Studio](https://aistudio.google.com/apikey) (Gemini LLM)

## Setup

1. **Clone the repo and set up environment variables:**

```bash
cp .env.example backend/.env
# Edit backend/.env and add your API keys
```

2. **Run the app:**

```bash
chmod +x start.sh
./start.sh
```

3. **Open the app:** Visit [http://localhost:5173](http://localhost:5173)

4. **Play:** Click "Start Game", allow microphone access, and start spelling!

## How It Works

1. User clicks "Start Game" in the React frontend
2. Frontend calls `POST /api/connect` on the FastAPI backend
3. Backend creates a Daily room + token, spawns the Pipecat bot
4. Frontend joins the Daily room via WebRTC
5. Bot introduces itself and presents the first word
6. User spells the word aloud, bot evaluates and tracks score
7. Game continues for 10 rounds or until user says "quit"

## Project Structure

```
backend/
  main.py                  - Entry point (uvicorn runner)
  requirements.txt
  app/
    __init__.py            - FastAPI app factory
    config.py              - Centralized settings from .env
    api/
      routes.py            - POST /api/connect, GET /api/health
    bot/
      pipeline.py          - Pipecat pipeline assembly
      processors.py        - Custom GameStateProcessor frame processor
    core/
      daily.py             - Daily room & token creation
    game/
      words.py             - Word list (easy/medium/hard)
      prompts.py           - Gemini system prompt for spell bee host

frontend/
  src/
    App.tsx                - Pipecat client setup
    components/
      SpellBeeGame.tsx     - Main game UI
      GameStatus.tsx       - Connection status indicator
      Transcript.tsx       - Conversation message display
```

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Voice Pipeline | Pipecat |
| Transport | Daily (WebRTC) |
| STT | Deepgram Nova-2 |
| TTS | Deepgram Aura |
| LLM | Google Gemini 2.0 Flash |
| Backend | FastAPI + Uvicorn |
| Frontend | React + Vite + TypeScript |
