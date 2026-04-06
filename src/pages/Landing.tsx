import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BarChart3, Heart } from "lucide-react";

const Landing = () => {
  useEffect(() => {
    document.title = "Was I Too Sensitive? — A Reflective Tool";
  }, []);

  return (
    <div id="main-content" className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Warm background with subtle organic shapes */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(160deg, hsl(35 30% 95%), hsl(28 25% 94%) 30%, hsl(250 20% 94%) 70%, hsl(230 22% 93%))" }} />
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-[0.07]" style={{ background: "radial-gradient(circle, hsl(230 30% 65%), transparent 70%)" }} />
      <div className="absolute bottom-[-15%] left-[-10%] w-[400px] h-[400px] rounded-full opacity-[0.05]" style={{ background: "radial-gradient(circle, hsl(25 40% 70%), transparent 70%)" }} />

      <div className="flex-1 flex items-center justify-center px-6 py-16 relative z-10">
        <div className="max-w-xl text-center space-y-8">
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Heart className="w-3.5 h-3.5 text-primary/60" aria-hidden="true" />
            <span>A reflective tool — not a judgment</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-[3.5rem] leading-[1.15] text-foreground tracking-tight">
            Was I too sensitive, or was something wrong?
          </h1>

          <p className="text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
            A gentle tool to help you name uncomfortable experiences without self-blame.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button asChild size="lg" className="rounded-full px-8 text-base h-12 shadow-sm">
              <Link to="/reflect">Reflect on an experience</Link>
            </Button>
            <Button asChild variant="ghost" size="lg" className="rounded-full px-6 text-base h-12 text-muted-foreground hover:text-foreground">
              <Link to="/patterns" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" aria-hidden="true" />
                View anonymous patterns
              </Link>
            </Button>
          </div>

          <div className="pt-8">
            <div className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-card/80 shadow-[var(--shadow-soft)]">
              <div className="w-2 h-2 rounded-full bg-primary/40" />
              <p className="text-xs text-muted-foreground">
                No account needed · Fully anonymous · Your words aren't stored
              </p>
            </div>
          </div>
        </div>
      </div>

      <footer className="pb-8 px-6 text-center relative z-10">
        <p className="text-xs text-muted-foreground/50 max-w-md mx-auto leading-relaxed">
          This tool does not provide legal, medical, or clinical advice. It is designed to support personal reflection only.
        </p>
      </footer>
    </div>
  );
};

export default Landing;
