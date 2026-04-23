import { useEffect, useRef } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface TranscriptProps {
  messages: Message[];
}

export default function Transcript({ messages }: TranscriptProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="transcript">
      {messages.length === 0 ? (
        <div className="transcript-empty">
          Click "Start Game" to begin the spelling bee!
        </div>
      ) : (
        messages.map((msg, i) => (
          <div
            key={i}
            className={`message ${msg.role === "assistant" ? "bot" : "user"}`}
          >
            <div className="message-role">
              {msg.role === "assistant" ? "Spell Bee Bot" : "You"}
            </div>
            <div className="message-text">{msg.content}</div>
          </div>
        ))
      )}
      <div ref={endRef} />
    </div>
  );
}
