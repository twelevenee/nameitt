export const WarmBlobs = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg" className={`pointer-events-none ${className}`} aria-hidden="true">
    <ellipse cx="160" cy="140" rx="130" ry="110" fill="hsl(230, 30%, 65%)" opacity="0.08" className="float-gentle" style={{ animationDuration: "18s" }} />
    <ellipse cx="260" cy="170" rx="100" ry="90" fill="hsl(35, 25%, 75%)" opacity="0.06" className="float-gentle" style={{ animationDuration: "22s", animationDelay: "2s" }} />
    <ellipse cx="200" cy="120" rx="80" ry="70" fill="hsl(280, 15%, 75%)" opacity="0.05" className="float-gentle" style={{ animationDuration: "20s", animationDelay: "4s" }} />
  </svg>
);

export const GentleWave = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 600 60" fill="none" xmlns="http://www.w3.org/2000/svg" className={`pointer-events-none w-full ${className}`} aria-hidden="true" preserveAspectRatio="none">
    <path d="M0 40 C100 10, 200 50, 300 30 C400 10, 500 45, 600 25 L600 60 L0 60Z" fill="hsl(230, 30%, 65%)" opacity="0.04" />
    <path d="M0 45 C150 20, 250 55, 350 35 C450 15, 550 48, 600 30 L600 60 L0 60Z" fill="hsl(35, 25%, 75%)" opacity="0.03" />
  </svg>
);

export const QuietScene = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={`pointer-events-none ${className}`} aria-hidden="true">
    {/* Horizon line */}
    <ellipse cx="100" cy="130" rx="90" ry="8" fill="hsl(35, 25%, 75%)" opacity="0.15" />
    {/* Sunrise glow */}
    <circle cx="100" cy="90" r="35" fill="hsl(35, 40%, 80%)" opacity="0.12" className="pulse-warm" style={{ animationDuration: "10s" }} />
    <circle cx="100" cy="90" r="20" fill="hsl(30, 35%, 85%)" opacity="0.15" />
    {/* Abstract plant */}
    <path d="M85 130 C85 110, 80 95, 75 85 C78 90, 82 88, 85 82 C85 95, 85 110, 85 130Z" fill="hsl(140, 20%, 65%)" opacity="0.12" />
    <path d="M88 130 C88 115, 90 100, 95 90 C92 96, 88 94, 86 88 C88 100, 88 115, 88 130Z" fill="hsl(140, 25%, 60%)" opacity="0.10" />
    {/* Small circle accent */}
    <circle cx="130" cy="75" r="6" fill="hsl(230, 30%, 65%)" opacity="0.08" className="float-slow" style={{ animationDuration: "25s" }} />
  </svg>
);

export const FloatingShapes = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 500 400" fill="none" xmlns="http://www.w3.org/2000/svg" className={`pointer-events-none ${className}`} aria-hidden="true">
    <circle cx="80" cy="80" r="18" fill="hsl(230, 30%, 65%)" opacity="0.06" className="float-slow" style={{ animationDuration: "18s" }} />
    <path d="M380 60 C395 35, 420 45, 410 70 C400 90, 370 80, 380 60Z" fill="hsl(35, 30%, 70%)" opacity="0.05" className="float-slow" style={{ animationDuration: "22s", animationDelay: "3s" }} />
    <ellipse cx="420" cy="320" rx="22" ry="18" fill="hsl(280, 15%, 72%)" opacity="0.05" className="float-slow" style={{ animationDuration: "25s", animationDelay: "1s" }} />
    <circle cx="60" cy="300" r="12" fill="hsl(5, 30%, 75%)" opacity="0.04" className="float-slow" style={{ animationDuration: "20s", animationDelay: "5s" }} />
  </svg>
);

export const WarmGlow = ({ className = "", size = 120 }: { className?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={`pointer-events-none ${className}`} aria-hidden="true">
    <defs>
      <radialGradient id="warmGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="hsl(35, 40%, 80%)" stopOpacity="0.3" />
        <stop offset="50%" stopColor="hsl(230, 30%, 65%)" stopOpacity="0.1" />
        <stop offset="100%" stopColor="hsl(230, 30%, 65%)" stopOpacity="0" />
      </radialGradient>
    </defs>
    <circle cx="60" cy="60" r="60" fill="url(#warmGlow)" className="pulse-warm" style={{ animationDuration: "8s" }} />
  </svg>
);
