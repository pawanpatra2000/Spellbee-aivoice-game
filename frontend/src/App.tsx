import { useState, useMemo } from "react";
import { PipecatClient as PipecatClientBase } from "@pipecat-ai/client-js";
import { SmallWebRTCTransport } from "@pipecat-ai/small-webrtc-transport";
import {
  PipecatClientProvider,
  PipecatClientAudio,
} from "@pipecat-ai/client-react";
import Lobby from "./components/Lobby";
import SpellBeeGame from "./components/SpellBeeGame";
import Leaderboard from "./components/Leaderboard";

function createClient() {
  return new PipecatClientBase({
    transport: new SmallWebRTCTransport({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    }),
    enableMic: true,
    enableCam: false,
  }) as any;
}

type View = "lobby" | "game" | "leaderboard";

function App() {
  const [view, setView] = useState<View>("lobby");
  const [playerName, setPlayerName] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [sessionId, setSessionId] = useState("");
  // new client instance created for every game session
  const [clientKey, setClientKey] = useState(0);
  const client = useMemo(() => createClient(), [clientKey]);

  const handleStart = async (name: string, diff: string) => {
    setPlayerName(name);
    setDifficulty(diff);

    // Register session on backend
    const res = await fetch("/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, difficulty: diff }),
    });
    const data = await res.json();
    setSessionId(data.session_id);
    setView("game");
  };

  const handleGameEnd = () => {
    // bump key so next game gets a fresh client with clean WebRTC state
    setClientKey((k) => k + 1);
    setView("lobby");
  };

  return (
    <PipecatClientProvider key={clientKey} client={client}>
      <PipecatClientAudio />

      <div className="min-h-screen flex flex-col">
        {/* ── Header ── */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
            <button
              onClick={() => {
                if (view !== "game") setView("lobby");
              }}
              className="flex items-center gap-2 hover:opacity-80 transition"
            >
              <span className="text-2xl">🐝</span>
              <span className="text-lg font-bold text-slate-800">Spell Bee</span>
            </button>

            <nav className="flex items-center gap-1">
              <NavButton
                active={view === "lobby"}
                onClick={() => { if (view !== "game") setView("lobby"); }}
              >
                Home
              </NavButton>
              <NavButton
                active={view === "leaderboard"}
                onClick={() => { if (view !== "game") setView("leaderboard"); }}
              >
                Leaderboard
              </NavButton>
              {view === "game" && playerName && (
                <span className="ml-3 px-3 py-1 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-full">
                  {playerName}
                </span>
              )}
            </nav>
          </div>
        </header>

        {/* ── Main Content ── */}
        <main className="flex-1">
          {view === "lobby" && (
            <Lobby
              onStart={handleStart}
              onShowLeaderboard={() => setView("leaderboard")}
            />
          )}
          {view === "game" && (
            <SpellBeeGame
              playerName={playerName}
              difficulty={difficulty}
              sessionId={sessionId}
              onEnd={handleGameEnd}
            />
          )}
          {view === "leaderboard" && (
            <Leaderboard onBack={() => setView("lobby")} />
          )}
        </main>

        {/* ── About / Footer ── */}
        {view !== "game" && (
          <footer className="bg-slate-50 border-t border-slate-200 mt-12">
            <div className="max-w-4xl mx-auto px-4 py-12">

              {/* Header */}
              <div className="text-center mb-10">
                <span className="text-xs font-semibold uppercase tracking-widest text-indigo-400">Side Project</span>
                <h2 className="text-2xl font-bold text-slate-800 mt-2">About This Project</h2>
                <p className="text-slate-500 mt-2 max-w-xl mx-auto text-sm">
                  A real-time voice AI spelling bee — built to explore Pipecat, WebRTC peer connections,
                  and production-grade AI voice pipelines without any paid third-party infra.
                </p>
              </div>

              {/* Tech cards */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                {[
                  { icon: "🎙️", label: "Deepgram", desc: "Nova-2 STT + Aura TTS — real-time speech transcription and natural voice output" },
                  { icon: "🤖", label: "Google Gemini", desc: "Flash LLM as AI game host — picks words, evaluates spelling, gives instant feedback" },
                  { icon: "📡", label: "Pipecat + SmallWebRTC", desc: "Self-hosted WebRTC voice pipeline — no Daily.co or paid infra, peer connections handled by the server" },
                  { icon: "⚡", label: "FastAPI + React 19", desc: "Async Python backend + TypeScript frontend deployed on GCP with Nginx and systemd" },
                ].map((t) => (
                  <div key={t.label} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                    <div className="text-2xl mb-2">{t.icon}</div>
                    <div className="font-semibold text-slate-800 text-sm mb-1">{t.label}</div>
                    <div className="text-xs text-slate-500 leading-relaxed">{t.desc}</div>
                  </div>
                ))}
              </div>

              {/* How it was built + Skills */}
              <div className="grid md:grid-cols-2 gap-6 mb-10">
                <div className="bg-white rounded-2xl p-6 border border-slate-200">
                  <h3 className="font-semibold text-slate-800 mb-4">How It Was Built</h3>
                  <ol className="space-y-3 text-sm text-slate-600">
                    {[
                      "Browser sends a WebRTC SDP offer to FastAPI backend via POST /api/offer",
                      "Backend creates a SmallWebRTC peer connection and spawns a Pipecat pipeline as a background task",
                      "Pipeline: audio in → Deepgram STT → Gemini Flash LLM → Deepgram TTS → audio out",
                      "Custom GameStateProcessor frame processor intercepts bot transcripts to detect correct/wrong answers and saves scores to SQLite",
                      "Frontend uses Pipecat client-react hooks for real-time transcript events and WebGL plasma visualizer",
                    ].map((step, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="bg-indigo-100 text-indigo-700 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-slate-200">
                  <h3 className="font-semibold text-slate-800 mb-4">Skills Demonstrated</h3>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "Pipecat Voice Pipeline", "WebRTC (SmallWebRTC)", "Deepgram STT / TTS",
                      "Google Gemini API", "FastAPI", "Async Python", "React 19", "TypeScript",
                      "Tailwind CSS v4", "WebGL Audio Visualizer", "SQLite", "Systemd Services",
                      "Nginx Reverse Proxy", "Let's Encrypt SSL", "GCP VM Deployment", "ICE / STUN / NAT Traversal",
                    ].map((skill) => (
                      <span key={skill} className="text-xs px-3 py-1 bg-slate-50 border border-slate-200 rounded-full text-slate-600 font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                  <div className="mt-5 pt-4 border-t border-slate-100 text-xs text-slate-400">
                    Deployed on <span className="text-slate-600 font-medium">GCP Ubuntu VM</span> — systemd + Nginx + SSL.
                  </div>
                </div>
              </div>

              {/* Built by */}
              <div className="text-center text-xs text-slate-400">
                Built by{" "}
                <a href="https://pawanpatra.com" target="_blank" rel="noopener noreferrer" className="text-indigo-500 font-medium hover:underline">
                  Pawan Patra
                </a>
                {" "}·{" "}
                <span>spellbee.pawanpatra.com</span>
              </div>
            </div>
          </footer>
        )}
      </div>
    </PipecatClientProvider>
  );
}

function NavButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${active
          ? "bg-indigo-50 text-indigo-700"
          : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
        }`}
    >
      {children}
    </button>
  );
}

export default App;
