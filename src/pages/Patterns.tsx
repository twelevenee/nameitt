import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, Brain, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PATTERNS } from "@/lib/patterns";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

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
  totalExperiences: number;
}

const Patterns = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get contributed experiences
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

        // Get analyses for contributed experiences
        const { data: analyses } = await supabase
          .from("analyses")
          .select("detected_patterns, self_doubt_detected")
          .in("experience_id", expIds);

        // Count patterns
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

        // Count contexts
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

        {loading ? (
          <p className="text-muted-foreground text-center py-20">Loading patterns…</p>
        ) : !stats || stats.totalExperiences === 0 ? (
          <div className="text-center py-20 space-y-4">
            <p className="text-muted-foreground">No contributed experiences yet.</p>
            <Button asChild className="rounded-full">
              <Link to="/reflect">Be the first to reflect</Link>
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
                  <p className="text-xl font-semibold text-foreground font-sans">{stats.topPattern}</p>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-border/50 bg-card/80 backdrop-blur-sm">
                <CardContent className="p-5 space-y-2">
                  <div className="flex items-center gap-2 text-primary">
                    <Brain className="w-4 h-4" />
                    <span className="text-xs font-medium uppercase tracking-wide">Self-Doubt Detected</span>
                  </div>
                  <p className="text-xl font-semibold text-foreground font-sans">{stats.selfDoubtPercent}%</p>
                  <p className="text-xs text-muted-foreground">of shared experiences</p>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-border/50 bg-card/80 backdrop-blur-sm">
                <CardContent className="p-5 space-y-2">
                  <div className="flex items-center gap-2 text-primary">
                    <MapPin className="w-4 h-4" />
                    <span className="text-xs font-medium uppercase tracking-wide">Most Common Context</span>
                  </div>
                  <p className="text-xl font-semibold text-foreground font-sans capitalize">{stats.topContext}</p>
                </CardContent>
              </Card>
            </div>

            {stats.patternCounts.length > 0 && (
              <Card className="rounded-2xl border-border/50 bg-card/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold text-foreground mb-4 font-sans">Reported Patterns</h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={stats.patternCounts} layout="vertical" margin={{ left: 20 }}>
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
                        {stats.patternCounts.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
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
