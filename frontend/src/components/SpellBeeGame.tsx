import { useCallback, useState } from "react";
import { TransportState, RTVIEvent } from "@pipecat-ai/client-js";
import { useRTVIClient, useRTVIClientEvent } from "@pipecat-ai/client-react";
import GameStatus from "./GameStatus";
import Transcript from "./Transcript";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function SpellBeeGame() {
  const client = useRTVIClient();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isBotSpeaking, setIsBotSpeaking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

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
    RTVIEvent.BotStartedSpeaking,
    useCallback(() => setIsBotSpeaking(true), [])
  );

  useRTVIClientEvent(
    RTVIEvent.BotStoppedSpeaking,
    useCallback(() => setIsBotSpeaking(false), [])
  );

  // Capture bot transcript
  useRTVIClientEvent(
    RTVIEvent.BotTranscript,
    useCallback((data: { text: string }) => {
      if (data.text) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.text },
        ]);
      }
    }, [])
  );

  // Capture user transcript
  useRTVIClientEvent(
    RTVIEvent.UserTranscript,
    useCallback((data: { text: string; final: boolean }) => {
      if (data.final && data.text) {
        setMessages((prev) => [
          ...prev,
          { role: "user", content: data.text },
        ]);
      }
    }, [])
  );

  const handleConnect = async () => {
    if (!client) return;
    try {
      setIsConnecting(true);
      await client.connect();
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
      setIsBotSpeaking(false);
    } catch (err) {
      console.error("Failed to disconnect:", err);
    }
  };

  return (
    <div className="spell-bee-container">
      <div className="header">
        <h1>Spell Bee</h1>
        <p>Voice-powered spelling bee game</p>
      </div>

      <GameStatus isConnected={isConnected} isConnecting={isConnecting} />

      <div className="controls">
        {!isConnected ? (
          <button
            className="btn btn-start"
            onClick={handleConnect}
            disabled={isConnecting}
          >
            {isConnecting ? "Connecting..." : "Start Game"}
          </button>
        ) : (
          <button className="btn btn-end" onClick={handleDisconnect}>
            End Game
          </button>
        )}
      </div>

      {isBotSpeaking && (
        <div className="bot-speaking">
          <div className="speaking-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
          Bot is speaking...
        </div>
      )}

      <Transcript messages={messages} />
    </div>
  );
}
