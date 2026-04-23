import { useCallback, useEffect, useState } from "react";
import { TransportState, RTVIEvent } from "@pipecat-ai/client-js";
import {
  usePipecatClient,
  usePipecatClientMediaTrack,
  useRTVIClientEvent,
} from "@pipecat-ai/client-react";
import { Plasma } from "@pipecat-ai/voice-ui-kit/webgl";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function SpellBeeGame({
  playerName,
  difficulty,
  sessionId,
  onEnd,
}: {
  playerName: string;
  difficulty: string;
  sessionId: string;
  onEnd: () => void;
}) {
  const client = usePipecatClient();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isBotSpeaking, setIsBotSpeaking] = useState(false);

  // Get both audio tracks
  const botTrack = usePipecatClientMediaTrack("audio", "bot");
  const userTrack = usePipecatClientMediaTrack("audio", "local");

  // Feed whichever track is active — bot when speaking, user mic otherwise
  const activeTrack = isBotSpeaking ? botTrack : userTrack;

  useRTVIClientEvent(
    RTVIEvent.TransportStateChanged,
    useCallback((state: TransportState) => {
      setIsConnected(state === "ready");
      setIsConnecting(
        state === "connecting" ||
          state === "authenticating" ||
          state === "initializing"
      );
    }, [])
  );

  useRTVIClientEvent(
    RTVIEvent.BotTranscript,
    useCallback((data: { text: string }) => {
      if (data.text) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.text }]);
      }
    }, [])
  );

  useRTVIClientEvent(
    RTVIEvent.UserTranscript,
    useCallback((data: { text: string; final: boolean }) => {
      if (data.final && data.text) {
        setMessages((prev) => [...prev, { role: "user", content: data.text }]);
      }
    }, [])
  );

  useRTVIClientEvent(
    RTVIEvent.BotStartedSpeaking,
    useCallback(() => setIsBotSpeaking(true), [])
  );

  useRTVIClientEvent(
    RTVIEvent.BotStoppedSpeaking,
    useCallback(() => setIsBotSpeaking(false), [])
  );

  // Auto-connect on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      handleConnect();
    }, 100);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConnect = async () => {
    if (!client) return;
    try {
      setIsConnecting(true);
      await client.connect({
        webrtcRequestParams: {
          endpoint: `/api/offer?session_id=${sessionId}`,
        },
      });
    } catch (err) {
      console.error("Failed to connect:", err);
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!client) return;
    try {
      await client.disconnect();
      setIsConnected(false);
    } catch (err) {
      console.error("Failed to disconnect:", err);
    }
    onEnd();
  };

  const scoreInfo = parseScore(messages);

  const diffLabel =
    difficulty === "easy" ? "Easy" : difficulty === "hard" ? "Hard" : "Medium";
  const diffColor =
    difficulty === "easy"
      ? "bg-emerald-50 text-emerald-700"
      : difficulty === "hard"
      ? "bg-rose-50 text-rose-700"
      : "bg-amber-50 text-amber-700";

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-fade-in">
      {/* ── Score + Info Bar ── */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <StatusDot connected={isConnected} connecting={isConnecting} />
          <div>
            <p className="text-sm font-medium text-slate-700">{playerName}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${diffColor}`}>
              {diffLabel}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-indigo-600">{scoreInfo.score}</p>
            <p className="text-xs text-slate-400 uppercase tracking-wide">Correct</p>
          </div>
          <div className="w-px h-10 bg-slate-200" />
          <div className="text-center">
            <p className="text-3xl font-bold text-slate-300">{scoreInfo.wordNumber}</p>
            <p className="text-xs text-slate-400 uppercase tracking-wide">of 10</p>
          </div>
        </div>

        <button
          onClick={handleDisconnect}
          className="px-4 py-2 text-sm font-medium text-rose-600 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 transition"
        >
          End Game
        </button>
      </div>

      {/* ── Visualizer ── */}
      <div className="visualizer-container relative">
        <Plasma
          audioTrack={activeTrack}
          initialConfig={{
            backgroundColor: "#ffffff",
            audioSensitivity: 1.5,
            audioSmoothing: 0.85,
          }}
        />
        {isBotSpeaking && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full">
            Pawan is speaking...
          </div>
        )}
      </div>

      {/* ── Connection status ── */}
      {!isConnected && (
        <div className="text-center py-6">
          {isConnecting ? (
            <div className="flex items-center justify-center gap-2 text-indigo-600">
              <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-medium">Connecting to Pawan...</span>
            </div>
          ) : (
            <button
              onClick={handleConnect}
              className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition"
            >
              Reconnect
            </button>
          )}
        </div>
      )}

      {/* ── Mic hint ── */}
      {isConnected && (
        <p className="text-center text-sm text-slate-400 mt-4">
          Speak clearly to spell each word. Say letters one at a time.
        </p>
      )}
    </div>
  );
}

function StatusDot({ connected, connecting }: { connected: boolean; connecting: boolean }) {
  const color = connected
    ? "bg-emerald-400"
    : connecting
    ? "bg-amber-400 animate-pulse-dot"
    : "bg-slate-300";

  return <div className={`w-2.5 h-2.5 rounded-full ${color}`} />;
}

function parseScore(messages: Message[]): { score: number; wordNumber: number } {
  let correct = 0;
  let incorrect = 0;
  let wordNumber = 0;

  for (const msg of messages) {
    if (msg.role !== "assistant") continue;
    const text = msg.content.toLowerCase();

    if (/that(?:'s| is) correct/i.test(text)) {
      correct++;
    }

    if (/not quite|that(?:'s| is) incorrect/i.test(text)) {
      incorrect++;
    }

    const wordMatch = text.match(
      /word\s+(?:number\s+)?(\d+|one|two|three|four|five|six|seven|eight|nine|ten)/i
    );
    if (wordMatch) {
      const n = parseWordNum(wordMatch[1]);
      if (n > wordNumber) wordNumber = n;
    }
  }

  const totalAnswered = correct + incorrect;
  if (totalAnswered > wordNumber) wordNumber = totalAnswered;

  return { score: correct, wordNumber };
}

const WORD_NUMS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
};

function parseWordNum(s: string): number {
  const n = parseInt(s, 10);
  if (!isNaN(n)) return n;
  return WORD_NUMS[s.toLowerCase()] || 0;
}
