import { useState, useEffect } from "react";

interface LeaderboardEntry {
  name: string;
  score: number;
  total_words: number;
  difficulty: string;
  created_at: string;
}

export default function Leaderboard({ onBack }: { onBack: () => void }) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/leaderboard?limit=50")
      .then((r) => r.json())
      .then((data) => {
        setEntries(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const difficultyColor: Record<string, string> = {
    easy: "bg-emerald-50 text-emerald-700",
    medium: "bg-amber-50 text-amber-700",
    hard: "bg-rose-50 text-rose-700",
  };

  const medalEmoji = (index: number) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return null;
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Leaderboard</h1>
          <p className="text-slate-500 mt-1">Top spelling champions</p>
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition"
        >
          Back to Home
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading...</div>
        ) : entries.length === 0 ? (
          <div className="p-12 text-center">
            <span className="text-4xl block mb-3">🏆</span>
            <p className="text-slate-500">No games played yet. Be the first!</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 text-sm text-slate-500">
                <th className="text-left py-3 px-4 font-medium w-12">#</th>
                <th className="text-left py-3 px-2 font-medium">Player</th>
                <th className="text-center py-3 px-2 font-medium">Score</th>
                <th className="text-center py-3 px-2 font-medium">Difficulty</th>
                <th className="text-right py-3 px-4 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, i) => (
                <tr
                  key={i}
                  className={`border-b border-slate-50 hover:bg-slate-50/50 transition ${
                    i < 3 ? "bg-amber-50/30" : ""
                  }`}
                >
                  <td className="py-3 px-4 text-sm">
                    {medalEmoji(i) || (
                      <span className="text-slate-400">{i + 1}</span>
                    )}
                  </td>
                  <td className="py-3 px-2">
                    <span className={`font-medium ${i < 3 ? "text-slate-900" : "text-slate-700"}`}>
                      {entry.name}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <span className="font-bold text-slate-800">
                      {entry.score}
                    </span>
                    <span className="text-slate-400">/{entry.total_words}</span>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        difficultyColor[entry.difficulty] || "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {entry.difficulty}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-sm text-slate-400">
                    {formatDate(entry.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + "Z");
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  } catch {
    return dateStr;
  }
}
