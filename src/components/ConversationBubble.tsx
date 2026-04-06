import React from "react";

interface ConversationBubbleProps {
  sender: "app" | "user";
  showIcon?: boolean;
  children: React.ReactNode;
  className?: string;
}

const AppIcon = () => (
  <div className="w-7 h-7 rounded-full shrink-0 mt-1" style={{
    background: "linear-gradient(135deg, hsl(230, 30%, 72%), hsl(230, 25%, 82%))",
    opacity: 0.8,
  }} />
);

const ConversationBubble: React.FC<ConversationBubbleProps> = ({
  sender, showIcon = false, children, className = "",
}) => {
  if (sender === "user") {
    return (
      <div className="flex justify-end animate-in fade-in slide-in-from-right-2 duration-300">
        <div
          className={`max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-tr-lg px-5 py-4 text-sm leading-relaxed ${className}`}
          style={{ backgroundColor: "hsl(230, 30%, 65%, 0.12)" }}
        >
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2.5 animate-in fade-in slide-in-from-left-2 duration-300">
      {showIcon ? <AppIcon /> : <div className="w-7 shrink-0" />}
      <div
        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-tl-lg px-5 py-4 text-sm leading-relaxed ${className}`}
        style={{ backgroundColor: "hsl(230, 20%, 94%)" }}
      >
        {children}
      </div>
    </div>
  );
};

export default ConversationBubble;
