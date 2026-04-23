# Technology Stack Explained

A breakdown of every core technology used in this project, why we chose it, and how it all connects.

---

## 1. Pipecat (Core Framework)

**What it is:** An open-source Python framework for building real-time voice and multimodal AI agents.

**Why we use it:** Pipecat is the backbone of this project. Instead of manually wiring together audio capture, speech recognition, AI processing, and speech synthesis, Pipecat provides a pipeline architecture where data (audio, text, control signals) flows through a chain of processors automatically.

**How it works:**
- Everything in Pipecat is a **Frame** — a small packet of data (audio bytes, text, control signals)
- Frames flow through a **Pipeline** — a chain of **Frame Processors**
- Each processor does one job: convert audio to text, generate AI response, convert text to audio, etc.

**Our pipeline:**
```
User speaks → Audio frames flow in
    → Deepgram STT converts audio to text
    → Text goes into LLM context
    → Gemini generates a response
    → GameStateProcessor tracks game events
    → Deepgram TTS converts response to audio
    → Audio frames flow back to user
```

**Key concepts:**
- **Pipeline:** The chain of processors. Data flows top to bottom.
- **Frame Processor:** A single step in the pipeline. Receives frames, does something, pushes frames forward.
- **PipelineTask:** Wraps a pipeline with settings (like allowing interruptions).
- **PipelineRunner:** Executes the task and manages the lifecycle.

**Install:** `pip install pipecat-ai[daily,google,deepgram,silero]`

---

## 2. Daily (WebRTC Transport)

**What it is:** A cloud platform for real-time video/audio communication using WebRTC.

**Why we use it:** We need the user's microphone audio to reach our Python backend in real-time, and the bot's audio to reach the user's speakers. Daily handles all the complex WebRTC negotiation (STUN/TURN servers, NAT traversal, codec negotiation) so we don't have to.

**How it works in our project:**

1. **Backend creates a "room"** — a virtual meeting room on Daily's servers
2. **Backend bot joins the room** as a participant (server-side, via `DailyTransport`)
3. **Frontend user joins the same room** as a participant (browser-side, via `@pipecat-ai/daily-transport`)
4. **Audio flows both ways** — user's mic audio goes to bot, bot's generated audio goes to user

**The flow:**
```
Browser (React)                    Daily Cloud                     Backend (Python)
     |                                |                                |
     |--- User clicks "Start" -----→ |                                |
     |                                |                                |
     |    POST /api/connect --------→|----------→ Creates room -------→|
     |                                |           Creates token         |
     |    ←--- { room_url, token } ---|←--------- Bot joins room ------|
     |                                |                                |
     |--- Joins room with token ---→  |                                |
     |                                |                                |
     |===== WebRTC Audio Stream ======|======= WebRTC Audio Stream ====|
     |        (bidirectional)         |         (bidirectional)        |
```

**Why not just WebSockets?** WebRTC is purpose-built for real-time audio/video. It uses UDP (faster than TCP for audio), handles network adaptation (adjusting quality for bandwidth), and has built-in echo cancellation. WebSockets would add noticeable latency.

**API keys:** Get from https://dashboard.daily.co/developers (free tier available)

**Used in:**
- `backend/app/core/daily.py` — creates rooms and tokens via Daily REST API
- `backend/app/bot/pipeline.py` — `DailyTransport` for server-side audio I/O
- `frontend/src/App.tsx` — `DailyTransport` for client-side audio I/O

---

## 3. Deepgram (Speech-to-Text + Text-to-Speech)

**What it is:** An AI speech platform with two services we use:
- **STT (Speech-to-Text):** Converts spoken audio into text
- **TTS (Text-to-Speech):** Converts text into spoken audio

### STT — Deepgram Nova-2

**Why we use it:** When the user says "B-E-A-U-T-I-F-U-L", Deepgram converts that audio into the text "B E A U T I F U L". This text then goes to the LLM for evaluation.

**How it works:**
- Receives raw audio frames from the transport
- Streams audio to Deepgram's servers via WebSocket
- Returns transcription as `TranscriptionFrame` objects
- Supports **interim results** (partial text while user is still speaking) and **final results**

**Configuration in our project:**
```python
stt = DeepgramSTTService(
    api_key=settings.DEEPGRAM_API_KEY,
    live_options={"model": "nova-2", "language": "en"},
)
```

