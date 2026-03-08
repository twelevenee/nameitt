import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { analyzeExperience } from "@/lib/patterns";
import { useToast } from "@/hooks/use-toast";

const WHERE_OPTIONS = ["workplace", "school", "public space", "relationship", "family", "online", "other"];
const FEELING_OPTIONS = ["confusing", "uncomfortable", "humiliating", "unsafe", "angry", "not sure"];
const DOUBT_OPTIONS = ["yes", "no", "not sure"];

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

const Reflect = () => {
  const [description, setDescription] = useState("");
  const [where, setWhere] = useState<string | null>(null);
  const [feeling, setFeeling] = useState<string | null>(null);
  const [doubt, setDoubt] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!description.trim()) {
      toast({ title: "Please describe your experience", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const analysis = analyzeExperience(description, where ?? undefined, feeling ?? undefined);

      const { data: exp, error: expErr } = await supabase
        .from("experiences")
        .insert({
          description: description.trim(),
          context_where: where,
          context_feeling: feeling,
          self_doubt: doubt,
        })
        .select("id")
        .single();

      if (expErr) throw expErr;

      const { error: anaErr } = await supabase.from("analyses").insert({
        experience_id: exp.id,
        detected_patterns: analysis.patterns.map((p) => p.key),
        self_doubt_detected: analysis.selfDoubtDetected,
      });

      if (anaErr) throw anaErr;

      navigate("/results", {
        state: {
          experienceId: exp.id,
          patterns: analysis.patterns,
          selfDoubtDetected: analysis.selfDoubtDetected,
        },
      });
    } catch {
      toast({ title: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

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
          <Textarea
            placeholder="Tell us what happened…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[180px] text-base bg-card/80 backdrop-blur-sm border-border/60 rounded-2xl p-5 resize-none focus:ring-primary/30"
          />

          <PillSelect label="Where did it happen?" options={WHERE_OPTIONS} value={where} onChange={setWhere} />
          <PillSelect label="How did it feel?" options={FEELING_OPTIONS} value={feeling} onChange={setFeeling} />
          <PillSelect label="Did you doubt yourself?" options={DOUBT_OPTIONS} value={doubt} onChange={setDoubt} />

          <Button
            onClick={handleSubmit}
            disabled={submitting || !description.trim()}
            size="lg"
            className="rounded-full px-8 h-12 text-base w-full sm:w-auto"
          >
            {submitting ? "Analyzing…" : (
              <>
                <Send className="w-4 h-4" />
                Reflect
              </>
            )}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Your entry is stored anonymously. No account is required. This is not legal or clinical advice.
        </p>
      </div>
    </div>
  );
};

export default Reflect;
