import { useState, useEffect } from "react";
import { useLocation, Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  ArrowLeft, RefreshCw, ChevronDown, Sparkles, ExternalLink, BookOpen,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { PatternMatch, AIAnalysisResult } from "@/lib/patterns";
import { getPatternByKey } from "@/lib/patterns";
import { PATTERN_ICONS } from "@/lib/patternIcons";
import { getSessionUserId } from "@/lib/journal-auth";

const PILL_BASE = "px-4 py-2.5 rounded-full text-xs sm:text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
const PILL_ACTIVE = "bg-primary text-primary-foreground";
const PILL_INACTIVE = "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground";

const CONFIDENCE_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  high: { label: "Strong match", variant: "default" },
  medium: { label: "Possible match", variant: "secondary" },
  low: { label: "Worth considering", variant: "outline" },
};

const RESOURCES = [
  { name: "RAINN", url: "https://rainn.org", desc: "Support for sexual violence" },
  { name: "National Domestic Violence Hotline", url: "https://thehotline.org", desc: "24/7 support for domestic violence" },
  { name: "UN Women", url: "https://unwomen.org", desc: "Global gender equality resources" },
  { name: "Crisis Text Line", url: "https://crisistextline.org", desc: "Text HOME to 741741 for free crisis support" },
];