### TTS — Deepgram Aura

**Why we use it:** When the LLM generates "Great job! The word is spelled B. E. A. U. T. I. F. U. L.", Deepgram converts that text into natural-sounding audio that plays through the user's speakers.

**How it works:**
- Receives text frames from the LLM (streamed token by token)
- Sends text to Deepgram's TTS API
- Returns audio frames that flow to the transport

**Configuration:**
```python
tts = DeepgramTTSService(
    api_key=settings.DEEPGRAM_API_KEY,
    voice="aura-asteria-en",  # Female, clear, articulate voice
)
```

**API keys:** Get from https://console.deepgram.com ($200 free credit on signup)

**Used in:** `backend/app/bot/pipeline.py`

---

## 4. Google Gemini (LLM — The Brain)

**What it is:** Google's large language model. We use **Gemini 2.0 Flash** — fast and smart enough for real-time conversation.

**Why we use it:** Gemini is the "brain" of the spell bee bot. It:
- Picks words from the list and announces them
- Understands when the user is spelling (even if STT is imperfect)
- Evaluates if the spelling is correct
- Keeps track of score and game progress
- Responds naturally and encouragingly

**How it works in Pipecat:**
- Pipecat maintains a **conversation context** (list of messages)
- Each time the user speaks, their transcribed text is added to the context
- The full context is sent to Gemini, which generates a response
- The response streams token-by-token to the TTS
- The assistant's response is added back to the context

