import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BarChart3 } from "lucide-react";

const Landing = () => {
  useEffect(() => {
    document.title = "Was I Too Sensitive? — A Reflective Tool";
  }, []);

  return (
    <div id="main-content" className="min-h-screen flex flex-col" style={{ background: "var(--gradient-warm)" }}>
      <div className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="max-w-2xl text-center space-y-10">
          <p className="text-sm text-muted-foreground tracking-wide">
            A reflective tool — not a judgment
          </p>

          <h1 className="text-4xl sm:text-5xl md:text-6xl leading-tight text-foreground tracking-tight">
            Was I too sensitive, or was something wrong?
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-lg mx-auto leading-relaxed">
            A gentle tool to help you name uncomfortable experiences without self-blame.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button asChild size="lg" className="rounded-full px-8 text-base h-12">
              <Link to="/reflect">Reflect on an experience</Link>
            </Button>
            <Button asChild variant="ghost" size="lg" className="rounded-full px-6 text-base h-12 text-muted-foreground hover:text-foreground">
              <Link to="/patterns" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" aria-hidden="true" />
                View anonymous patterns
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <footer className="pb-8 px-6 text-center">
        <p className="text-xs text-muted-foreground/60 max-w-md mx-auto leading-relaxed">
          This tool does not provide legal, medical, or clinical advice. It is designed to support personal reflection only. Your privacy is respected — no account required.
        </p>
      </footer>
    </div>
  );
};

export default Landing;
