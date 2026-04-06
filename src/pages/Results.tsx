import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  ArrowLeft, RefreshCw, ChevronDown, Sparkles, ExternalLink, BookOpen,
  Copy, Check, Shield, Share2, Link as LinkIcon, BookText, Heart,
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
import { WarmBlobs, GentleWave, WarmGlow } from "@/components/Illustrations";
import { getResearchStat } from "@/lib/research-stats";
import { formatDistanceToNow } from "date-fns";

// --- Loading Affirmation ---
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

const ESCALATION_PATTERNS = ["safety_threat", "harassment"];

const SECTION_IDS = ["validation", "patterns", "stories", "scripts", "next-steps", "choices", "journal-invite"];
const SECTION_LABELS = ["Validation", "Patterns", "Stories", "Scripts", "Next steps", "Choices", "Journal"];

// --- Pattern Card ---
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

// --- Inline Story Card ---
interface InlineStory {
  id: string;
  title: string;
  story: string;
  primary_pattern: string;
  created_at: string;
  story_type: string;
  contains_sensitive_content: boolean;
  sensitive_content_type: string | null;
  source_note: string | null;
}

const InlineStoryCard = ({ story }: { story: InlineStory }) => {
  const [revealed, setRevealed] = useState(false);
  const pattern = getPatternByKey(story.primary_pattern);
  const isSensitive = story.contains_sensitive_content;
  const showContent = !isSensitive || revealed;

  return (
    <div className="rounded-2xl bg-card/80 p-5 space-y-3 shadow-[var(--shadow-card)]">
      <h4 className="text-sm font-medium text-foreground">{story.title}</h4>
      {showContent ? (
        <>
          <p className="text-sm text-foreground/80 leading-[1.75]">{story.story}</p>
          {isSensitive && (
            <button onClick={() => setRevealed(false)} className="text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors">
              Hide
            </button>
          )}
        </>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground italic">
            This experience involves {story.sensitive_content_type ?? "sensitive themes"}. Read when you're ready.
          </p>
          <button onClick={() => setRevealed(true)} className="text-xs text-muted-foreground/70 hover:text-foreground transition-colors">
            Read this story
          </button>
        </div>
      )}
      <div className="flex items-center gap-3">
        {pattern && (
          <Badge variant="secondary" className="rounded-full text-[10px] gap-1">
            <span>{PATTERN_ICONS[story.primary_pattern]}</span>
            {pattern.title}
          </Badge>
        )}
        <span className="text-[10px] text-muted-foreground/50 italic">
          {story.story_type === "seed" ? "Based on commonly reported experiences" : "Shared by someone who reflected here"}
        </span>
      </div>
    </div>
  );
};

// --- Section Divider ---
const SectionDivider = () => (
  <div className="py-8 sm:py-12">
    <div className="relative -mx-6">
      <GentleWave className="opacity-30" />
    </div>
  </div>
);

// --- Section Header ---
const SectionHeader = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-lg sm:text-xl font-semibold text-foreground/80 tracking-tight" style={{ fontFamily: "'DM Sans', sans-serif" }}>
    {children}
  </h2>
);

// --- Scroll Progress Bar ---
const ScrollProgress = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="sticky top-0 z-30 w-full">
      <div className="h-0.5 w-full bg-transparent">
        <div
          className="h-full transition-[width] duration-100 ease-out"
          style={{ width: `${progress}%`, backgroundColor: "hsl(230 30% 65% / 0.6)" }}
        />
      </div>
    </div>
  );
};

// --- Section Dot Nav (desktop only) ---
const SectionDotNav = ({ activeIndex }: { activeIndex: number }) => (
  <div className="fixed right-6 top-1/2 -translate-y-1/2 z-20 hidden lg:flex flex-col gap-3">
    {SECTION_IDS.map((id, i) => (
      <button
        key={id}
        onClick={() => document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: "smooth" })}
        className="group relative flex items-center justify-center"
        aria-label={`Go to ${SECTION_LABELS[i]}`}
      >
        <div
          className={`w-2.5 h-2.5 rounded-full border-2 transition-all duration-300 ${
            i === activeIndex
              ? "bg-primary border-primary scale-110"
              : "bg-transparent border-muted-foreground/30 hover:border-muted-foreground/60"
          }`}
        />
        <span className="absolute right-6 text-[10px] text-muted-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          {SECTION_LABELS[i]}
        </span>
      </button>
    ))}
  </div>
);

