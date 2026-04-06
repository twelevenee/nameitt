import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Heart, BookOpen, BookText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getPatternByKey } from "@/lib/patterns";
import { PATTERN_ICONS } from "@/lib/patternIcons";
import { getRandomAffirmation } from "@/lib/affirmations";
import { WarmBlobs, FloatingShapes } from "@/components/Illustrations";

interface FeaturedStory {
  id: string;
  story: string;
  primary_pattern: string;
  resonates: number;
}

const Landing = () => {
  const [featured, setFeatured] = useState<FeaturedStory[]>([]);
  const [affirmation] = useState(getRandomAffirmation);

  useEffect(() => {
    document.title = "Was I Too Sensitive? — A Reflective Tool";
    const fetchFeatured = async () => {
      const { data } = await supabase
        .from("stories")
        .select("id, story, primary_pattern, resonates")
        .eq("featured", true)
        .limit(3);
      if (data && data.length > 0) setFeatured(data as FeaturedStory[]);
    };
    fetchFeatured();
  }, []);

  return (
    <div id="main-content" className="min-h-screen flex flex-col relative overflow-hidden">
      <div className="absolute inset-0" style={{ background: "linear-gradient(160deg, hsl(35 30% 95%), hsl(28 25% 94%) 30%, hsl(250 20% 94%) 70%, hsl(230 22% 93%))" }} />
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-[0.07]" style={{ background: "radial-gradient(circle, hsl(230 30% 65%), transparent 70%)" }} />
      <div className="absolute bottom-[-15%] left-[-10%] w-[400px] h-[400px] rounded-full opacity-[0.05]" style={{ background: "radial-gradient(circle, hsl(25 40% 70%), transparent 70%)" }} />

      {/* Background illustrations */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <WarmBlobs className="absolute top-[10%] left-[5%] w-[400px] h-[300px] opacity-60" />
        <FloatingShapes className="absolute inset-0 w-full h-full opacity-80" />
      </div>

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

          <div className="pt-2">
            <Link
              to="/stories"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground/70 hover:text-muted-foreground transition-colors"
            >
              <BookText className="w-3.5 h-3.5" aria-hidden="true" />
              Read others' stories
            </Link>
          </div>

          {/* Featured stories */}
          {featured.length > 0 && (
            <div className="pt-6 space-y-4 max-w-lg mx-auto">
              <p className="text-xs text-muted-foreground/70 uppercase tracking-wide font-medium">From people who reflected</p>
              <div className="space-y-3">
                {featured.map((s) => {
                  const pat = getPatternByKey(s.primary_pattern);
                  return (
                    <div key={s.id} className="rounded-2xl bg-card/60 p-5 text-left space-y-2">
                      <p className="text-sm text-foreground/80 leading-[1.75] italic">{s.story}</p>
                      <div className="flex items-center gap-3">
                        {pat && (
                          <Badge variant="secondary" className="rounded-full text-[10px] gap-1">
                            <span>{PATTERN_ICONS[s.primary_pattern]}</span>
                            {pat.title}
                          </Badge>
                        )}
                        {s.resonates > 0 && (
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Heart className="w-3 h-3 fill-current text-primary/50" aria-hidden="true" />
                            {s.resonates}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="pt-4 space-y-4">
            <div className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-card/80 shadow-[var(--shadow-soft)]">
              <div className="w-2 h-2 rounded-full bg-primary/40" />
              <p className="text-xs text-muted-foreground">
                No account needed · Fully anonymous · Your words aren't stored
              </p>
            </div>
            <div className="block">
              <Link
                to="/my-journal"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/70 hover:text-muted-foreground transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                Access your private journal
              </Link>
            </div>
          </div>
        </div>
      </div>

      <footer className="pb-8 px-6 text-center relative z-10 space-y-3">
        <p className="text-xs text-muted-foreground/40 italic" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          "{affirmation}"
        </p>
        <p className="text-xs text-muted-foreground/50 max-w-md mx-auto leading-relaxed">
          This tool does not provide legal, medical, or clinical advice. It is designed to support personal reflection only.
        </p>
      </footer>
    </div>
  );
};

export default Landing;
