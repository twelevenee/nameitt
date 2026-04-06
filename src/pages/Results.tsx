import { useState, useEffect } from "react";
import { useLocation, Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  ArrowLeft, RefreshCw, ChevronDown, Sparkles, ExternalLink, BookOpen,
  Copy, Check, Shield, Share2, Link as LinkIcon, BookText,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { PatternMatch, AIAnalysisResult } from "@/lib/patterns";
import { getPatternByKey } from "@/lib/patterns";
import { PATTERN_ICONS } from "@/lib/patternIcons";
import { getSessionUserId } from "@/lib/journal-auth";
import { FALLBACK_SCRIPTS } from "@/lib/fallback-scripts";
import type { Script } from "@/lib/fallback-scripts";
import { getRandomAffirmation, getValidationAffirmation, AFFIRMATIONS } from "@/lib/affirmations";
import { WarmBlobs, GentleWave } from "@/components/Illustrations";
import { getResearchStat } from "@/lib/research-stats";

const LoadingAffirmation = () => {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % AFFIRMATIONS.length), 3000);
    return () => clearInterval(t);
  }, []);
  return (
    <p className="text-sm text-muted-foreground/60 italic transition-opacity duration-500">
      "{AFFIRMATIONS[idx]}"
    </p>
  );
};

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

const TONE_BG: Record<string, string> = {
  "Gentle but firm": "bg-[hsl(220,30%,96%)]",
  "Direct and clear": "bg-[hsl(35,20%,96%)]",
  "De-escalation focused": "bg-[hsl(140,20%,96%)]",
};

