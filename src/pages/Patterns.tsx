import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, TrendingUp, Brain, MapPin, ChevronDown, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PATTERNS } from "@/lib/patterns";
import { PATTERN_ICONS } from "@/lib/patternIcons";
import { useIsMobile } from "@/hooks/use-mobile";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { getRandomAffirmation } from "@/lib/affirmations";
import { FloatingShapes, WarmBlobs } from "@/components/Illustrations";

const CHART_COLORS = [
  "hsl(230, 30%, 65%)",
  "hsl(230, 25%, 72%)",
  "hsl(230, 20%, 78%)",
  "hsl(230, 30%, 58%)",
  "hsl(230, 25%, 68%)",
  "hsl(230, 20%, 75%)",
  "hsl(230, 15%, 80%)",
];

interface Stats {
  topPattern: string;
  selfDoubtPercent: number;
  topContext: string;
  patternCounts: { name: string; count: number }[];
  patternCountsByKey: Record<string, number>;
  totalExperiences: number;
}

const EducationalCard = ({
  patternKey,
  title,
  explanation,
  examples,
  reportedCount,
  totalExperiences,
  showStats,
}: {
  patternKey: string;
  title: string;
  explanation: string;
  examples: string[];
  reportedCount: number;
  totalExperiences: number;
  showStats: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const percent = totalExperiences > 0 ? Math.round((reportedCount / totalExperiences) * 100) : 0;

  return (
    <div className="rounded-2xl bg-card shadow-[var(--shadow-soft)]">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <button className="w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-2xl p-5 sm:p-6 flex items-center gap-3" aria-expanded={open}>
            <span className="text-muted-foreground shrink-0">{PATTERN_ICONS[patternKey]}</span>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground text-sm sm:text-base">{title}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mt-1 line-clamp-2 break-words">{explanation}</p>
            </div>
            <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} aria-hidden="true" />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-5 sm:px-6 pb-5 sm:pb-6 space-y-4">
            {examples.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">What this can look like</p>
                <ul className="space-y-1.5">
                  {examples.map((ex, i) => (
                    <li key={i} className="text-xs sm:text-sm text-foreground/70 leading-relaxed pl-3 border-l-2 border-primary/20 break-words">
                      "{ex}"
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {showStats && reportedCount > 0 && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    This pattern appeared in <span className="font-semibold text-foreground/80">{percent}%</span> of shared experiences
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {reportedCount} {reportedCount === 1 ? "report" : "reports"}
                  </p>
                </div>
                <Progress value={percent} className="h-1.5" />
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

const MobileBarChart = ({ data, maxCount }: { data: { name: string; count: number }[]; maxCount: number }) => (
  <div className="space-y-3">
    {data.map((item, i) => (
      <div key={item.name} className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground truncate max-w-[70%]">{item.name}</span>
          <span className="text-xs font-medium text-foreground">{item.count}</span>
        </div>
        <div className="h-2 rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${maxCount > 0 ? (item.count / maxCount) * 100 : 0}%`,
              backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
            }}
          />
        </div>
      </div>
    ))}
  </div>
);

const Patterns = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    document.title = "Anonymous Patterns — Was I Too Sensitive?";
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data: experiences } = await supabase
          .from("experiences")
          .select("id, context_where, self_doubt")
          .eq("contributed", true);

        if (!experiences || experiences.length === 0) {
          setStats(null);
          setLoading(false);
          return;
        }

        const expIds = experiences.map((e) => e.id);
        const { data: analyses } = await supabase
          .from("analyses")
          .select("detected_patterns, self_doubt_detected")
          .in("experience_id", expIds);

        const patternMap: Record<string, number> = {};
        let selfDoubtCount = 0;

        for (const a of analyses ?? []) {
          if (a.self_doubt_detected) selfDoubtCount++;
          const patterns = a.detected_patterns as string[];
          if (Array.isArray(patterns)) {
            for (const p of patterns) {
              patternMap[p] = (patternMap[p] || 0) + 1;
            }
          }
        }

        const sorted = Object.entries(patternMap).sort((a, b) => b[1] - a[1]);
        const topPatternKey = sorted[0]?.[0] ?? "";
        const topPatternDef = PATTERNS.find((p) => p.key === topPatternKey);

        const contextMap: Record<string, number> = {};
        for (const e of experiences) {
          if (e.context_where) {
            contextMap[e.context_where] = (contextMap[e.context_where] || 0) + 1;
          }
        }
        const topContext = Object.entries(contextMap).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

        setStats({
          topPattern: topPatternDef?.title ?? topPatternKey,
          selfDoubtPercent: analyses?.length ? Math.round((selfDoubtCount / analyses.length) * 100) : 0,
          topContext,
          patternCounts: sorted.map(([key, count]) => ({
            name: PATTERNS.find((p) => p.key === key)?.title ?? key,
            count,
          })),
          patternCountsByKey: patternMap,
          totalExperiences: experiences.length,
        });
      } catch {
        setStats(null);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const hasData = stats && stats.totalExperiences > 0;
  const showPerPatternStats = (stats?.totalExperiences ?? 0) >= 5;
  const showChart = (stats?.totalExperiences ?? 0) >= 3;
  const maxCount = stats?.patternCounts?.[0]?.count ?? 0;

  return (
    <div id="main-content" className="min-h-screen px-6 py-10 relative" style={{ background: "var(--gradient-warm)" }}>
      {/* Background illustrations */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <FloatingShapes className="absolute inset-0 w-full h-full opacity-80" />
      </div>
      <div className="max-w-3xl mx-auto space-y-12 relative z-10">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Back
        </Link>

        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl text-foreground tracking-tight">Anonymous Patterns</h1>
          <p className="text-muted-foreground leading-relaxed">
            Based on anonymous, voluntarily shared experiences. No personal details are displayed.
          </p>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">
          Many people experience subtle forms of discrimination but struggle to name what happened. Research shows these experiences are widespread — seeing the patterns can help you recognize that what you felt was real.
        </p>

        {loading ? (
          <p className="text-muted-foreground text-center py-20" role="status">Loading patterns…</p>
        ) : (
          <>
            <div className="space-y-6">
              <h2 className="text-2xl text-foreground tracking-tight">Understanding the Patterns</h2>
              <div className="space-y-3">
                {PATTERNS.map((pattern) => (
                  <EducationalCard
                    key={pattern.key}
                    patternKey={pattern.key}
                    title={pattern.title}
                    explanation={pattern.explanation}
                    examples={pattern.examples}
                    reportedCount={stats?.patternCountsByKey?.[pattern.key] ?? 0}
                    totalExperiences={stats?.totalExperiences ?? 0}
                    showStats={showPerPatternStats}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-2xl text-foreground tracking-tight">What People Are Sharing</h2>

              {!hasData ? (
                <div className="rounded-2xl bg-card p-8 text-center space-y-6 shadow-[var(--shadow-soft)]">
                  <div className="flex justify-center">
                    <WarmBlobs className="w-48 h-36 opacity-60" />
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
                    As more people reflect, patterns will emerge here. Every voice matters.
                  </p>
                  <Button asChild className="rounded-full">
                    <Link to="/reflect" className="inline-flex items-center gap-2">
                      <Send className="w-4 h-4" aria-hidden="true" />
                      Add yours
                    </Link>
                  </Button>
                </div>
              ) : (
                <>
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                    <div className="rounded-2xl bg-card p-5 sm:p-6 space-y-2 shadow-[var(--shadow-soft)]">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <TrendingUp className="w-4 h-4" aria-hidden="true" />
                        <span className="text-xs font-medium uppercase tracking-wide">Most Common Pattern</span>
                      </div>
                      <p className="text-lg sm:text-xl font-semibold text-foreground">{stats!.topPattern}</p>
                    </div>

                    <div className="rounded-2xl bg-card p-5 sm:p-6 space-y-2 shadow-[var(--shadow-soft)]">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Brain className="w-4 h-4" aria-hidden="true" />
                        <span className="text-xs font-medium uppercase tracking-wide">Self-Doubt Detected</span>
                      </div>
                      <p className="text-lg sm:text-xl font-semibold text-foreground">{stats!.selfDoubtPercent}%</p>
                      <p className="text-xs text-muted-foreground">of shared experiences</p>
                    </div>

                    <div className="rounded-2xl bg-card p-5 sm:p-6 space-y-2 shadow-[var(--shadow-soft)]">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4" aria-hidden="true" />
                        <span className="text-xs font-medium uppercase tracking-wide">Most Common Context</span>
                      </div>
                      <p className="text-lg sm:text-xl font-semibold text-foreground capitalize">{stats!.topContext}</p>
                    </div>
                  </div>

                  {showChart && stats!.patternCounts.length > 0 && (
                    <div className="rounded-2xl bg-card p-5 sm:p-8 space-y-4 shadow-[var(--shadow-soft)]">
                      <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">
                        Most frequently identified patterns across all shared experiences
                      </h3>
                      {isMobile ? (
                        <MobileBarChart data={stats!.patternCounts} maxCount={maxCount} />
                      ) : (
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={stats!.patternCounts} layout="vertical" margin={{ left: 20 }}>
                            <XAxis type="number" hide />
                            <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 12, fill: "hsl(230, 10%, 45%)" }} />
                            <Tooltip
                              contentStyle={{
                                background: "hsl(35, 20%, 97%)",
                                border: "1px solid hsl(230, 15%, 90%)",
                                borderRadius: "12px",
                                fontSize: "13px",
                              }}
                            />
                            <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                              {stats!.patternCounts.map((_, i) => (
                                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                      <p className="text-xs text-muted-foreground text-center">
                        Based on {stats!.totalExperiences} anonymously shared {stats!.totalExperiences === 1 ? "experience" : "experiences"}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}

        <div className="rounded-2xl bg-card/60 p-5 text-center space-y-2">
          <p className="text-sm text-foreground">Hear from others</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Read anonymous stories from people who reflected on similar experiences.
          </p>
          <Link to="/stories" className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors">
            Browse stories
          </Link>
        </div>

        <footer className="space-y-3 pb-6">
          <p className="text-xs text-muted-foreground/40 italic text-center">"{getRandomAffirmation()}"</p>
          <p className="text-xs text-muted-foreground/60 text-center">
            This dashboard shows aggregate data only. No individual experiences are identifiable.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Patterns;
