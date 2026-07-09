# Spell Bee — AI Voice Game

A real-time, voice-powered spelling bee game where an AI host speaks words, listens to your spelling, and judges your answers — all through the browser with no push-to-talk, no typing.

Live: **https://spellbee.pawanpatra.com**

---

## What It Does

- An AI host (powered by Gemini) announces a word with its definition
- You spell it out loud, letter by letter
- Deepgram transcribes your speech in real time
- The AI evaluates your spelling instantly and gives feedback
- 10 rounds per game with Easy / Medium / Hard difficulty
- Scores are saved to a leaderboard after every game

---

## Architecture

```
Browser (React + WebRTC)
        │
        │  WebRTC (SmallWebRTC — no third-party infra)
        ▼
FastAPI Backend (Uvicorn)
        │
        └── Pipecat Voice Pipeline
              ├── Deepgram STT   →  speech to text (Nova-2)
              ├── Gemini LLM     →  game host + word judge (Gemini Flash)
              └── Deepgram TTS   →  text to speech (Aura voice)
```

Key design choice: uses **Pipecat's SmallWebRTC** transport — no Daily.co or other paid WebRTC infrastructure. The server handles peer connections directly.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Voice Pipeline | Pipecat 1.5 |
| WebRTC Transport | SmallWebRTC (self-hosted, no third-party) |
| Speech-to-Text | Deepgram Nova-2 |
| Text-to-Speech | Deepgram Aura (aura-asteria-en) |
| LLM / Game Host | Google Gemini Flash |
| Backend | FastAPI + Uvicorn (Python 3.12) |
| Frontend | React 19 + TypeScript + Vite 6 |
| Styling | Tailwind CSS v4 |
| Voice UI | Pipecat Voice UI Kit (WebGL plasma visualizer) |
| Database | SQLite (scores + leaderboard) |
| Infra | GCP VM + Nginx + systemd + Let's Encrypt SSL |

---

## Project Structure

```
backend/
  main.py                 Entry point
  app/
    __init__.py           FastAPI app factory
    config.py             Settings from environment
    api/
      routes.py           POST /api/session, POST /api/offer, GET /api/leaderboard
    bot/
      pipeline.py         Pipecat pipeline (STT → LLM → TTS)
      processors.py       GameStateProcessor — tracks score, saves to DB
    game/
      prompts.py          Gemini system prompt (difficulty-aware game host)
    db.py                 SQLite — save game, leaderboard queries

frontend/
  src/
    App.tsx               Pipecat client + WebRTC setup
    components/
      Lobby.tsx           Game start, difficulty picker, recent games
      SpellBeeGame.tsx    Live game UI, voice visualizer, transcript
      Leaderboard.tsx     Top scores table
```

---

## How It Works (Technical Flow)

1. User fills in name + difficulty → `POST /api/session` returns a `session_id`
2. Pipecat client sends a WebRTC SDP offer to `POST /api/offer?session_id=...`
3. Backend creates a `SmallWebRTCConnection`, performs ICE negotiation, spawns the Pipecat pipeline in a background task
4. Pipeline runs: audio in → Deepgram STT → Gemini LLM → Deepgram TTS → audio out
5. A custom `GameStateProcessor` frame processor intercepts bot transcripts to detect game events (correct/wrong/game-over) and writes results to SQLite
6. On disconnect, score is saved and shown on the leaderboard

---

## Running Locally

**Requirements:** Python 3.12+, Node.js 22+, API keys for Deepgram and Google AI Studio

```bash
# Backend
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt

# Create backend/.env
cp ../.env.example .env
# Fill in: DEEPGRAM_API_KEY, GOOGLE_API_KEY

python main.py
# Backend runs on http://localhost:8000
```

```bash
# Frontend
cd frontend
npm install
npm run dev
# Frontend runs on http://localhost:5173
```

Open http://localhost:5173, allow microphone access, and start spelling.

---

## Deployment

Deployed on a GCP VM (Ubuntu) with:
- **systemd** services for both backend and frontend
- **Nginx** as reverse proxy routing `/api/*` to backend (8000) and `/` to frontend (5173)
- **Let's Encrypt** SSL via Certbot
- **STUN servers** (Google) for WebRTC NAT traversal

See `deployment/` for service files, Nginx config, and deploy script.

---

## Skills Demonstrated

- Real-time voice AI pipeline with Pipecat (STT → LLM → TTS)
- WebRTC peer connection handling without third-party infrastructure
- Custom Pipecat frame processor for game state management
- FastAPI async backend with background tasks
- React + TypeScript with real-time audio/transcript events
- WebGL audio visualizer via Pipecat Voice UI Kit
- Full production deployment: GCP VM, Nginx, systemd, SSL

---

Built by **Pawan Patra**
