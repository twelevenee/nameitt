import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { analyzeExperience } from "@/lib/patterns";
import type { AIAnalysisResult } from "@/lib/patterns";
import { useToast } from "@/hooks/use-toast";

const WHERE_OPTIONS = ["workplace", "school", "public space", "relationship", "family", "online", "other"];
const FEELING_OPTIONS = ["confusing", "uncomfortable", "humiliating", "unsafe", "angry", "not sure"];
const DOUBT_OPTIONS = ["yes", "no", "not sure"];

const EXAMPLE_PROMPTS = [
  "Someone at work said something that felt off, but I can't explain why it bothered me",
  "I was told I was overreacting, but something about the situation didn't feel right",
  "Someone did something that seemed nice on the surface, but it left me feeling uncomfortable",
];

const PillSelect = ({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string | null;
  onChange: (v: string | null) => void;
}) => (
  <div className="space-y-3">
    <p className="text-sm font-medium text-foreground">{label}</p>
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(value === opt ? null : opt)}
          className={`px-4 py-2 rounded-full text-sm transition-all border ${
            value === opt
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  </div>
);

const PillMultiSelect = ({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string[];
  onChange: (v: string[]) => void;
}) => (
  <div className="space-y-3">
    <p className="text-sm font-medium text-foreground">{label}</p>
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const selected = value.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() =>
              onChange(selected ? value.filter((v) => v !== opt) : [...value, opt])
            }
            className={`px-4 py-2 rounded-full text-sm transition-all border ${
              selected
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  </div>
);

const RevealSection = ({
  visible,
  children,
  onSkip,
}: {
  visible: boolean;
  children: React.ReactNode;
  onSkip?: () => void;
}) => (
  <div
    className={`transition-all duration-300 ease-out ${
      visible
        ? "opacity-100 translate-y-0 max-h-[500px]"
        : "opacity-0 translate-y-4 max-h-0 overflow-hidden pointer-events-none"
    }`}
  >
    <div className="relative">
      {children}
      {onSkip && visible && (
        <button
          type="button"
          onClick={onSkip}
          className="absolute top-0 right-0 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip
        </button>
      )}
    </div>
  </div>
);

const Reflect = () => {
  const [description, setDescription] = useState("");
  const [where, setWhere] = useState<string | null>(null);
  const [feelings, setFeelings] = useState<string[]>([]);
  const [doubt, setDoubt] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Progressive reveal state
  const [showWhere, setShowWhere] = useState(false);
  const [showFeelings, setShowFeelings] = useState(false);
  const [showDoubt, setShowDoubt] = useState(false);
  const [showSubmit, setShowSubmit] = useState(false);

  const charCount = description.trim().length;

  // Progressive reveal logic
  useEffect(() => {
    if (charCount >= 20 && !showWhere) setShowWhere(true);
  }, [charCount, showWhere]);

  useEffect(() => {
    if (where !== null && !showFeelings) setShowFeelings(true);
  }, [where, showFeelings]);

  useEffect(() => {
    if (feelings.length > 0 && !showDoubt) setShowDoubt(true);
  }, [feelings, showDoubt]);

  useEffect(() => {
    if (doubt !== null && !showSubmit) setShowSubmit(true);
  }, [doubt, showSubmit]);

  const handleSkipWhere = () => {
    setShowFeelings(true);
  };
  const handleSkipFeelings = () => {
    setShowDoubt(true);
  };
  const handleSkipDoubt = () => {
    setShowSubmit(true);
  };

  const encouragementText = charCount >= 100
    ? "Thank you for sharing. Add as much or as little detail as you'd like."
    : charCount >= 20
    ? "You're doing great. Take your time."
    : null;

  const handleSubmit = async () => {
    if (!description.trim()) {
      toast({ title: "Please describe your experience", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const feelingStr = feelings.length > 0 ? feelings.join(", ") : undefined;
      const experienceId = crypto.randomUUID();

      // Try AI analysis first
      let aiResult: AIAnalysisResult | null = null;
      try {
        const { data, error } = await supabase.functions.invoke("analyze-experience", {
          body: {
            description: description.trim(),
            contextWhere: where,
            contextFeeling: feelingStr,
            selfDoubt: doubt,
          },
        });
        if (!error && data && data.patterns) {
          aiResult = data as AIAnalysisResult;
        }
      } catch {
        console.warn("AI analysis failed, falling back to local analysis");
      }

      // Fallback to local analysis
      const localAnalysis = analyzeExperience(description, where ?? undefined, feelingStr);

      // Store experience
      const { error: expErr } = await supabase
        .from("experiences")
        .insert({
          id: experienceId,
          description: description.trim(),
          context_where: where,
          context_feeling: feelings.length > 0 ? feelings.join(", ") : null,
          self_doubt: doubt,
        });

      if (expErr) throw expErr;

      // Store analysis
      const detectedPatterns = aiResult
        ? aiResult.patterns.map((p) => p.key)
        : localAnalysis.matches.map((m) => m.pattern.key);
      const selfDoubtDetected = aiResult
        ? aiResult.selfDoubtDetected
        : localAnalysis.selfDoubtDetected;

      const { error: anaErr } = await supabase.from("analyses").insert({
        experience_id: experienceId,
        detected_patterns: detectedPatterns as unknown as import("@/integrations/supabase/types").Json,
        self_doubt_detected: selfDoubtDetected,
      });

      if (anaErr) throw anaErr;

      navigate("/results", {
        state: {
          experienceId,
          matches: localAnalysis.matches,
          selfDoubtDetected,
          lowConfidence: aiResult ? false : localAnalysis.lowConfidence,
          aiResult,
        },
      });
    } catch {
      toast({ title: "Something went wrong. Please try again.", variant: "destructive" });
      setSubmitting(false);
    }
  };

  if (submitting) {
    return (
      <div className="min-h-screen px-6 py-10 flex items-center justify-center" style={{ background: "var(--gradient-warm)" }}>
        <div className="text-center space-y-6 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
            <Heart className="w-8 h-8 text-primary animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]" />
          </div>
          <div className="space-y-2">
            <p className="text-lg text-foreground font-medium">
              Taking a moment to understand your experience…
            </p>
            <p className="text-sm text-muted-foreground">
              This usually takes a few seconds
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-10" style={{ background: "var(--gradient-warm)" }}>
      <div className="max-w-2xl mx-auto space-y-10">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl text-foreground">What happened?</h1>
          <p className="text-muted-foreground">
            Describe the experience in your own words. There are no wrong answers.
          </p>
        </div>

        <div className="space-y-8">
          {/* Example prompts */}
          {charCount === 0 && (
            <div className="space-y-2 animate-fade-in">
              <p className="text-xs text-muted-foreground">Not sure where to start? Try one of these:</p>
              <div className="flex flex-col gap-2">
                {EXAMPLE_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => setDescription(prompt)}
                    className="text-left px-4 py-2.5 rounded-xl text-sm text-muted-foreground border border-dashed border-border/60 hover:border-primary/40 hover:text-foreground transition-all bg-transparent"
                  >
                    "{prompt}"
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Textarea
              placeholder="Tell us what happened…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[180px] text-base bg-card/80 backdrop-blur-sm border-border/60 rounded-2xl p-5 resize-none focus:ring-primary/30"
            />
            {/* Encouragement text */}
            {encouragementText && (
              <p className="text-xs text-muted-foreground animate-fade-in pl-1">
                {encouragementText}
              </p>
            )}
          </div>

          <RevealSection visible={showWhere} onSkip={handleSkipWhere}>
            <PillSelect label="Where did it happen?" options={WHERE_OPTIONS} value={where} onChange={setWhere} />
          </RevealSection>

          <RevealSection visible={showFeelings} onSkip={handleSkipFeelings}>
            <PillMultiSelect label="How did it feel? (select all that apply)" options={FEELING_OPTIONS} value={feelings} onChange={setFeelings} />
          </RevealSection>

          <RevealSection visible={showDoubt} onSkip={handleSkipDoubt}>
            <PillSelect label="Did you doubt yourself?" options={DOUBT_OPTIONS} value={doubt} onChange={setDoubt} />
          </RevealSection>

          <RevealSection visible={showSubmit}>
            <Button
              onClick={handleSubmit}
              disabled={!description.trim()}
              size="lg"
              className="rounded-full px-8 h-12 text-base w-full sm:w-auto"
            >
              <Send className="w-4 h-4" />
              Reflect
            </Button>
          </RevealSection>
        </div>

        <p className="text-xs text-muted-foreground">
          Your entry is stored anonymously. No account is required. This is not legal or clinical advice.
        </p>
      </div>
    </div>
  );
};

export default Reflect;
