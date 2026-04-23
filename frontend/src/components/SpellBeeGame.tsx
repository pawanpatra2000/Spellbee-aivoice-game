import { useCallback, useState } from "react";
import { TransportState, RTVIEvent } from "@pipecat-ai/client-js";
import {
  usePipecatClient,
  useRTVIClientEvent,
} from "@pipecat-ai/client-react";
import { PlasmaVisualizer } from "@pipecat-ai/voice-ui-kit/webgl";
import GameStatus from "./GameStatus";

export default function SpellBeeGame() {
  const client = usePipecatClient();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

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

  const handleConnect = async () => {
    if (!client) return;
    try {
      setIsConnecting(true);
      await client.connect({
        webrtcRequestParams: {
          endpoint: "/api/offer",
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
  };

  return (
    <>
      <GameStatus isConnected={isConnected} isConnecting={isConnecting} />

      <div className="visualizer-container">
        <PlasmaVisualizer />
      </div>

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
    </>
  );
}
