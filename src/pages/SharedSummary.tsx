import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Heart } from "lucide-react";
import CrisisResourceList from "@/components/CrisisResourceList";
import { supabase } from "@/integrations/supabase/client";
import { getPatternByKey } from "@/lib/patterns";
import { PATTERN_ICONS } from "@/lib/patternIcons";

// Resources now come from CrisisResourceList component

interface SummaryData {
  date: string;
  contextWhere: string | null;
  contextFeeling: string | null;
  patterns: { key: string; title: string; explanation: string; confidence: string }[];
  validationMessage: string | null;
}

const SharedSummary = () => {
  const { id } = useParams<{ id: string }>();
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [expired, setExpired] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Shared Reflection — Was I Too Sensitive?";
    const fetch = async () => {
      if (!id) { setLoading(false); return; }
      const { data, error } = await supabase
        .from("shared_summaries")
        .select("summary_data, expires_at")
        .eq("id", id)
        .maybeSingle();

      if (error || !data) {
        setExpired(true);
      } else {
        setSummary(data.summary_data as unknown as SummaryData);
      }
      setLoading(false);
    };
    fetch();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--gradient-warm)" }}>
        <p className="text-muted-foreground" role="status">Loading…</p>
      </div>
    );
  }

  if (expired || !summary) {
    return (
      <div className="min-h-screen px-6 py-16 flex items-center justify-center" style={{ background: "var(--gradient-warm)" }}>
        <div className="max-w-md text-center space-y-4">
          <Heart className="w-8 h-8 text-muted-foreground mx-auto" aria-hidden="true" />
          <h1 className="text-2xl text-foreground tracking-tight">This reflection summary has expired</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            For privacy, shared reflections are only available for 7 days. If someone shared this with you, please reach out to them directly.
          </p>
          <Link to="/" className="text-sm text-primary hover:text-primary/80 transition-colors">
            Learn about this tool
          </Link>
        </div>
      </div>
    );
  }

  const date = new Date(summary.date);

  return (
    <div id="main-content" className="min-h-screen px-6 py-10" style={{ background: "var(--gradient-warm)" }}>
      <div className="max-w-2xl mx-auto space-y-10">
        <div className="space-y-3 text-center">
          <Heart className="w-8 h-8 text-primary mx-auto" aria-hidden="true" />
          <h1 className="text-2xl sm:text-3xl text-foreground tracking-tight">
            Someone you care about shared this reflection with you
          </h1>
          <p className="text-xs text-muted-foreground">
            {date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        {summary.validationMessage && (
          <div className="rounded-2xl bg-primary/8 p-6">
            <p className="text-base text-foreground leading-relaxed">{summary.validationMessage}</p>
          </div>
        )}

        {(summary.contextWhere || summary.contextFeeling) && (
          <div className="flex flex-wrap gap-2 justify-center">
            {summary.contextWhere && <Badge variant="secondary" className="rounded-full">{summary.contextWhere}</Badge>}
            {summary.contextFeeling?.split(", ").map((f) => (
              <Badge key={f} variant="secondary" className="rounded-full">{f}</Badge>
            ))}
          </div>
        )}

        {summary.patterns.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-base font-medium text-foreground text-center">Patterns identified</h2>
            <div className="space-y-3">
              {summary.patterns.map((p) => {
                const pat = getPatternByKey(p.key);
                return (
                  <div key={p.key} className="rounded-2xl bg-card p-5 space-y-2 shadow-[var(--shadow-soft)]">
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground">{PATTERN_ICONS[p.key]}</span>
                      <h3 className="font-semibold text-foreground text-base">{p.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{pat?.explanation ?? p.explanation}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="rounded-2xl bg-card p-6 sm:p-8 space-y-4 shadow-[var(--shadow-soft)]">
          <h2 className="text-base font-medium text-foreground">
            If they've come to you with this, they trust you
          </h2>
          <p className="text-sm text-muted-foreground mb-2">Here are some ways to be supportive:</p>
          <ul className="space-y-3">
            <li className="text-sm text-muted-foreground leading-relaxed pl-3 border-l-2 border-primary/20">
              <span className="font-medium text-foreground/80">Listen without judgment</span> — they may still be processing what happened
            </li>
            <li className="text-sm text-muted-foreground leading-relaxed pl-3 border-l-2 border-primary/20">
              <span className="font-medium text-foreground/80">Believe them</span> — self-doubt is common in these situations
            </li>
            <li className="text-sm text-muted-foreground leading-relaxed pl-3 border-l-2 border-primary/20">
              <span className="font-medium text-foreground/80">Ask how you can help</span> — don't assume what they need
            </li>
          </ul>
        </div>

        <div className="rounded-2xl bg-accent/40 p-5 text-center">
          <p className="text-xs text-muted-foreground leading-relaxed">
            This summary was created using an anonymous reflection tool. The person sharing this with you is looking for support.
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium">Resources</p>
          {RESOURCES.map((r) => (
            <a key={r.url} href={r.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ExternalLink className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span><span className="font-medium text-foreground/80">{r.name}</span> — {r.desc}</span>
            </a>
          ))}
        </div>

        <p className="text-xs text-muted-foreground/60 text-center pb-6">
          This tool does not provide legal, medical, or clinical advice.
        </p>
      </div>
    </div>
  );
};

export default SharedSummary;