**The system prompt** (in `backend/app/game/prompts.py`) tells Gemini exactly how to behave:
- Act as a spell bee host
- Present words with definitions and example sentences
- Wait for spelling, evaluate it
- Track and announce score
- Keep responses short (it's voice, not text)

**Why Gemini over others?**
- Free tier (via Google AI Studio)
- Fast inference (important for real-time voice)
- Good at understanding letter-by-letter speech patterns
- Pipecat has built-in `GoogleLLMService` integration

**API keys:** Get from https://aistudio.google.com/apikey (free tier)

**Used in:** `backend/app/bot/pipeline.py`

---

## 5. Silero VAD (Voice Activity Detection)

**What it is:** A small AI model that detects when someone is speaking vs. silent.

**Why we use it:** VAD solves the "when did the user finish talking?" problem. Without it, the bot wouldn't know when to stop listening and start responding.

**How it works:**
- Runs locally on CPU (no API call needed)
- Analyzes every 30ms audio chunk (~1ms processing time)
- Detects: `UserStartedSpeaking` and `UserStoppedSpeaking` events
- When the user stops speaking, the pipeline knows to send the accumulated text to the LLM

**Turn-taking flow:**
```
User starts speaking  →  VAD detects speech start  →  STT begins transcribing
User stops speaking   →  VAD detects silence       →  Accumulated text → LLM
LLM responds          →  TTS plays audio           →  Bot is "speaking"
User interrupts       →  VAD detects new speech    →  Bot audio stops, new input begins
```

**Interruption handling:** If the user speaks while the bot is talking, VAD detects the new speech, Pipecat cancels the current TTS output, and processes the new input. This is all automatic.

**Used in:** `backend/app/bot/pipeline.py` (inside `DailyParams`)

---

## 6. FastAPI (Backend HTTP Server)

**What it is:** A modern Python web framework for building APIs.

**Why we use it:** We need an HTTP endpoint that the React frontend can call to start a game session. FastAPI handles:
- `POST /api/connect` — creates a Daily room, spawns the bot, returns room credentials
- `GET /api/health` — health check
- CORS middleware — allows the frontend (port 5173) to call the backend (port 7860)

**The key pattern — background tasks:**
```python
@router.post("/connect")
async def connect():
    room_url, token = await create_room_and_token()
    asyncio.create_task(run_bot(room_url, token))  # Bot runs in background
    return {"room_url": room_url, "token": token}  # Returns immediately
```

The bot runs as an `asyncio` background task. The HTTP response returns instantly with the room credentials so the frontend can join.

**Used in:** `backend/app/__init__.py` (app factory) and `backend/app/api/routes.py` (routes)

---

## 7. React + Vite (Frontend)

**What it is:** React is the UI library. Vite is the build tool (fast dev server with hot reload).

**Why Vite over Next.js/CRA?** The assignment says "minimal web UI". Vite is the simplest, fastest way to scaffold a React app with TypeScript.

**Pipecat Client SDK:** The frontend uses three Pipecat packages:
- `@pipecat-ai/client-js` — Core client that manages the connection
- `@pipecat-ai/client-react` — React hooks and providers
- `@pipecat-ai/daily-transport` — Daily WebRTC transport for the browser

**Connection flow in React:**
```tsx
// 1. Create client with Daily transport
const client = new RTVIClient({
    transport: new DailyTransport(),
    params: { baseUrl: "/api", endpoints: { connect: "/connect" } },
    enableMic: true,
});

// 2. Wrap app in provider
<RTVIClientProvider client={client}>
    <RTVIClientAudio />  {/* Hidden <audio> element for bot's voice */}
    <SpellBeeGame />
</RTVIClientProvider>

// 3. Connect on button click
await client.connect();
// This POSTs to /api/connect, gets room credentials, joins the Daily room
```

**React hooks used:**
- `useRTVIClient()` — access the client instance
- `useRTVIClientEvent()` — listen for events (transport state, bot speaking, transcripts)

---

## 8. Custom Frame Processor — GameStateProcessor

**What it is:** A custom Pipecat `FrameProcessor` we built to satisfy the assignment requirement.

**What it does:** Sits between the LLM and TTS in the pipeline. Watches the LLM's text output and tracks:
- Current word number
- Player's score
- Whether the game has ended

**How it works:**
```python
class GameStateProcessor(FrameProcessor):
    async def process_frame(self, frame, direction):
        await super().process_frame(frame, direction)

        if isinstance(frame, TextFrame):
            # Buffer text and parse for game events
            self._buffer += frame.text
            self._parse_game_events()

        # ALWAYS push frames through — never consume them
        await self.push_frame(frame, direction)
```

**Key rule:** Frame processors must ALWAYS push frames downstream. They observe and optionally transform data, but never block the flow.

**Used in:** `backend/app/bot/processors.py`

---

## How Everything Connects — End to End

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER'S BROWSER                              │
│                                                                     │
│  React App (Vite, port 5173)                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │ Start Game   │→ │ POST         │→ │ Join Daily Room          │  │
│  │ Button       │  │ /api/connect │  │ (WebRTC audio streaming) │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘  │
│                                          ↕ Audio (WebRTC)          │
└──────────────────────────────────────────┼──────────────────────────┘
                                           │
                                     Daily Cloud
                                     (WebRTC relay)
                                           │
┌──────────────────────────────────────────┼──────────────────────────┐
│                     PYTHON BACKEND (FastAPI, port 7860)             │
│                                          ↕ Audio (WebRTC)          │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    PIPECAT PIPELINE                          │   │
│  │                                                             │   │
│  │  DailyTransport.input()  ← User's microphone audio         │   │
│  │         ↓                                                   │   │
│  │  SileroVAD              ← Detects speech start/stop         │   │
│  │         ↓                                                   │   │
│  │  DeepgramSTT            ← Converts speech → text            │   │
│  │         ↓                                                   │   │
│  │  ContextAggregator(user) ← Adds user text to conversation   │   │
│  │         ↓                                                   │   │
│  │  GoogleLLM (Gemini)     ← Generates spell bee host response │   │
│  │         ↓                                                   │   │
│  │  GameStateProcessor     ← Tracks score, word count (custom) │   │
│  │         ↓                                                   │   │
│  │  DeepgramTTS            ← Converts text → speech audio      │   │
│  │         ↓                                                   │   │
│  │  DailyTransport.output() → Bot's audio back to user         │   │
│  │         ↓                                                   │   │
│  │  ContextAggregator(assistant) ← Saves bot's response        │   │
│  └─────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────-┘
```

---

## API Keys Summary

| Service | What For | Free Tier | Get Key |
|---------|----------|-----------|---------|
| Daily | WebRTC rooms for real-time audio | Yes | https://dashboard.daily.co/developers |
| Deepgram | Speech-to-Text (Nova-2) + Text-to-Speech (Aura) | $200 free credit | https://console.deepgram.com |
| Google AI Studio | Gemini 2.0 Flash LLM | Yes (generous) | https://aistudio.google.com/apikey |

All three keys go in `backend/.env`:
```
DAILY_API_KEY=your_daily_key
DEEPGRAM_API_KEY=your_deepgram_key
GOOGLE_API_KEY=your_google_key
```
