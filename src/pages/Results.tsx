import { useState } from "react";
import { useLocation, Link, Navigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, RefreshCw, AlertTriangle, Heart, Shield, Eye, Users, MessageCircle, Zap } from "lucide-react";
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
  const { toast } = useToast();

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

  const ai = state.aiResult;
  const useAI = ai && ai.patterns && ai.patterns.length > 0;

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

        <div className="grid gap-4 sm:grid-cols-2">
          {useAI
            ? ai.patterns.map((aiMatch) => {
                const pattern = getPatternByKey(aiMatch.key);
                const conf = CONFIDENCE_LABELS[aiMatch.confidence] ?? CONFIDENCE_LABELS.low;
                return (
                  <Card key={aiMatch.key} className="border-border/50 bg-card/80 backdrop-blur-sm shadow-sm rounded-2xl">
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-center gap-3 text-primary">
                        {PATTERN_ICONS[aiMatch.key]}
                        <h3 className="font-semibold text-foreground font-sans text-base">
                          {pattern?.title ?? aiMatch.key}
                        </h3>
                      </div>
                      <Badge variant={conf.variant} className="text-xs">{conf.label}</Badge>
                      {pattern && (
                        <p className="text-sm text-muted-foreground leading-relaxed">{pattern.explanation}</p>
                      )}
                      <div className="border-t border-border/40 pt-3">
                        <p className="text-xs font-medium text-muted-foreground mb-1">In your experience…</p>
                        <p className="text-sm text-foreground/80 italic leading-relaxed">
                          {aiMatch.personalizedExplanation}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            : state.matches.map((match) => {
                const conf = CONFIDENCE_LABELS[match.confidence] ?? CONFIDENCE_LABELS.low;
                return (
                  <Card key={match.pattern.key} className="border-border/50 bg-card/80 backdrop-blur-sm shadow-sm rounded-2xl">
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-center gap-3 text-primary">
                        {PATTERN_ICONS[match.pattern.key]}
                        <h3 className="font-semibold text-foreground font-sans text-base">{match.pattern.title}</h3>
                      </div>
                      <Badge variant={conf.variant} className="text-xs">{conf.label}</Badge>
                      <p className="text-sm text-muted-foreground leading-relaxed">{match.pattern.explanation}</p>
                      <p className="text-sm text-foreground/80 italic leading-relaxed">{match.pattern.whyRelates}</p>
                    </CardContent>
                  </Card>
                );
              })}
        </div>

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

        <p className="text-xs text-muted-foreground text-center pb-6">
          This tool does not provide legal, medical, or clinical advice.
        </p>
      </div>
    </div>
  );
};

export default Results;
