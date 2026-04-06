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
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const CHART_COLORS = [
  "hsl(320, 25%, 45%)",
  "hsl(270, 20%, 55%)",
  "hsl(280, 15%, 65%)",
  "hsl(30, 25%, 60%)",
  "hsl(320, 20%, 60%)",
  "hsl(270, 15%, 50%)",
  "hsl(280, 10%, 70%)",
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
    <Card className="rounded-2xl border-border/50 bg-card/80 backdrop-blur-sm">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <button className="w-full text-left">
            <CardContent className="p-5 flex items-center gap-3">
              <span className="text-primary shrink-0">{PATTERN_ICONS[patternKey]}</span>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground font-sans text-base">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mt-1 line-clamp-2">{explanation}</p>
              </div>
              <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
            </CardContent>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-5 pb-5 space-y-4">
            {examples.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">What this can look like</p>
                <ul className="space-y-1.5">
                  {examples.map((ex, i) => (
                    <li key={i} className="text-sm text-foreground/70 leading-relaxed pl-3 border-l-2 border-primary/20">
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
    </Card>
  );
};

const Patterns = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="min-h-screen px-6 py-10" style={{ background: "var(--gradient-warm)" }}>
      <div className="max-w-3xl mx-auto space-y-10">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl text-foreground">Anonymous Patterns</h1>
          <p className="text-muted-foreground">
            Based on anonymous, voluntarily shared experiences. No personal details are displayed.
          </p>
        </div>

        {/* Why this matters */}
        <p className="text-sm text-muted-foreground leading-relaxed">
          Many people experience subtle forms of discrimination but struggle to name what happened. Research shows these experiences are widespread — seeing the patterns can help you recognize that what you felt was real.
        </p>

        {loading ? (
          <p className="text-muted-foreground text-center py-20">Loading patterns…</p>
        ) : (
          <>
            {/* Understanding the Patterns — always visible */}
            <div className="space-y-4">
              <h2 className="text-2xl text-foreground">Understanding the Patterns</h2>
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

            {/* What People Are Sharing */}
            <div className="space-y-4">
              <h2 className="text-2xl text-foreground">What People Are Sharing</h2>

              {!hasData ? (
                <div className="rounded-2xl bg-card/60 backdrop-blur-sm border border-border/40 p-8 text-center space-y-4">
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
                    As more people choose to share their anonymous reflections, patterns will appear here. Every contribution helps others feel less alone.
                  </p>
                  <Button asChild className="rounded-full">
                    <Link to="/reflect" className="inline-flex items-center gap-2">
                      <Send className="w-4 h-4" />
                      Share your reflection
                    </Link>
                  </Button>
                </div>
              ) : (
                <>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Card className="rounded-2xl border-border/50 bg-card/80 backdrop-blur-sm">
                      <CardContent className="p-5 space-y-2">
                        <div className="flex items-center gap-2 text-primary">
                          <TrendingUp className="w-4 h-4" />
                          <span className="text-xs font-medium uppercase tracking-wide">Most Common Pattern</span>
                        </div>
                        <p className="text-xl font-semibold text-foreground font-sans">{stats!.topPattern}</p>
                      </CardContent>
                    </Card>

                    <Card className="rounded-2xl border-border/50 bg-card/80 backdrop-blur-sm">
                      <CardContent className="p-5 space-y-2">
                        <div className="flex items-center gap-2 text-primary">
                          <Brain className="w-4 h-4" />
                          <span className="text-xs font-medium uppercase tracking-wide">Self-Doubt Detected</span>
                        </div>
                        <p className="text-xl font-semibold text-foreground font-sans">{stats!.selfDoubtPercent}%</p>
                        <p className="text-xs text-muted-foreground">of shared experiences</p>
                      </CardContent>
                    </Card>

                    <Card className="rounded-2xl border-border/50 bg-card/80 backdrop-blur-sm">
                      <CardContent className="p-5 space-y-2">
                        <div className="flex items-center gap-2 text-primary">
                          <MapPin className="w-4 h-4" />
                          <span className="text-xs font-medium uppercase tracking-wide">Most Common Context</span>
                        </div>
                        <p className="text-xl font-semibold text-foreground font-sans capitalize">{stats!.topContext}</p>
                      </CardContent>
                    </Card>
                  </div>

                  {showChart && stats!.patternCounts.length > 0 && (
                    <Card className="rounded-2xl border-border/50 bg-card/80 backdrop-blur-sm">
                      <CardContent className="p-6 space-y-4">
                        <h3 className="text-sm font-medium text-muted-foreground">
                          Most frequently identified patterns across all shared experiences
                        </h3>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={stats!.patternCounts} layout="vertical" margin={{ left: 20 }}>
                            <XAxis type="number" hide />
                            <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 12, fill: "hsl(280, 8%, 50%)" }} />
                            <Tooltip
                              contentStyle={{
                                background: "hsl(30, 20%, 99%)",
                                border: "1px solid hsl(280, 10%, 88%)",
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
                        <p className="text-xs text-muted-foreground text-center">
                          Based on {stats!.totalExperiences} anonymously shared {stats!.totalExperiences === 1 ? "experience" : "experiences"}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>
          </>
        )}

        <p className="text-xs text-muted-foreground text-center pb-6">
          This dashboard shows aggregate data only. No individual experiences are identifiable.
        </p>
      </div>
    </div>
  );
};

export default Patterns;
