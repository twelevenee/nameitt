import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getPatternByKey } from "@/lib/patterns";
import { PATTERN_ICONS } from "@/lib/patternIcons";
import { getRandomAffirmation } from "@/lib/affirmations";
import { WarmBlobs, FloatingShapes, GentleWave } from "@/components/Illustrations";

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
    document.title = "Name It — It wasn't nothing.";
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
      <div className="absolute inset-0" style={{ background: "var(--gradient-warm)" }} />
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-[0.07]" style={{ background: "radial-gradient(circle, hsl(230 30% 65%), transparent 70%)" }} />
      <div className="absolute bottom-[-15%] left-[-10%] w-[400px] h-[400px] rounded-full opacity-[0.05]" style={{ background: "radial-gradient(circle, hsl(25 40% 70%), transparent 70%)" }} />

      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <WarmBlobs className="absolute top-[10%] left-[5%] w-[400px] h-[300px] opacity-60" />
        <FloatingShapes className="absolute inset-0 w-full h-full opacity-80" />
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-16 relative z-10">
        <div className="max-w-xl text-center space-y-8">
          <p className="text-sm text-muted-foreground">
            For women and gender-diverse people
          </p>

          <h1 className="text-4xl sm:text-5xl md:text-[3.5rem] leading-[1.15] text-foreground tracking-tight font-semibold">
            It wasn't nothing.
          </h1>

          <p className="text-lg text-muted-foreground max-w-[500px] mx-auto leading-relaxed">
            When something feels wrong but you can't name it — when you're told you're overreacting — this tool helps you find the words. No account. No judgment. Just clarity.
          </p>

          <div className="flex flex-col items-center gap-3 pt-2">
            <Button asChild size="lg" className="rounded-full px-8 text-base h-12 shadow-sm">
              <Link to="/reflect">Describe what happened</Link>
            </Button>
            <p className="text-xs text-muted-foreground/60">
              Takes about 3 minutes. Your words are never stored.
            </p>
          </div>

          {/* Featured stories */}
          {featured.length > 0 && (
            <div className="pt-10 space-y-4 max-w-lg mx-auto">
              <div className="relative -mx-6 py-4">
                <GentleWave className="opacity-30" />
              </div>
              <p className="text-xs text-muted-foreground/70 uppercase tracking-wide font-medium">From people who reflected here</p>
              <div className="space-y-3">
                {featured.map((s) => {
                  const pat = getPatternByKey(s.primary_pattern);
                  return (
                    <div key={s.id} className="rounded-2xl bg-card/60 p-5 text-left space-y-2">
                      <p className="text-sm text-foreground/80 leading-[1.75] italic">{s.story}</p>
                      <div className="flex items-center gap-3">
                        {pat && (
                          <Badge variant="secondary" className="rounded-full text-[10px] gap-1">
                            <span aria-hidden="true">{PATTERN_ICONS[s.primary_pattern]}</span>
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

          <div className="pt-4 space-y-3">
            <p className="text-xs text-muted-foreground/60">
              <Link to="/how-it-works" className="underline hover:text-muted-foreground transition-colors">Learn how it works</Link>
              {" · "}
              <Link to="/stories" className="underline hover:text-muted-foreground transition-colors">Browse stories</Link>
              {" · "}
              <Link to="/patterns" className="underline hover:text-muted-foreground transition-colors">View patterns</Link>
            </p>
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
