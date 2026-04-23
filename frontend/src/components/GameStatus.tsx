interface GameStatusProps {
  isConnected: boolean;
  isConnecting: boolean;
}

export default function GameStatus({
  isConnected,
  isConnecting,
}: GameStatusProps) {
  const statusClass = isConnected
    ? "connected"
    : isConnecting
      ? "connecting"
      : "";
  const statusText = isConnected
    ? "Connected - Game in progress"
    : isConnecting
      ? "Connecting to session..."
      : "Ready to start";

  return (
    <div className="status-bar">
      <div className={`status-dot ${statusClass}`} />
      <span className="status-text">{statusText}</span>
    </div>
  );
}
