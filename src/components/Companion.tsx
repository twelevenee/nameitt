import { useLocation } from "react-router-dom";

interface CompanionProps {
  active?: boolean;
}

const Companion = ({ active = false }: CompanionProps) => {
  const location = useLocation();
  const path = location.pathname;

  // Hide on landing and shared summary pages
  if (path === "/" || path.startsWith("/shared")) return null;

  const isJournal = path === "/my-journal";
  const size = isJournal ? 100 : 80;

  return (
    <div
      className="fixed bottom-6 right-6 pointer-events-none z-0"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="companionGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(230, 30%, 65%)" stopOpacity={active ? "0.2" : "0.1"} />
            <stop offset="70%" stopColor="hsl(230, 30%, 65%)" stopOpacity="0.03" />
            <stop offset="100%" stopColor="hsl(230, 30%, 65%)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle
          cx="50" cy="50" r="50"
          fill="url(#companionGlow)"
          className="pulse-warm"
          style={{
            animationDuration: "9s",
            transition: "opacity 1s ease",
            opacity: active ? 1 : 0.7,
          }}
        />
      </svg>
    </div>
  );
};

export default Companion;
