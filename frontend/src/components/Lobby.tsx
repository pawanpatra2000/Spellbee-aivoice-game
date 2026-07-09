import { useState, useEffect } from "react";

interface RecentGame {
  name: string;
  score: number;
  total_words: number;
  difficulty: string;
  created_at: string;
}

interface PlayerStats {
  name: string;
  games_played: number;
  best_score: number;
  avg_score: number;
}

export default function Lobby({
  onStart,
  onShowLeaderboard,
}: {
  onStart: (name: string, difficulty: string) => void;
  onShowLeaderboard: () => void;
}) {
  const [name, setName] = useState(() => localStorage.getItem("spellbee_name") || "");
  const [difficulty, setDifficulty] = useState("easy");
  const [recentGames, setRecentGames] = useState<RecentGame[]>([]);
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/games/recent?limit=5")
      .then((r) => r.json())
      .then(setRecentGames)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (name.trim().length >= 2) {
      fetch(`/api/player/${encodeURIComponent(name.trim())}`)
        .then((r) => r.json())
        .then(setPlayerStats)
        .catch(() => {});
    } else {
      setPlayerStats(null);
    }
  }, [name]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || loading) return;
    setLoading(true);
    localStorage.setItem("spellbee_name", name.trim());
    onStart(name.trim(), difficulty);
  };

  const difficulties = [
    { value: "easy", label: "Easy", desc: "Simple words (4-6 letters)", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    { value: "medium", label: "Medium", desc: "Moderate challenge (5-8 letters)", color: "bg-amber-50 text-amber-700 border-amber-200" },
    { value: "hard", label: "Hard", desc: "Expert level (7-12 letters)", color: "bg-rose-50 text-rose-700 border-rose-200" },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 animate-fade-in" id="top">
      {/* Hero */}
      <div className="text-center mb-10">
        <span className="text-6xl mb-4 block animate-float">🐝</span>
        <h1 className="text-4xl font-extrabold text-slate-900 mb-2">Spell Bee</h1>
        <p className="text-slate-500 text-lg">Voice-powered spelling challenge</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* ── Start Game Card ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-5">Start a Game</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">
                Your Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                required
                minLength={2}
                maxLength={30}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition text-slate-800 bg-white"
              />
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Difficulty
              </label>
              <div className="grid grid-cols-3 gap-2">
                {difficulties.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => setDifficulty(d.value)}
                    className={`p-3 rounded-xl border-2 text-center transition ${
                      difficulty === d.value
                        ? d.color + " border-current font-semibold"
                        : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                    }`}
                  >
                    <div className="text-sm font-medium">{d.label}</div>
                    <div className="text-[11px] mt-0.5 opacity-70">{d.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Player Stats */}
            {playerStats && playerStats.games_played > 0 && (
              <div className="bg-indigo-50 rounded-xl p-3 flex items-center justify-between text-sm">
                <span className="text-indigo-600 font-medium">Your stats</span>
                <div className="flex gap-4 text-indigo-700">
                  <span>{playerStats.games_played} games</span>
                  <span>Best: {playerStats.best_score}/10</span>
                  <span>Avg: {playerStats.avg_score}</span>
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={!name.trim() || loading}
              className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Starting..." : "Start Game"}
            </button>
          </form>
        </div>

        {/* ── Right Column ── */}
        <div className="space-y-6">
          {/* Recent Games */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800">Recent Games</h2>
              <button
                onClick={onShowLeaderboard}
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
              >
                View Leaderboard
              </button>
            </div>

            {recentGames.length === 0 ? (
              <p className="text-slate-400 text-sm py-4 text-center">
                No games yet. Be the first to play!
              </p>
            ) : (
              <div className="space-y-2">
                {recentGames.map((g, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50 transition"
                  >
                    <div>
                      <span className="font-medium text-slate-700">{g.name}</span>
                      <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                        {g.difficulty}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">
                        {g.score}/{g.total_words}
                      </span>
                      <ScoreBadge score={g.score} total={g.total_words} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* How it works */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
            <h3 className="font-semibold text-slate-800 mb-3">How it works</h3>
            <ol className="space-y-2 text-sm text-slate-600">
              <li className="flex gap-2">
                <span className="bg-indigo-100 text-indigo-700 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0">1</span>
                <span>Pawan, your AI host, announces a word with its definition</span>
              </li>
              <li className="flex gap-2">
                <span className="bg-indigo-100 text-indigo-700 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0">2</span>
                <span>Spell it out loud, letter by letter</span>
              </li>
              <li className="flex gap-2">
                <span className="bg-indigo-100 text-indigo-700 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0">3</span>
                <span>Get instant feedback and track your score through 10 rounds</span>
              </li>
            </ol>
          </div>
        </div>
      </div>

      {/* ── About This Project ── */}
      <div className="mt-16 border-t border-slate-100 pt-12">
        <div className="text-center mb-10">
          <span className="text-xs font-semibold uppercase tracking-widest text-indigo-400">Side Project</span>
          <h2 className="text-2xl font-bold text-slate-800 mt-2">About This Project</h2>
          <p className="text-slate-500 mt-2 max-w-xl mx-auto text-sm">
            A real-time voice AI game — built to explore Pipecat, WebRTC, and
            production-grade AI voice pipelines without any paid infrastructure.
          </p>
        </div>

        {/* Tech Stack */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {[
            {
              icon: "🎙️",
              label: "Deepgram",
              desc: "Nova-2 STT + Aura TTS — real-time speech transcription and natural voice output",
            },
            {
              icon: "🤖",
              label: "Google Gemini",
              desc: "Flash LLM acts as AI game host — picks words, evaluates spelling, gives feedback",
            },
            {
              icon: "📡",
              label: "Pipecat + SmallWebRTC",
              desc: "Self-hosted WebRTC voice pipeline — no Daily.co or third-party infra needed",
            },
            {
              icon: "⚡",
              label: "FastAPI + React",
              desc: "Async Python backend with React 19 + TypeScript frontend, deployed on GCP",
            },
          ].map((t) => (
            <div key={t.label} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="text-2xl mb-2">{t.icon}</div>
              <div className="font-semibold text-slate-800 text-sm mb-1">{t.label}</div>
              <div className="text-xs text-slate-500 leading-relaxed">{t.desc}</div>
            </div>
          ))}
        </div>

        {/* How it was built */}
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
            <h3 className="font-semibold text-slate-800 mb-4">How It Was Built</h3>
            <ol className="space-y-3 text-sm text-slate-600">
              {[
                "Browser sends WebRTC SDP offer to FastAPI backend via /api/offer",
                "Backend creates a SmallWebRTC peer connection and spawns a Pipecat pipeline as a background task",
                "Pipeline: audio in → Deepgram STT → Gemini Flash → Deepgram TTS → audio out",
                "Custom GameStateProcessor intercepts bot transcripts to detect correct/wrong answers and saves scores to SQLite",
                "Frontend uses Pipecat client-react hooks to handle real-time transcript events and WebGL audio visualizer",
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

          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
            <h3 className="font-semibold text-slate-800 mb-4">Skills Demonstrated</h3>
            <div className="flex flex-wrap gap-2">
              {[
                "Pipecat Voice Pipeline",
                "WebRTC (SmallWebRTC)",
                "Deepgram STT / TTS",
                "Google Gemini API",
                "FastAPI",
                "Async Python",
                "React 19",
                "TypeScript",
                "Tailwind CSS v4",
                "WebGL Audio Visualizer",
                "SQLite",
                "Systemd Services",
                "Nginx Reverse Proxy",
                "Let's Encrypt SSL",
                "GCP VM Deployment",
                "ICE / STUN / NAT Traversal",
              ].map((skill) => (
                <span
                  key={skill}
                  className="text-xs px-3 py-1 bg-white border border-slate-200 rounded-full text-slate-600 font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>

            <div className="mt-5 pt-4 border-t border-slate-200">
              <p className="text-xs text-slate-500">
                Deployed on <span className="font-medium text-slate-700">GCP (Ubuntu VM)</span> with
                systemd services, Nginx reverse proxy, and Let's Encrypt SSL.
                Source on{" "}
                <a
                  href="https://github.com/pawanpatra"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 font-medium hover:underline"
                >
                  GitHub
                </a>.
              </p>
            </div>
          </div>
        </div>

        {/* Built by */}
        <div className="text-center text-xs text-slate-400 pb-4">
          Built by{" "}
          <a
            href="https://github.com/pawanpatra"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-500 font-medium hover:underline"
          >
            Pawan Patra
          </a>{" "}
          · <a href="https://spellbee.pawanpatra.com" className="hover:underline">spellbee.pawanpatra.com</a>
        </div>
      </div>
    </div>
  );
}

function ScoreBadge({ score, total }: { score: number; total: number }) {
  const pct = total > 0 ? score / total : 0;
  const color =
    pct >= 0.8
      ? "bg-emerald-100 text-emerald-700"
      : pct >= 0.5
      ? "bg-amber-100 text-amber-700"
      : "bg-rose-100 text-rose-700";

  return (
    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${color}`}>
      {Math.round(pct * 100)}%
    </span>
  );
}
