import React from "react";

const TypingIndicator: React.FC = () => (
  <div className="flex items-start gap-2.5 animate-in fade-in duration-200">
    <div className="w-7 shrink-0" />
    <div
      className="rounded-2xl rounded-tl-lg px-5 py-3.5 flex items-center gap-1.5"
      style={{ backgroundColor: "hsl(230, 20%, 94%)" }}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="block w-1.5 h-1.5 rounded-full bg-muted-foreground/50"
          style={{
            animation: `typing-dot 1.2s ease-in-out ${i * 0.15}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes typing-dot {
          0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
          30% { opacity: 1; transform: translateY(-2px); }
        }
      `}</style>
    </div>
  </div>
);

export default TypingIndicator;