// --- Main Results ---
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
  const [showJournalInvite, setShowJournalInvite] = useState(false);
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

  // Matching stories
  const [matchingStories, setMatchingStories] = useState<InlineStory[]>([]);

  // Active section for dot nav
  const [activeSection, setActiveSection] = useState(0);

  const { toast } = useToast();

  const ai = state?.aiResult;
  const useAI = ai && ai.patterns && ai.patterns.length > 0;

  const patternKeys = useAI
    ? ai.patterns.map((p) => p.key)
    : state?.matches.map((m) => m.pattern.key) ?? [];

  const hasEscalation = patternKeys.some((k) => ESCALATION_PATTERNS.includes(k));
  const journalUserId = getSessionUserId();

  useEffect(() => { document.title = "Your Reflection — Was I Too Sensitive?"; }, []);

  // Auto-expand resources for escalation patterns
  useEffect(() => { if (hasEscalation) setResourcesOpen(true); }, [hasEscalation]);

  // Fetch matching stories
  useEffect(() => {
    if (patternKeys.length === 0) return;
    const fetchStories = async () => {
      try {
        const { data } = await supabase
          .from("stories")
          .select("id, title, story, primary_pattern, created_at, story_type, contains_sensitive_content, sensitive_content_type, source_note")
          .in("primary_pattern", patternKeys)
          .eq("reported", false)
          .order("created_at", { ascending: false })
          .limit(10);
        if (!data) return;
        // Prioritize user stories, then seed stories, take 3
        const userStories = (data as InlineStory[]).filter((s) => s.story_type === "user");
        const seedStories = (data as InlineStory[]).filter((s) => s.story_type === "seed");
        const combined = [...userStories, ...seedStories].slice(0, 3);
        setMatchingStories(combined);
      } catch {}
    };
    fetchStories();
  }, [patternKeys.join(",")]);

  // IntersectionObserver for dot nav
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    SECTION_IDS.forEach((id, i) => {
      const el = document.getElementById(`section-${id}`);
      if (!el) return;
      const observer = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveSection(i); },
        { threshold: 0.3, rootMargin: "-20% 0px -60% 0px" }
      );
      observer.observe(el);
      observers.push(observer);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, [submitted]);

  if (!state) return <Navigate to="/reflect" replace />;

  const handleGenerateScripts = async () => {
    setScriptsLoading(true);
    setScriptsFallback(false);
    try {
      const { data, error } = await supabase.functions.invoke("generate-scripts", {
        body: { patternKeys, context: state.contextWhere, feeling: state.contextFeeling },
      });
      if (error) throw error;
      if (!data?.scripts || data.scripts.length === 0) throw new Error("No scripts");
      setScripts(data.scripts);
      if (data.safetyNote) setSafetyNote(data.safetyNote);
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
        // Generate story in background
        supabase.functions.invoke("generate-story", {
          body: {
            patternKeys, context: state.contextWhere, feeling: state.contextFeeling,
            selfDoubtDetected: state.selfDoubtDetected, validationMessage: ai?.validationMessage,
          },
        }).then(async ({ data }) => {
          if (data?.story && data?.title && data?.primaryPattern) {
            let safetyResult = { safe: true, containsSensitiveContent: true, sensitiveContentType: null as string | null };
            try {
              const { data: safety } = await supabase.functions.invoke("check-content-safety", { body: { text: data.story } });
              if (safety) safetyResult = safety;
            } catch {}
            if (safetyResult.safe) {
              await supabase.from("stories").insert({
                experience_id: state.experienceId, title: data.title, story: data.story,
                primary_pattern: data.primaryPattern, story_type: "user",
                contains_sensitive_content: safetyResult.containsSensitiveContent,
                sensitive_content_type: safetyResult.sensitiveContentType,
              } as any);
            }
          }
        }).catch(() => {});
      }
      setSubmitted(true);
      setShowJournalInvite(true);
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
          key, title: pat?.title ?? key, explanation: pat?.explanation ?? "",
          confidence: aiMatch?.confidence ?? state.matches.find((m) => m.pattern.key === key)?.confidence ?? "low",
        };
      });
      const summaryData = {
        date: new Date().toISOString(), contextWhere: state.contextWhere ?? null,
        contextFeeling: state.contextFeeling ?? null, patterns: patternsData,
        validationMessage: ai?.validationMessage ?? null,
      };
      const { data, error } = await supabase.from("shared_summaries").insert({
        experience_id: state.experienceId, summary_data: summaryData,
      } as any).select("id").single();
      if (error) throw error;
      setShareLink(`${window.location.origin}/shared/${data.id}`);
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

  const topPatternKey = patternKeys[0];

  return (
    <>
      <ScrollProgress />
      <SectionDotNav activeIndex={activeSection} />

      <div id="main-content" className="min-h-screen px-6 py-10 relative" style={{ background: "var(--gradient-warm)" }}>
        {/* Background warmth */}
        <div className="absolute top-[60px] left-[-50px] z-0 pointer-events-none opacity-50">
          <WarmBlobs className="w-[350px] h-[250px]" />
        </div>

        <div className="max-w-2xl mx-auto relative z-10">
          <Link to="/reflect" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded">
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />Back
          </Link>

          {/* ===== SECTION A: Validation ===== */}
          <section id="section-validation" className="pt-10 space-y-4">
            {ai?.validationMessage && (
              <div className="rounded-2xl bg-primary/8 p-8">
                <p className="text-lg text-foreground leading-relaxed">{ai.validationMessage}</p>
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
          </section>

          <SectionDivider />

          {/* ===== SECTION B: What we noticed ===== */}
          <section id="section-patterns" className="space-y-4">
            <SectionHeader>What we noticed in your experience</SectionHeader>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {state.lowConfidence
                ? "We weren't able to identify a specific pattern, but here are some common ones that may still be relevant."
                : "These are not definitive labels — they are concepts that may help you understand what happened."}
            </p>

            {(useAI && ai.patterns.length === 0) || (!useAI && state.matches.length === 0) ? (
              <div className="rounded-2xl bg-card p-8 space-y-2 text-center shadow-[var(--shadow-soft)]">
                <p className="text-sm text-foreground leading-relaxed">
                  We couldn't identify a specific pattern, but that doesn't mean your experience wasn't real.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {useAI
                  ? ai.patterns.map((aiMatch) => {
                      const pattern = getPatternByKey(aiMatch.key);
                      const rs = getResearchStat(aiMatch.key);
                      return (
                        <div key={aiMatch.key} className="space-y-1.5">
                          <PatternCard patternKey={aiMatch.key} title={pattern?.title ?? aiMatch.key}
                            explanation={pattern?.explanation ?? ""} personalizedText={aiMatch.personalizedExplanation}
                            confidence={aiMatch.confidence} examples={pattern?.examples ?? []} actions={pattern?.actions ?? []} />
                          {rs && (
                            <p className="text-[11px] text-muted-foreground/60 leading-relaxed pl-1">
                              Research shows: {rs.stat} —{" "}
                              <a href={rs.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-muted-foreground">{rs.source}</a>
                            </p>
                          )}
                        </div>
                      );
                    })
                  : state.matches.map((match) => {
                      const rs = getResearchStat(match.pattern.key);
                      return (
                        <div key={match.pattern.key} className="space-y-1.5">
                          <PatternCard patternKey={match.pattern.key} title={match.pattern.title}
                            explanation={match.pattern.explanation} personalizedText={match.pattern.whyRelates}
                            confidence={match.confidence} examples={match.pattern.examples} actions={match.pattern.actions} />
                          {rs && (
                            <p className="text-[11px] text-muted-foreground/60 leading-relaxed pl-1">
                              Research shows: {rs.stat} —{" "}
                              <a href={rs.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-muted-foreground">{rs.source}</a>
                            </p>
                          )}
                        </div>
                      );
                    })}
              </div>
            )}
          </section>

          <SectionDivider />

          {/* ===== SECTION C: You're not alone ===== */}
          <section id="section-stories" className="space-y-4">
            <SectionHeader>Others have felt this too</SectionHeader>
            {matchingStories.length > 0 ? (
              <>
                <div className="space-y-3">
                  {matchingStories.map((s) => <InlineStoryCard key={s.id} story={s} />)}
                </div>
                {topPatternKey && (
                  <Link
                    to={`/stories?pattern=${topPatternKey}`}
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    <BookText className="w-3.5 h-3.5" aria-hidden="true" />
                    Read more stories →
                  </Link>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground/70 leading-relaxed italic">
                As more people reflect, stories will appear here. You're helping build that.
              </p>
            )}
          </section>

          {/* Affirmation between sections */}
          <div className="text-center py-10">
            <p className="text-sm text-muted-foreground/50 italic">
              "{state.selfDoubtDetected ? getValidationAffirmation() : getRandomAffirmation()}"
            </p>
          </div>

          {/* ===== SECTION D: What you could say ===== */}
          {patternKeys.length > 0 && (
            <section id="section-scripts" className="space-y-4">
              <SectionHeader>Words that might help</SectionHeader>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Sometimes having words ready makes it easier. Here are some things you could practice saying.
              </p>

              {safetyNote && (
                <div className="rounded-2xl bg-[hsl(5,30%,94%)] p-4 flex items-start gap-3">
                  <Shield className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" aria-hidden="true" />
                  <p className="text-sm text-foreground leading-relaxed">{safetyNote}</p>
                </div>
              )}

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
                  <div className="grid gap-3 sm:grid-cols-3">
                    {scripts.map((s, i) => <ScriptCard key={i} script={s} />)}
                  </div>
                </div>
              )}
            </section>
          )}

          <SectionDivider />

          {/* ===== SECTION E: Gentle next steps ===== */}
          <section id="section-next-steps" className="space-y-4">
            <SectionHeader>Some things that might help</SectionHeader>
            <div className="rounded-2xl bg-card p-6 sm:p-8 space-y-4 shadow-[var(--shadow-soft)]">
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

            {/* Support Resources */}
            <Collapsible open={resourcesOpen} onOpenChange={setResourcesOpen}>
              <CollapsibleTrigger asChild>
                <button aria-expanded={resourcesOpen}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded">
                  Support resources
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

            {/* Share with someone you trust */}
            <div className="rounded-2xl bg-card p-6 space-y-4 shadow-[var(--shadow-soft)]">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                <h3 className="text-base font-medium text-foreground">Share with someone you trust</h3>
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
          </section>

          <SectionDivider />

          {/* ===== SECTION F: Your choices ===== */}
          <section id="section-choices" className="space-y-6">
            <SectionHeader>Before you go</SectionHeader>

            {!submitted ? (
              <div className="space-y-10">
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
                    Would you like to anonymously share this experience to help others?
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
                    Contributing means your anonymous pattern results and context selections (not your written description) will be included in aggregate statistics.
                  </p>
                </fieldset>

                <Button onClick={handleSubmitFeedback} disabled={!resonated} className="rounded-full px-8 h-12 text-base">
                  Submit reflection
                </Button>
              </div>
            ) : (
              <div className="rounded-2xl bg-accent/50 p-8 text-center space-y-4">
                <p className="text-foreground font-medium">Thank you for reflecting.</p>
                <p className="text-sm text-muted-foreground">You are not alone in questioning these experiences.</p>
                <Button asChild variant="outline" className="rounded-full">
                  <Link to="/reflect" className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" aria-hidden="true" />Reflect on another experience
                  </Link>
                </Button>
              </div>
            )}
          </section>

          {/* ===== SECTION G: Journal invitation ===== */}
          {submitted && showJournalInvite && (
            <>
              <SectionDivider />
              <section id="section-journal-invite" className="space-y-4">
                <div className="relative rounded-2xl bg-card p-8 shadow-[var(--shadow-soft)] text-center space-y-4 overflow-hidden">
                  <div className="absolute -top-4 -right-4 z-0 pointer-events-none opacity-40">
                    <WarmGlow size={160} />
                  </div>
                  <div className="relative z-10 space-y-4">
                    {journalUserId ? (
                      <>
                        <p className="text-foreground font-medium">This reflection has been saved to your journal.</p>
                        <Button asChild className="rounded-full">
                          <Link to="/my-journal" className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4" aria-hidden="true" />View your journal
                          </Link>
                        </Button>
                      </>
                    ) : (
                      <>
                        <Heart className="w-8 h-8 text-primary/40 mx-auto" aria-hidden="true" />
                        <p className="text-foreground font-medium">Want to keep track of how you're feeling over time?</p>
                        <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
                          Your private journal lets you look back on your reflections and notice patterns over time.
                          It's completely optional and protected by a passphrase — no email or account needed.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                          <Button asChild className="rounded-full">
                            <Link to="/my-journal">Start my journal</Link>
                          </Button>
                          <button
                            onClick={() => setShowJournalInvite(false)}
                            className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                          >
                            Not right now
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </section>
            </>
          )}

          <footer className="space-y-3 py-12">
            <p className="text-xs text-muted-foreground/40 italic text-center">"{getRandomAffirmation()}"</p>
            <p className="text-xs text-muted-foreground/60 text-center">
              This tool does not provide legal, medical, or clinical advice.
            </p>
          </footer>
        </div>
      </div>
    </>
  );
};

export default Results;