const PatternCard = ({
  patternKey,
  title,
  explanation,
  personalizedText,
  confidence,
  examples,
  actions,
}: {
  patternKey: string;
  title: string;
  explanation: string;
  personalizedText: string;
  confidence: string;
  examples: string[];
  actions: string[];
}) => {
  const [open, setOpen] = useState(false);
  const conf = CONFIDENCE_LABELS[confidence] ?? CONFIDENCE_LABELS.low;

  return (
    <div className="rounded-2xl bg-card p-6 space-y-3 shadow-[var(--shadow-soft)] overflow-hidden">
      <div className="flex items-center gap-3">
        <span className="text-muted-foreground">{PATTERN_ICONS[patternKey]}</span>
        <h3 className="font-semibold text-foreground text-base">{title}</h3>
      </div>
      <Badge variant={conf.variant} className="text-xs rounded-full">{conf.label}</Badge>
      <p className="text-sm text-muted-foreground leading-relaxed break-words">{explanation}</p>
      {personalizedText && (
        <div className="border-t border-border/30 pt-3">
          <p className="text-xs font-medium text-muted-foreground mb-1">In your experience…</p>
          <p className="text-sm text-foreground/80 italic leading-relaxed break-words">{personalizedText}</p>
        </div>
      )}

      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <button
            aria-expanded={open}
            className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors pt-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
          >
            Learn more
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`} aria-hidden="true" />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-3">
          {examples.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">What this can look like</p>
              <ul className="space-y-1.5">
                {examples.map((ex, i) => (
                  <li key={i} className="text-sm text-foreground/70 leading-relaxed pl-3 border-l-2 border-primary/20 break-words">
                    "{ex}"
                  </li>
                ))}
              </ul>
            </div>
          )}
          {actions.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">What you can do</p>
              <ul className="space-y-1.5">
                {actions.map((act, i) => (
                  <li key={i} className="text-sm text-foreground/70 leading-relaxed pl-3 border-l-2 border-primary/20 break-words">
                    {act}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

const Results = () => {
  const location = useLocation();
  const state = location.state as {
    experienceId: string;
    matches: PatternMatch[];
    selfDoubtDetected: boolean;
    lowConfidence: boolean;
    aiResult?: AIAnalysisResult | null;
  } | null;

  const [resonated, setResonated] = useState<string | null>(null);
  const [contribute, setContribute] = useState<boolean | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [communityCount, setCommunityCount] = useState<{ pattern: string; title: string; count: number } | null>(null);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const { toast } = useToast();

  const ai = state?.aiResult;
  const useAI = ai && ai.patterns && ai.patterns.length > 0;

  const topPatternKey = useAI
    ? ai.patterns[0]?.key
    : state?.matches[0]?.pattern.key;
  const topPatternTitle = useAI
    ? (getPatternByKey(ai.patterns[0]?.key)?.title ?? ai.patterns[0]?.key)
    : state?.matches[0]?.pattern.title;

  useEffect(() => {
    document.title = "Your Reflection — Was I Too Sensitive?";
  }, []);

  useEffect(() => {
    if (!topPatternKey) return;
    const fetchCommunityCount = async () => {
      try {
        const { data, error } = await supabase.from("analyses").select("detected_patterns");
        if (error || !data) return;
        const count = data.filter((row) => {
          const patterns = row.detected_patterns;
          return Array.isArray(patterns) && patterns.includes(topPatternKey);
        }).length;
        if (count >= 3) {
          setCommunityCount({ pattern: topPatternKey, title: topPatternTitle ?? topPatternKey, count });
        }
      } catch {}
    };
    fetchCommunityCount();
  }, [topPatternKey, topPatternTitle]);

  if (!state) return <Navigate to="/reflect" replace />;

  const handleSubmitFeedback = async () => {
    try {
      if (resonated) {
        await supabase.from("user_feedback").insert({ experience_id: state.experienceId, resonated });
      }
      if (contribute === true) {
        await supabase.from("experiences").update({ contributed: true }).eq("id", state.experienceId);
      }
      setSubmitted(true);
      toast({ title: "Thank you for reflecting." });
    } catch {
      toast({ title: "Something went wrong.", variant: "destructive" });
    }
  };

  return (
    <div id="main-content" className="min-h-screen px-6 py-10" style={{ background: "var(--gradient-warm)" }}>
      <div className="max-w-2xl mx-auto space-y-12">
        <Link to="/reflect" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Back
        </Link>

        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl text-foreground tracking-tight">
            Possible patterns related to your experience
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            {state.lowConfidence
              ? "We weren't able to identify a specific pattern, but here are some common ones that may still be relevant."
              : "These are not definitive labels — they are concepts that may help you understand what happened."}
          </p>
        </div>

        {ai?.validationMessage && (
          <div className="rounded-2xl bg-primary/8 p-6">
            <p className="text-base text-foreground leading-relaxed">{ai.validationMessage}</p>
          </div>
        )}

        {state.selfDoubtDetected && (
          <div className="rounded-2xl bg-accent/50 p-6 space-y-2">
            <p className="text-sm font-medium text-foreground">Your description includes signs of self-doubt.</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              This is common when people experience subtle discrimination or boundary violations. Questioning yourself does not mean your experience wasn't real.
            </p>
          </div>
        )}

        {(useAI && ai.patterns.length === 0) || (!useAI && state.matches.length === 0) ? (
          <div className="rounded-2xl bg-card p-8 space-y-2 text-center shadow-[var(--shadow-soft)]">
            <p className="text-sm text-foreground leading-relaxed">
              We couldn't identify a specific pattern, but that doesn't mean your experience wasn't real. Sometimes experiences are complex and don't fit neat categories.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {useAI
              ? ai.patterns.map((aiMatch) => {
                  const pattern = getPatternByKey(aiMatch.key);
                  return (
                    <PatternCard
                      key={aiMatch.key}
                      patternKey={aiMatch.key}
                      title={pattern?.title ?? aiMatch.key}
                      explanation={pattern?.explanation ?? ""}
                      personalizedText={aiMatch.personalizedExplanation}
                      confidence={aiMatch.confidence}
                      examples={pattern?.examples ?? []}
                      actions={pattern?.actions ?? []}
                    />
                  );
                })
              : state.matches.map((match) => (
                  <PatternCard
                    key={match.pattern.key}
                    patternKey={match.pattern.key}
                    title={match.pattern.title}
                    explanation={match.pattern.explanation}
                    personalizedText={match.pattern.whyRelates}
                    confidence={match.confidence}
                    examples={match.pattern.examples}
                    actions={match.pattern.actions}
                  />
                ))}
          </div>
        )}

        {communityCount && (
          <div className="rounded-2xl bg-accent/40 p-5 text-center">
            <p className="text-sm text-foreground leading-relaxed">
              <span className="font-semibold">{communityCount.count}</span> other people have shared experiences involving{" "}
              <span className="font-medium">{communityCount.title}</span>.
              {" "}You are not alone in questioning this.
            </p>
          </div>
        )}

        <div className="rounded-2xl bg-card p-6 sm:p-8 space-y-4 shadow-[var(--shadow-soft)]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <h2 className="text-base font-medium text-foreground">Some things that might help</h2>
          </div>
          <ul className="space-y-3">
            <li className="text-sm text-muted-foreground leading-relaxed pl-3 border-l-2 border-primary/20">
              Journal about this experience — putting it into words can help you process what happened.
            </li>
            <li className="text-sm text-muted-foreground leading-relaxed pl-3 border-l-2 border-primary/20">
              Talk to someone you trust — a friend, family member, or counselor.
            </li>
            <li className="text-sm text-muted-foreground leading-relaxed pl-3 border-l-2 border-primary/20">
              Remember: questioning your experience doesn't make it less real.
            </li>
          </ul>
        </div>

        {!submitted ? (
          <div className="space-y-10 pt-4">
            <fieldset className="space-y-3 border-none p-0 m-0">
              <legend className="sr-only">Did any of these resonate with your experience?</legend>
              <p className="text-sm font-medium text-foreground" aria-hidden="true">Did any of these resonate with your experience?</p>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Did any of these resonate?">
                {["yes", "somewhat", "not really"].map((opt) => (
                  <button
                    key={opt}
                    role="radio"
                    aria-checked={resonated === opt}
                    onClick={() => setResonated(opt)}
                    className={`${PILL_BASE} ${resonated === opt ? PILL_ACTIVE : PILL_INACTIVE}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="space-y-3 border-none p-0 m-0">
              <legend className="sr-only">Would you like to anonymously contribute this experience?</legend>
              <p className="text-sm font-medium text-foreground" aria-hidden="true">
                Would you like to anonymously contribute this experience to help reveal broader patterns?
              </p>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Contribute anonymously?">
                {[
                  { label: "Yes", value: true },
                  { label: "No", value: false },
                ].map((opt) => (
                  <button
                    key={opt.label}
                    role="radio"
                    aria-checked={contribute === opt.value}
                    onClick={() => setContribute(opt.value)}
                    className={`${PILL_BASE} ${contribute === opt.value ? PILL_ACTIVE : PILL_INACTIVE}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Contributing means your anonymous pattern results and context selections (not your written description) will be included in aggregate statistics on the Patterns page.
              </p>
            </fieldset>

            <Button
              onClick={handleSubmitFeedback}
              disabled={!resonated}
              className="rounded-full px-8 h-12 text-base"
            >
              Submit reflection
            </Button>
          </div>
        ) : (
          <div className="rounded-2xl bg-accent/50 p-8 text-center space-y-4">
            <p className="text-foreground font-medium">Thank you for reflecting.</p>
            <p className="text-sm text-muted-foreground">You are not alone in questioning these experiences.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button asChild variant="outline" className="rounded-full">
                <Link to="/reflect" className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" aria-hidden="true" />
                  Reflect on another experience
                </Link>
              </Button>
              {!getSessionUserId() && (
                <Button asChild variant="ghost" className="rounded-full text-muted-foreground">
                  <Link to="/my-journal" className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" aria-hidden="true" />
                    Save to my journal
                  </Link>
                </Button>
              )}
            </div>
            {!getSessionUserId() && (
              <p className="text-xs text-muted-foreground/70">
                Want to keep track of your reflections over time? Create a private journal.
              </p>
            )}
          </div>
        )}

        <Collapsible open={resourcesOpen} onOpenChange={setResourcesOpen}>
          <CollapsibleTrigger asChild>
            <button
              aria-expanded={resourcesOpen}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
            >
              Resources
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${resourcesOpen ? "rotate-180" : ""}`} aria-hidden="true" />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3 space-y-2">
            {RESOURCES.map((r) => (
              <a
                key={r.url}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
              >
                <ExternalLink className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>
                  <span className="font-medium text-foreground/80">{r.name}</span>
                  {" — "}
                  {r.desc}
                </span>
              </a>
            ))}
          </CollapsibleContent>
        </Collapsible>

        <p className="text-xs text-muted-foreground/60 text-center pb-6">
          This tool does not provide legal, medical, or clinical advice.
        </p>
      </div>
    </div>
  );
};

export default Results;