const PatternCard = ({
  patternKey, title, explanation, personalizedText, confidence, examples, actions,
}: {
  patternKey: string; title: string; explanation: string; personalizedText: string;
  confidence: string; examples: string[]; actions: string[];
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
          <button aria-expanded={open} className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors pt-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded">
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
                  <li key={i} className="text-sm text-foreground/70 leading-relaxed pl-3 border-l-2 border-primary/20 break-words">"{ex}"</li>
                ))}
              </ul>
            </div>
          )}
          {actions.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">What you can do</p>
              <ul className="space-y-1.5">
                {actions.map((act, i) => (
                  <li key={i} className="text-sm text-foreground/70 leading-relaxed pl-3 border-l-2 border-primary/20 break-words">{act}</li>
                ))}
              </ul>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

// --- Script Card ---
const ScriptCard = ({ script }: { script: Script }) => {
  const [copied, setCopied] = useState(false);
  const bg = TONE_BG[script.tone] ?? "bg-secondary/30";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(script.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`rounded-2xl ${bg} p-5 space-y-3 flex flex-col`}>
      <Badge variant="outline" className="rounded-full text-[10px] w-fit">{script.tone}</Badge>
      <p className="text-sm font-medium text-foreground leading-relaxed flex-1">"{script.text}"</p>
      <p className="text-xs text-muted-foreground leading-relaxed">{script.why}</p>
      <button
        onClick={handleCopy}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors self-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
      >
        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
        {copied ? "Copied" : "Copy"}
      </button>
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
    contextWhere?: string;
    contextFeeling?: string;
  } | null;

  const [resonated, setResonated] = useState<string | null>(null);
  const [contribute, setContribute] = useState<boolean | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [communityCount, setCommunityCount] = useState<{ pattern: string; title: string; count: number } | null>(null);
  const [resourcesOpen, setResourcesOpen] = useState(false);

  // Scripts state
  const [scripts, setScripts] = useState<Script[] | null>(null);
  const [safetyNote, setSafetyNote] = useState<string | null>(null);
  const [scriptsLoading, setScriptsLoading] = useState(false);
  const [scriptsFallback, setScriptsFallback] = useState(false);

  // Share state
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  // Story counts per pattern
  const [storyCounts, setStoryCounts] = useState<Record<string, number>>({});

  const { toast } = useToast();

  const ai = state?.aiResult;
  const useAI = ai && ai.patterns && ai.patterns.length > 0;

  const patternKeys = useAI
    ? ai.patterns.map((p) => p.key)
    : state?.matches.map((m) => m.pattern.key) ?? [];

  const topPatternKey = patternKeys[0];
  const topPatternTitle = useAI
    ? (getPatternByKey(ai.patterns[0]?.key)?.title ?? ai.patterns[0]?.key)
    : state?.matches[0]?.pattern.title;

  useEffect(() => { document.title = "Your Reflection — Was I Too Sensitive?"; }, []);

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

  // Fetch story counts per pattern
  useEffect(() => {
    if (patternKeys.length === 0) return;
    const fetchStoryCounts = async () => {
      try {
        const { data } = await supabase
          .from("stories")
          .select("primary_pattern")
          .in("primary_pattern", patternKeys);
        if (!data) return;
        const counts: Record<string, number> = {};
        for (const row of data) {
          counts[row.primary_pattern] = (counts[row.primary_pattern] || 0) + 1;
        }
        setStoryCounts(counts);
      } catch {}
    };
    fetchStoryCounts();
  }, [patternKeys.join(",")]);

  if (!state) return <Navigate to="/reflect" replace />;

  const handleGenerateScripts = async () => {
    setScriptsLoading(true);
    setScriptsFallback(false);
    try {
      const { data, error } = await supabase.functions.invoke("generate-scripts", {
        body: {
          patternKeys,
          context: state.contextWhere,
          feeling: state.contextFeeling,
        },
      });

      if (error) throw error;
      if (!data?.scripts || data.scripts.length === 0) throw new Error("No scripts");

      setScripts(data.scripts);
      if (data.safetyNote) setSafetyNote(data.safetyNote);

      // Store scripts in DB
      await supabase.from("scripts").insert({
        experience_id: state.experienceId,
        scripts: data.scripts,
        safety_note: data.safetyNote ?? null,
      } as any);
    } catch {
      setScripts(FALLBACK_SCRIPTS);
      setScriptsFallback(true);
    } finally {
      setScriptsLoading(false);
    }
  };

  const handleSubmitFeedback = async () => {
    try {
      if (resonated) {
        await supabase.from("user_feedback").insert({ experience_id: state.experienceId, resonated });
      }
      if (contribute === true) {
        await supabase.from("experiences").update({ contributed: true }).eq("id", state.experienceId);

        // Generate story in background — fire and forget
        supabase.functions.invoke("generate-story", {
          body: {
            patternKeys,
            context: state.contextWhere,
            feeling: state.contextFeeling,
            selfDoubtDetected: state.selfDoubtDetected,
            validationMessage: ai?.validationMessage,
          },
        }).then(async ({ data }) => {
          if (data?.story && data?.title && data?.primaryPattern) {
            // Run content safety check
            let safetyResult = { safe: true, containsSensitiveContent: true, sensitiveContentType: null as string | null };
            try {
              const { data: safety } = await supabase.functions.invoke("check-content-safety", {
                body: { text: data.story },
              });
              if (safety) safetyResult = safety;
            } catch {
              // If safety check fails, insert with sensitive flag as precaution
            }

            if (safetyResult.safe) {
              await supabase.from("stories").insert({
                experience_id: state.experienceId,
                title: data.title,
                story: data.story,
                primary_pattern: data.primaryPattern,
                story_type: "user",
                contains_sensitive_content: safetyResult.containsSensitiveContent,
                sensitive_content_type: safetyResult.sensitiveContentType,
              } as any);
            }
            // If not safe, silently skip insertion
          }
        }).catch(() => { /* silently fail */ });
      }
      setSubmitted(true);
      toast({ title: "Thank you for reflecting." });
    } catch {
      toast({ title: "Something went wrong.", variant: "destructive" });
    }
  };

  const handleCreateShare = async () => {
    setShareLoading(true);
    try {
      const patternsData = patternKeys.map((key) => {
        const pat = getPatternByKey(key);
        const aiMatch = useAI ? ai.patterns.find((p) => p.key === key) : null;
        return {
          key,
          title: pat?.title ?? key,
          explanation: pat?.explanation ?? "",
          confidence: aiMatch?.confidence ?? state.matches.find((m) => m.pattern.key === key)?.confidence ?? "low",
        };
      });

      const summaryData = {
        date: new Date().toISOString(),
        contextWhere: state.contextWhere ?? null,
        contextFeeling: state.contextFeeling ?? null,
        patterns: patternsData,
        validationMessage: ai?.validationMessage ?? null,
      };

      const { data, error } = await supabase.from("shared_summaries").insert({
        experience_id: state.experienceId,
        summary_data: summaryData,
      } as any).select("id").single();

      if (error) throw error;
      const link = `${window.location.origin}/shared/${data.id}`;
      setShareLink(link);
    } catch {
      toast({ title: "Could not create share link.", variant: "destructive" });
    } finally {
      setShareLoading(false);
    }
  };

  const handleCopyShare = async () => {
    if (!shareLink) return;
    await navigator.clipboard.writeText(shareLink);
    setShareCopied(true);
    toast({ title: "Link copied to clipboard" });
    setTimeout(() => setShareCopied(false), 2000);
  };

  return (
    <div id="main-content" className="min-h-screen px-6 py-10 relative" style={{ background: "var(--gradient-warm)" }}>
      {/* Background warmth */}
      <div className="absolute top-[60px] left-[-50px] z-0 pointer-events-none opacity-50">
        <WarmBlobs className="w-[350px] h-[250px]" />
      </div>
      <div className="max-w-2xl mx-auto space-y-12 relative z-10">
        <Link to="/reflect" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />Back
        </Link>

        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl text-foreground tracking-tight">Possible patterns related to your experience</h1>
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
              We couldn't identify a specific pattern, but that doesn't mean your experience wasn't real.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {useAI
                ? ai.patterns.map((aiMatch) => {
                    const pattern = getPatternByKey(aiMatch.key);
                    return (
                      <div key={aiMatch.key} className="space-y-1.5">
                        <PatternCard patternKey={aiMatch.key} title={pattern?.title ?? aiMatch.key}
                          explanation={pattern?.explanation ?? ""} personalizedText={aiMatch.personalizedExplanation}
                          confidence={aiMatch.confidence} examples={pattern?.examples ?? []} actions={pattern?.actions ?? []} />
                        {(() => {
                          const rs = getResearchStat(aiMatch.key);
                          return rs ? (
                            <p className="text-[11px] text-muted-foreground/60 leading-relaxed pl-1">
                              {rs.stat} —{" "}
                              <a href={rs.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-muted-foreground">{rs.source}</a>
                            </p>
                          ) : null;
                        })()}
                        {(storyCounts[aiMatch.key] ?? 0) >= 3 && (
                          <Link to={`/stories?pattern=${aiMatch.key}`} className="block text-xs text-muted-foreground hover:text-primary transition-colors pl-1">
                            {storyCounts[aiMatch.key]} others have shared experiences like this →
                          </Link>
                        )}
                      </div>
                    );
                  })
                : state.matches.map((match) => (
                    <div key={match.pattern.key} className="space-y-1.5">
                      <PatternCard patternKey={match.pattern.key} title={match.pattern.title}
                        explanation={match.pattern.explanation} personalizedText={match.pattern.whyRelates}
                        confidence={match.confidence} examples={match.pattern.examples} actions={match.pattern.actions} />
                      {(() => {
                        const rs = getResearchStat(match.pattern.key);
                        return rs ? (
                          <p className="text-[11px] text-muted-foreground/60 leading-relaxed pl-1">
                            {rs.stat} —{" "}
                            <a href={rs.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-muted-foreground">{rs.source}</a>
                          </p>
                        ) : null;
                      })()}
                      {(storyCounts[match.pattern.key] ?? 0) >= 3 && (
                        <Link to={`/stories?pattern=${match.pattern.key}`} className="block text-xs text-muted-foreground hover:text-primary transition-colors pl-1">
                          {storyCounts[match.pattern.key]} others have shared experiences like this →
                        </Link>
                      )}
                    </div>
                  ))}
            </div>
          </div>
        )}

        {communityCount && (
          <div className="rounded-2xl bg-accent/40 p-5 text-center">
            <p className="text-sm text-foreground leading-relaxed">
              <span className="font-semibold">{communityCount.count}</span> other people have shared experiences involving{" "}
              <span className="font-medium">{communityCount.title}</span>. You are not alone in questioning this.
            </p>
          </div>
        )}

        {/* Conversation Rehearsal Section */}
        {patternKeys.length > 0 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-lg font-medium text-foreground">What could you say?</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Sometimes having words ready makes it easier. Here are some things you could practice saying in a situation like yours.
              </p>
            </div>

            {!scripts && !scriptsLoading && (
              <Button onClick={handleGenerateScripts} variant="outline" className="rounded-full">
                Generate conversation scripts
              </Button>
            )}

            {scriptsLoading && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground animate-pulse">Thinking of words that might help…</p>
                <LoadingAffirmation />
              </div>
            )}

            {scripts && (
              <div className="space-y-4">
                {scriptsFallback && (
                  <p className="text-xs text-muted-foreground italic">
                    We couldn't generate personalized scripts right now. Here are some general approaches that often help:
                  </p>
                )}

                {safetyNote && (
                  <div className="rounded-2xl bg-[hsl(5,30%,94%)] p-4 flex items-start gap-3">
                    <Shield className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" aria-hidden="true" />
                    <p className="text-sm text-foreground leading-relaxed">{safetyNote}</p>
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-3">
                  {scripts.map((s, i) => <ScriptCard key={i} script={s} />)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Affirmation between sections */}
        <div className="text-center py-2">
          <p className="text-sm text-muted-foreground/50 italic">
            "{state.selfDoubtDetected ? getValidationAffirmation() : getRandomAffirmation()}"
          </p>
        </div>

        {/* Wave divider */}
        <div className="relative -mx-6">
          <GentleWave className="opacity-50" />
        </div>

        {/* Gentle next steps */}
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

        {/* Feedback + contribute */}
        {!submitted ? (
          <div className="space-y-10 pt-4">
            <fieldset className="space-y-3 border-none p-0 m-0">
              <legend className="sr-only">Did any of these resonate with your experience?</legend>
              <p className="text-sm font-medium text-foreground" aria-hidden="true">Did any of these resonate with your experience?</p>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Did any of these resonate?">
                {["yes", "somewhat", "not really"].map((opt) => (
                  <button key={opt} role="radio" aria-checked={resonated === opt}
                    onClick={() => setResonated(opt)} className={`${PILL_BASE} ${resonated === opt ? PILL_ACTIVE : PILL_INACTIVE}`}>
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
                {[{ label: "Yes", value: true }, { label: "No", value: false }].map((opt) => (
                  <button key={opt.label} role="radio" aria-checked={contribute === opt.value}
                    onClick={() => setContribute(opt.value)} className={`${PILL_BASE} ${contribute === opt.value ? PILL_ACTIVE : PILL_INACTIVE}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Contributing means your anonymous pattern results and context selections (not your written description) will be included in aggregate statistics on the Patterns page.
              </p>
            </fieldset>

            <Button onClick={handleSubmitFeedback} disabled={!resonated} className="rounded-full px-8 h-12 text-base">
              Submit reflection
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="rounded-2xl bg-accent/50 p-8 text-center space-y-4">
              <p className="text-foreground font-medium">Thank you for reflecting.</p>
              <p className="text-sm text-muted-foreground">You are not alone in questioning these experiences.</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <Button asChild variant="outline" className="rounded-full">
                  <Link to="/reflect" className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" aria-hidden="true" />Reflect on another experience
                  </Link>
                </Button>
                {!getSessionUserId() && (
                  <Button asChild variant="ghost" className="rounded-full text-muted-foreground">
                    <Link to="/my-journal" className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4" aria-hidden="true" />Save to my journal
                    </Link>
                  </Button>
                )}
              </div>
              {!getSessionUserId() && (
                <p className="text-xs text-muted-foreground/70">
                  Want to keep track of your reflections over time? Create a private journal.
                </p>
              )}
              <Link to="/stories" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/70 hover:text-muted-foreground transition-colors">
                <BookText className="w-3.5 h-3.5" aria-hidden="true" />
                Read how others have navigated similar experiences
              </Link>
            </div>

            {/* Share with someone you trust */}
            <div className="rounded-2xl bg-card p-6 space-y-4 shadow-[var(--shadow-soft)]">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                <h2 className="text-base font-medium text-foreground">Share with someone you trust</h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Sometimes the hardest part is explaining what happened. This creates a summary you can share with a friend, therapist, or advocate.
              </p>

              {!shareLink ? (
                <Button onClick={handleCreateShare} disabled={shareLoading} variant="outline" className="rounded-full">
                  {shareLoading ? "Creating…" : "Create shareable summary"}
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 rounded-xl bg-background p-3 shadow-[var(--shadow-card)]">
                    <LinkIcon className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
                    <span className="text-sm text-foreground truncate flex-1">{shareLink}</span>
                    <button onClick={handleCopyShare} className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
                      {shareCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {shareCopied ? "Copied" : "Copy link"}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    This link expires in 7 days. The person you share it with will not see your original words — only the patterns and context.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <Collapsible open={resourcesOpen} onOpenChange={setResourcesOpen}>
          <CollapsibleTrigger asChild>
            <button aria-expanded={resourcesOpen}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded">
              Resources
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${resourcesOpen ? "rotate-180" : ""}`} aria-hidden="true" />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3 space-y-2">
            {RESOURCES.map((r) => (
              <a key={r.url} href={r.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded">
                <ExternalLink className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span><span className="font-medium text-foreground/80">{r.name}</span> — {r.desc}</span>
              </a>
            ))}
          </CollapsibleContent>
        </Collapsible>

        <footer className="space-y-3 pb-6">
          <p className="text-xs text-muted-foreground/40 italic text-center">"{getRandomAffirmation()}"</p>
          <p className="text-xs text-muted-foreground/60 text-center">
            This tool does not provide legal, medical, or clinical advice.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Results;
