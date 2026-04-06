import { useState, useEffect } from "react";
import { useLocation, Link, Navigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  ArrowLeft, RefreshCw, AlertTriangle, Heart, Shield, Eye, Users,
  MessageCircle, Zap, ChevronDown, Sparkles, ExternalLink,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { PatternMatch, AIAnalysisResult } from "@/lib/patterns";
import { getPatternByKey } from "@/lib/patterns";

const PATTERN_ICONS: Record<string, React.ReactNode> = {
  emotional_invalidation: <MessageCircle className="w-5 h-5" />,
  benevolent_sexism: <Heart className="w-5 h-5" />,
  gender_role_expectation: <Users className="w-5 h-5" />,
  objectification: <Eye className="w-5 h-5" />,
  harassment: <AlertTriangle className="w-5 h-5" />,
  public_intimidation: <Zap className="w-5 h-5" />,
  safety_threat: <Shield className="w-5 h-5" />,
};

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
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm shadow-sm rounded-2xl">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center gap-3 text-primary">
          {PATTERN_ICONS[patternKey]}
          <h3 className="font-semibold text-foreground font-sans text-base">{title}</h3>
        </div>
        <Badge variant={conf.variant} className="text-xs">{conf.label}</Badge>
        <p className="text-sm text-muted-foreground leading-relaxed">{explanation}</p>
        {personalizedText && (
          <div className="border-t border-border/40 pt-3">
            <p className="text-xs font-medium text-muted-foreground mb-1">In your experience…</p>
            <p className="text-sm text-foreground/80 italic leading-relaxed">{personalizedText}</p>
          </div>
        )}

        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors pt-1">
              Learn more
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-3">
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
            {actions.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">What you can do</p>
                <ul className="space-y-1.5">
                  {actions.map((act, i) => (
                    <li key={i} className="text-sm text-foreground/70 leading-relaxed pl-3 border-l-2 border-accent-foreground/20">
                      {act}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
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

  // Get the top pattern key for the "you're not alone" query
  const topPatternKey = useAI
    ? ai.patterns[0]?.key
    : state?.matches[0]?.pattern.key;
  const topPatternTitle = useAI
    ? (getPatternByKey(ai.patterns[0]?.key)?.title ?? ai.patterns[0]?.key)
    : state?.matches[0]?.pattern.title;

  useEffect(() => {
    if (!topPatternKey) return;

    const fetchCommunityCount = async () => {
      try {
        const { data, error } = await supabase
          .from("analyses")
          .select("detected_patterns");

        if (error || !data) return;

        const count = data.filter((row) => {
          const patterns = row.detected_patterns;
          if (Array.isArray(patterns)) {
            return patterns.includes(topPatternKey);
          }
          return false;
        }).length;

        if (count >= 3) {
          setCommunityCount({ pattern: topPatternKey, title: topPatternTitle ?? topPatternKey, count });
        }
      } catch {
        // Silently fail — this is supplementary
      }
    };

    fetchCommunityCount();
  }, [topPatternKey, topPatternTitle]);

  if (!state) return <Navigate to="/reflect" replace />;

  const handleSubmitFeedback = async () => {
    try {
      if (resonated) {
        await supabase.from("user_feedback").insert({
          experience_id: state.experienceId,
          resonated,
        });
      }
      if (contribute === true) {
        await supabase
          .from("experiences")
          .update({ contributed: true })
          .eq("id", state.experienceId);
      }
      setSubmitted(true);
      toast({ title: "Thank you for reflecting." });
    } catch {
      toast({ title: "Something went wrong.", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen px-6 py-10" style={{ background: "var(--gradient-warm)" }}>
      <div className="max-w-2xl mx-auto space-y-10">
        <Link to="/reflect" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl text-foreground">
            Possible patterns related to your experience
          </h1>
          <p className="text-muted-foreground">
            {state.lowConfidence
              ? "We weren't able to identify a specific pattern, but here are some common ones that may still be relevant."
              : "These are not definitive labels — they are concepts that may help you understand what happened."}
          </p>
        </div>

        {/* AI validation message */}
        {ai?.validationMessage && (
          <div className="rounded-2xl bg-primary/10 border border-primary/20 p-5">
            <p className="text-sm text-foreground leading-relaxed">{ai.validationMessage}</p>
          </div>
        )}

        {state.selfDoubtDetected && (
          <div className="rounded-2xl bg-accent/60 border border-border/50 p-5 space-y-2">
            <p className="text-sm font-medium text-foreground">
              Your description includes signs of self-doubt.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              This is common when people experience subtle discrimination or boundary violations. Questioning yourself does not mean your experience wasn't real.
            </p>
          </div>
        )}

        {/* Pattern cards */}
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

        {/* You're not alone */}
        {communityCount && (
          <div className="rounded-2xl bg-accent/40 border border-border/40 p-5 text-center">
            <p className="text-sm text-foreground leading-relaxed">
              <span className="font-semibold">{communityCount.count}</span> other people have shared experiences involving{" "}
              <span className="font-medium">{communityCount.title}</span>.
              {" "}You are not alone in questioning this.
            </p>
          </div>
        )}

        {/* Gentle next steps */}
        <div className="rounded-2xl bg-card/60 backdrop-blur-sm border border-border/40 p-6 space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="w-4 h-4" />
            <h2 className="text-base font-medium text-foreground font-sans">Some things that might help</h2>
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

        {/* Feedback / contribute */}
        {!submitted ? (
          <div className="space-y-8 pt-4">
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">Did any of these resonate with your experience?</p>
              <div className="flex gap-2">
                {["yes", "somewhat", "not really"].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setResonated(opt)}
                    className={`px-4 py-2 rounded-full text-sm border transition-all ${
                      resonated === opt
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-muted-foreground border-border hover:border-primary/40"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">
                Would you like to anonymously contribute this experience to help reveal broader patterns?
              </p>
              <div className="flex gap-2">
                {[
                  { label: "Yes", value: true },
                  { label: "No", value: false },
                ].map((opt) => (
                  <button
                    key={opt.label}
                    onClick={() => setContribute(opt.value)}
                    className={`px-4 py-2 rounded-full text-sm border transition-all ${
                      contribute === opt.value
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-muted-foreground border-border hover:border-primary/40"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleSubmitFeedback}
              disabled={!resonated}
              className="rounded-full px-8 h-12 text-base"
            >
              Submit reflection
            </Button>
          </div>
        ) : (
          <div className="rounded-2xl bg-accent/60 border border-border/50 p-6 text-center space-y-4">
            <p className="text-foreground font-medium">Thank you for reflecting.</p>
            <p className="text-sm text-muted-foreground">You are not alone in questioning these experiences.</p>
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/reflect" className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Reflect on another experience
              </Link>
            </Button>
          </div>
        )}

        {/* Resources */}
        <Collapsible open={resourcesOpen} onOpenChange={setResourcesOpen}>
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              Resources
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${resourcesOpen ? "rotate-180" : ""}`} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3 space-y-2">
            {RESOURCES.map((r) => (
              <a
                key={r.url}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                <span>
                  <span className="font-medium text-foreground/80">{r.name}</span>
                  {" — "}
                  {r.desc}
                </span>
              </a>
            ))}
          </CollapsibleContent>
        </Collapsible>

        <p className="text-xs text-muted-foreground text-center pb-6">
          This tool does not provide legal, medical, or clinical advice.
        </p>
      </div>
    </div>
  );
};

export default Results;
