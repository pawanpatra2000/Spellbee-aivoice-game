import { useState } from "react";
import { PipecatClient as PipecatClientBase } from "@pipecat-ai/client-js";
import { SmallWebRTCTransport } from "@pipecat-ai/small-webrtc-transport";
import {
  PipecatClientProvider,
  PipecatClientAudio,
} from "@pipecat-ai/client-react";
import Lobby from "./components/Lobby";
import SpellBeeGame from "./components/SpellBeeGame";
import Leaderboard from "./components/Leaderboard";

const client = new PipecatClientBase({
  transport: new SmallWebRTCTransport(),
  enableMic: true,
  enableCam: false,
}) as any;

type View = "lobby" | "game" | "leaderboard";

function App() {
  const [view, setView] = useState<View>("lobby");
  const [playerName, setPlayerName] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [sessionId, setSessionId] = useState("");

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
    setView("lobby");
  };

  return (
    <PipecatClientProvider client={client}>
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
      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
        active
          ? "bg-indigo-50 text-indigo-700"
          : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
      }`}
    >
      {children}
    </button>
  );
}

export default App;
