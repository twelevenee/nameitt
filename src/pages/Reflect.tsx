import { useState, useEffect, useCallback, useMemo, useRef, KeyboardEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  ArrowLeft, ArrowUp, Shield, ShieldAlert, ExternalLink, ChevronDown,
  Copy, Check, Share2, Link as LinkIcon, BookOpen, BookText, Heart, RefreshCw,
} from "lucide-react";
import ConversationBubble from "@/components/ConversationBubble";
import TypingIndicator from "@/components/TypingIndicator";
import CrisisResourceList from "@/components/CrisisResourceList";
import { getCountry, getPrimaryHelpUrl } from "@/lib/i18n/crisis-resources";
import { strings } from "@/lib/i18n/strings";
import { supabase } from "@/integrations/supabase/client";
import { analyzeExperience } from "@/lib/patterns";
import type { AIAnalysisResult, PatternMatch } from "@/lib/patterns";
import { getPatternByKey } from "@/lib/patterns";
import { PATTERN_ICONS } from "@/lib/patternIcons";
import { useToast } from "@/hooks/use-toast";
import { getSessionUserId } from "@/lib/journal-auth";
import { getRandomAffirmation, getValidationAffirmation, AFFIRMATIONS } from "@/lib/affirmations";
import { FALLBACK_SCRIPTS } from "@/lib/fallback-scripts";
import type { Script } from "@/lib/fallback-scripts";
import { getResearchStat } from "@/lib/research-stats";
import { findMatchingStories, type MatchedStory } from "@/lib/story-matching";
import { WarmGlow } from "@/components/Illustrations";

// ---- Constants ----
const WHERE_OPTIONS = ["workplace", "school", "public space", "relationship", "family", "online", "other"];
const FEELING_OPTIONS = ["confusing", "uncomfortable", "humiliating", "unsafe", "angry", "not sure"];
const DOUBT_OPTIONS = ["yes", "no", "not sure"];
const EXAMPLE_PROMPTS = strings.reflect.prompts;
const REDACTED_PLACEHOLDER = "[experience analyzed — raw text not stored for privacy]";
const SAFETY_PHRASES = [
  "can't leave", "afraid to go home", "he'll hurt", "she'll hurt",
  "threatened to", "scared for my life", "locked me", "won't let me leave",
];
const SAFETY_DISMISSED_KEY = "safety_interstitial_dismissed";
const ESCALATION_PATTERNS = ["safety_threat", "harassment"];
const PILL_BASE = "px-4 py-2.5 rounded-full text-xs sm:text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
const PILL_ACTIVE = "bg-primary text-primary-foreground";
const PILL_INACTIVE = "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground";

const CONFIDENCE_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  high: { label: "Strong match", variant: "default" },
  medium: { label: "Possible match", variant: "secondary" },
  low: { label: "Worth considering", variant: "outline" },
};

const TONE_BG: Record<string, string> = {
  "Gentle but firm": "bg-[hsl(220,30%,96%)]",
  "Direct and clear": "bg-[hsl(35,20%,96%)]",
  "De-escalation focused": "bg-[hsl(140,20%,96%)]",
};

// ---- Conversation step types ----
type Step =
  | "greeting" | "ask-description" | "wait-description"
  | "thanks" | "ask-where" | "wait-where"
  | "ask-feelings" | "wait-feelings"
  | "ask-doubt" | "wait-doubt"
  | "safety-check" | "ask-doubt-intro"
  | "analyzing" | "analyzing-done"
  | "show-validation" | "show-doubt-note"
  | "show-patterns-intro" | "show-patterns"
  | "show-stories-intro" | "show-stories"
  | "show-choices"
  | "generating-scripts" | "show-scripts"
  | "show-closing" | "show-next-steps"
  | "show-feedback" | "show-journal-invite"
  | "done";

// ---- Small sub-components ----
const LoadingAffirmation = () => {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % AFFIRMATIONS.length), 3000);
    return () => clearInterval(t);
  }, []);
  return (
    <p className="text-xs text-muted-foreground/60 italic">"{AFFIRMATIONS[idx]}"</p>
  );
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
    <div className="rounded-2xl bg-card/60 p-5 space-y-3 overflow-hidden">
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
          <button className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors pt-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
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

const ScriptCard = ({ script }: { script: Script }) => {
  const [copied, setCopied] = useState(false);
  const bg = TONE_BG[script.tone] ?? "bg-secondary/30";
  const handleCopy = async () => {
    await navigator.clipboard.writeText(script.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className={`rounded-2xl ${bg} p-5 space-y-3`}>
      <Badge variant="outline" className="rounded-full text-[10px] w-fit">{script.tone}</Badge>
      <p className="text-sm font-medium text-foreground leading-relaxed">"{script.text}"</p>
      <p className="text-xs text-muted-foreground leading-relaxed">{script.why}</p>
      <button onClick={handleCopy} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
};

const InlineStoryCard = ({ story, userContext, userFeeling }: { story: MatchedStory; userContext?: string; userFeeling?: string }) => {
  const [revealed, setRevealed] = useState(false);
  const pattern = getPatternByKey(story.primary_pattern);
  const isSensitive = story.contains_sensitive_content;
  const showContent = !isSensitive || revealed;
  const contextMatch = userContext && story.context && story.context.toLowerCase() === userContext.toLowerCase();
  const feelingMatch = userFeeling && story.feeling && story.feeling.toLowerCase() === userFeeling.toLowerCase();
  return (
    <div className="rounded-2xl bg-card/60 p-5 space-y-3">
      <h4 className="text-sm font-medium text-foreground">{story.title}</h4>
      {showContent ? (
        <>
          <p className="text-sm text-foreground/80 leading-[1.75]">{story.story}</p>
          {isSensitive && (
            <button onClick={() => setRevealed(false)} className="text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors">Hide</button>
          )}
        </>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground italic">This experience involves {story.sensitive_content_type ?? "sensitive themes"}. Read when you're ready.</p>
          <button onClick={() => setRevealed(true)} className="text-xs text-muted-foreground/70 hover:text-foreground transition-colors">Read this story</button>
        </div>
      )}
      {(contextMatch || feelingMatch) && showContent && (
        <div className="space-y-1">
          {contextMatch && <p className="text-xs text-muted-foreground/60 italic">Also happened at {story.context}</p>}
          {feelingMatch && <p className="text-xs text-muted-foreground/60 italic">They felt {story.feeling} too.</p>}
        </div>
      )}
      <div className="flex items-center gap-3">
        {pattern && (
          <Badge variant="secondary" className="rounded-full text-[10px] gap-1">
            <span>{PATTERN_ICONS[story.primary_pattern]}</span>{pattern.title}
          </Badge>
        )}
        <span className="text-[10px] text-muted-foreground/50 italic">
          {story.story_type === "seed" ? "Based on commonly reported experiences" : "Shared by someone who reflected here"}
        </span>
      </div>
    </div>
  );
};

// ---- Main component ----
const Reflect = () => {
  const [step, setStep] = useState<Step>("greeting");
  const [typing, setTyping] = useState(false);
  const [description, setDescription] = useState("");
  const [where, setWhere] = useState<string | null>(null);
  const [feelings, setFeelings] = useState<string[]>([]);
  const [doubt, setDoubt] = useState<string | null>(null);
  const [safetyDismissed, setSafetyDismissed] = useState(() => sessionStorage.getItem(SAFETY_DISMISSED_KEY) === "true");

  // Results state
  const [experienceId, setExperienceId] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);
  const [localMatches, setLocalMatches] = useState<PatternMatch[]>([]);
  const [selfDoubtDetected, setSelfDoubtDetected] = useState(false);
  const [lowConfidence, setLowConfidence] = useState(false);
  const [patternKeys, setPatternKeys] = useState<string[]>([]);
  const [matchingStories, setMatchingStories] = useState<MatchedStory[]>([]);

  // Scripts
  const [scripts, setScripts] = useState<Script[] | null>(null);
  const [safetyNote, setSafetyNote] = useState<string | null>(null);
  const [scriptsFallback, setScriptsFallback] = useState(false);

  // Share
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  // Feedback
  const [resonated, setResonated] = useState<string | null>(null);
  const [contribute, setContribute] = useState<boolean | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Messages history (for display)
  const [messages, setMessages] = useState<Array<{
    id: string; sender: "app" | "user"; content: React.ReactNode; showIcon?: boolean;
  }>>([]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const MAX_CHARS = 2000;
  const charCount = description.trim().length;
  const overLimit = charCount > MAX_CHARS;

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing, step]);

  useEffect(() => { document.title = "Share Your Experience — Name It"; }, []);

  // Add a message helper
  const addMsg = useCallback((sender: "app" | "user", content: React.ReactNode, showIcon?: boolean) => {
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), sender, content, showIcon }]);
  }, []);

  // Typed delay helper
  const typeAndSay = useCallback((content: React.ReactNode, delay: number, showIcon?: boolean) => {
    return new Promise<void>((resolve) => {
      setTyping(true);
      setTimeout(() => {
        setTyping(false);
        addMsg("app", content, showIcon);
        resolve();
      }, delay);
    });
  }, [addMsg]);

  // ---- Conversation flow orchestration ----
  // Step 1: Greeting
  useEffect(() => {
    if (step !== "greeting") return;
    const run = async () => {
      await typeAndSay(
        "Hi. This is a safe space to reflect. Whatever happened, there are no wrong words for it.",
        500, true
      );
      await typeAndSay("In your own words, what happened?", 1200);
      setStep("wait-description");
    };
    run();
  }, [step, typeAndSay]);

  // Submit description
  const handleSubmitDescription = useCallback(() => {
    if (!description.trim() || overLimit) return;
    addMsg("user", description.trim());
    setStep("thanks");
  }, [description, overLimit, addMsg]);

  // Step: thanks + ask where
  useEffect(() => {
    if (step !== "thanks") return;
    const run = async () => {
      await typeAndSay("Thank you for sharing that.", 800);
      await typeAndSay("Can I ask — where did this happen?", 600);
      setStep("wait-where");
    };
    run();
  }, [step, typeAndSay]);

  const handleSelectWhere = useCallback((val: string) => {
    setWhere(val);
    addMsg("user", val);
    setStep("ask-feelings");
  }, [addMsg]);

  const handleSkipWhere = useCallback(() => {
    addMsg("user", <span className="text-muted-foreground italic">skipped</span>);
    setStep("ask-feelings");
  }, [addMsg]);

  useEffect(() => {
    if (step !== "ask-feelings") return;
    const run = async () => {
      await typeAndSay("How did it make you feel? Pick as many as apply.", 600);
      setStep("wait-feelings");
    };
    run();
  }, [step, typeAndSay]);

  const [feelingsConfirmed, setFeelingsConfirmed] = useState(false);
  const handleConfirmFeelings = useCallback(() => {
    if (feelings.length === 0) {
      addMsg("user", <span className="text-muted-foreground italic">skipped</span>);
    } else {
      addMsg("user", feelings.join(", "));
    }
    setFeelingsConfirmed(true);
    setStep("ask-doubt-intro");
  }, [feelings, addMsg]);

  const handleSkipFeelings = useCallback(() => {
    addMsg("user", <span className="text-muted-foreground italic">skipped</span>);
    setStep("ask-doubt-intro");
  }, [addMsg]);

  // Using a separate step name for the typing transition
  useEffect(() => {
    if (step !== "ask-doubt-intro") return;
    const run = async () => {
      await typeAndSay("One last thing — did you find yourself doubting whether your reaction was justified?", 600);
      setStep("wait-doubt");
    };
    run();
  }, [step, typeAndSay]);

  const handleSelectDoubt = useCallback((val: string) => {
    setDoubt(val);
    addMsg("user", val);
    // Check for safety interstitial
    const feelsUnsafe = feelings.includes("unsafe");
    const textLower = description.toLowerCase();
    const hasTriggerPhrase = SAFETY_PHRASES.some((p) => textLower.includes(p));
    const needsSafety = !safetyDismissed && feelsUnsafe && (val === "yes" || hasTriggerPhrase);
    if (needsSafety) {
      setStep("safety-check");
    } else {
      setStep("analyzing");
    }
  }, [feelings, description, safetyDismissed, addMsg]);

  const handleSkipDoubt = useCallback(() => {
    addMsg("user", <span className="text-muted-foreground italic">skipped</span>);
    setStep("analyzing");
  }, [addMsg]);

  // Safety interstitial dismiss
  const handleDismissSafety = useCallback(() => {
    setSafetyDismissed(true);
    sessionStorage.setItem(SAFETY_DISMISSED_KEY, "true");
    setStep("analyzing");
  }, []);

  // ---- Analysis ----
  useEffect(() => {
    if (step !== "analyzing") return;
    const run = async () => {
      setTyping(true);
      addMsg("app", "Let me take a moment with what you've shared…");

      const feelingStr = feelings.length > 0 ? feelings.join(", ") : undefined;
      const expId = crypto.randomUUID();
      const journalUserId = getSessionUserId();

      let ai: AIAnalysisResult | null = null;
      try {
        const { data, error } = await supabase.functions.invoke("analyze-experience", {
          body: { description: description.trim(), contextWhere: where, contextFeeling: feelingStr, selfDoubt: doubt },
        });
        if (!error && data?.patterns) ai = data as AIAnalysisResult;
      } catch {}

      const local = analyzeExperience(description, where ?? undefined, feelingStr);

      // Save to DB
      try {
        await supabase.from("experiences").insert({
          id: expId, description: REDACTED_PLACEHOLDER,
          context_where: where, context_feeling: feelings.length > 0 ? feelings.join(", ") : null,
          self_doubt: doubt, journal_user_id: journalUserId,
        });
        const dPatterns = ai ? ai.patterns.map((p) => p.key) : local.matches.map((m) => m.pattern.key);
        const dSelfDoubt = ai ? ai.selfDoubtDetected : local.selfDoubtDetected;
        await supabase.from("analyses").insert({
          experience_id: expId,
          detected_patterns: dPatterns as any,
          self_doubt_detected: dSelfDoubt,
        });
      } catch {}

      const keys = ai ? ai.patterns.map((p) => p.key) : local.matches.map((m) => m.pattern.key);
      setExperienceId(expId);
      setAiResult(ai);
      setLocalMatches(local.matches);
      setSelfDoubtDetected(ai ? ai.selfDoubtDetected : local.selfDoubtDetected);
      setLowConfidence(ai ? false : local.lowConfidence);
      setPatternKeys(keys);

      // Update URL without navigation
      window.history.replaceState(null, "", "/results");

      // Fetch stories
      const userFeelings = feelingStr?.split(", ").filter(Boolean) ?? [];
      if (keys.length > 0) {
        findMatchingStories({ patternKeys: keys, context: where ?? undefined, feelings: userFeelings.length > 0 ? userFeelings : undefined }, 3)
          .then(setMatchingStories).catch(() => {});
      }

      setTyping(false);
      setStep("show-validation");
    };
    run();
  }, [step]);

  // Show validation
  useEffect(() => {
    if (step !== "show-validation") return;
    const run = async () => {
      if (aiResult?.validationMessage) {
        await typeAndSay(
          <p className="text-base leading-relaxed">{aiResult.validationMessage}</p>,
          800, true
        );
      }
      if (selfDoubtDetected) {
        await typeAndSay(
          "I noticed some self-doubt in what you shared. That's very common in these situations. Questioning yourself doesn't mean it wasn't real.",
          800
        );
      }
      setStep("show-patterns-intro");
    };
    run();
  }, [step, aiResult, selfDoubtDetected, typeAndSay]);

  // Show patterns
  useEffect(() => {
    if (step !== "show-patterns-intro") return;
    const run = async () => {
      await typeAndSay("Here's what I noticed in your experience.", 800, true);
      setStep("show-patterns");
    };
    run();
  }, [step, typeAndSay]);

  // After patterns are rendered, continue to stories
  useEffect(() => {
    if (step !== "show-patterns") return;
    const t = setTimeout(() => setStep("show-stories-intro"), 1500);
    return () => clearTimeout(t);
  }, [step]);

  useEffect(() => {
    if (step !== "show-stories-intro") return;
    const run = async () => {
      await typeAndSay("You're not alone in this.", 800);
      setStep("show-stories");
    };
    run();
  }, [step, typeAndSay]);

  useEffect(() => {
    if (step !== "show-stories") return;
    const t = setTimeout(() => setStep("show-choices"), 1200);
    return () => clearTimeout(t);
  }, [step]);

  // Choices
  useEffect(() => {
    if (step !== "show-choices") return;
    const run = async () => {
      await typeAndSay("What would help you right now?", 600);
    };
    run();
  }, [step, typeAndSay]);

  const handleChoiceScripts = useCallback(async () => {
    addMsg("user", "Give me words to use");
    setStep("generating-scripts");
    try {
      const { data, error } = await supabase.functions.invoke("generate-scripts", {
        body: { patternKeys, context: where, feeling: feelings.join(", ") },
      });
      if (error || !data?.scripts?.length) throw new Error();
      setScripts(data.scripts);
      if (data.safetyNote) setSafetyNote(data.safetyNote);
      if (experienceId) {
        supabase.from("scripts").insert({
          experience_id: experienceId, scripts: data.scripts, safety_note: data.safetyNote ?? null,
        } as any).then(() => {}).catch(() => {});
      }
    } catch {
      setScripts(FALLBACK_SCRIPTS);
      setScriptsFallback(true);
    }
    setStep("show-scripts");
  }, [patternKeys, where, feelings, experienceId, addMsg]);

  const handleChoiceStories = useCallback(() => {
    addMsg("user", "Show me more stories");
    navigate("/stories" + (patternKeys[0] ? `?pattern=${patternKeys[0]}` : ""));
  }, [addMsg, navigate, patternKeys]);

  const handleChoiceDone = useCallback(async () => {
    addMsg("user", "That's all I needed");
    setStep("show-closing");
  }, [addMsg]);

  // After scripts shown, move to closing
  useEffect(() => {
    if (step !== "show-scripts") return;
    const t = setTimeout(() => setStep("show-closing"), 800);
    return () => clearTimeout(t);
  }, [step]);

  // Closing
  useEffect(() => {
    if (step !== "show-closing") return;
    const run = async () => {
      await typeAndSay(`"${getRandomAffirmation()}"`, 600);
      setStep("show-next-steps");
    };
    run();
  }, [step, typeAndSay]);

  useEffect(() => {
    if (step !== "show-next-steps") return;
    const run = async () => {
      await typeAndSay("Some things that might help:", 500);
      setStep("show-feedback");
    };
    run();
  }, [step, typeAndSay]);

  // Feedback submission
  const handleSubmitFeedback = useCallback(async () => {
    if (!experienceId) return;
    try {
      if (resonated) {
        await supabase.from("user_feedback").insert({ experience_id: experienceId, resonated });
      }
      if (contribute === true) {
        await supabase.from("experiences").update({ contributed: true }).eq("id", experienceId);
        const userFeelings = feelings.join(", ").split(", ").filter(Boolean);
        supabase.functions.invoke("generate-story", {
          body: {
            patternKeys, context: where, feeling: feelings.join(", "),
            selfDoubtDetected, validationMessage: aiResult?.validationMessage,
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
                experience_id: experienceId, title: data.title, story: data.story,
                primary_pattern: data.primaryPattern, story_type: "user",
                contains_sensitive_content: safetyResult.containsSensitiveContent,
                sensitive_content_type: safetyResult.sensitiveContentType,
                context: where ?? null,
                feeling: userFeelings[0] ?? null,
              } as any);
            }
          }
        }).catch(() => {});
      }
      setSubmitted(true);
      addMsg("user", "Submitted");
      await typeAndSay("Thank you for reflecting. You showed up for yourself today.", 600);
      setStep("show-journal-invite");
    } catch {
      toast({ title: "Something went wrong.", variant: "destructive" });
    }
  }, [experienceId, resonated, contribute, patternKeys, where, feelings, selfDoubtDetected, aiResult, addMsg, typeAndSay, toast]);

  // Share handler
  const handleCreateShare = useCallback(async () => {
    if (!experienceId) return;
    setShareLoading(true);
    try {
      const useAI = aiResult && aiResult.patterns.length > 0;
      const patternsData = patternKeys.map((key) => {
        const pat = getPatternByKey(key);
        const aiMatch = useAI ? aiResult!.patterns.find((p) => p.key === key) : null;
        const localMatch = localMatches.find((m) => m.pattern.key === key);
        return {
          key, title: pat?.title ?? key, explanation: pat?.explanation ?? "",
          confidence: aiMatch?.confidence ?? localMatch?.confidence ?? "low",
        };
      });
      const summaryData = {
        date: new Date().toISOString(), contextWhere: where ?? null,
        contextFeeling: feelings.join(", ") || null, patterns: patternsData,
        validationMessage: aiResult?.validationMessage ?? null,
      };
      const { data, error } = await supabase.from("shared_summaries").insert({
        experience_id: experienceId, summary_data: summaryData,
      } as any).select("id").single();
      if (error) throw error;
      setShareLink(`${window.location.origin}/shared/${data.id}`);
    } catch {
      toast({ title: "Could not create share link.", variant: "destructive" });
    } finally {
      setShareLoading(false);
    }
  }, [experienceId, aiResult, patternKeys, localMatches, where, feelings, toast]);

  const handleCopyShare = useCallback(async () => {
    if (!shareLink) return;
    await navigator.clipboard.writeText(shareLink);
    setShareCopied(true);
    toast({ title: "Link copied to clipboard" });
    setTimeout(() => setShareCopied(false), 2000);
  }, [shareLink, toast]);

  // ---- Current input mode ----
  const useAI = aiResult && aiResult.patterns.length > 0;
  const journalUserId = getSessionUserId();
  const topPatternKey = patternKeys[0];

  // ---- Render helpers for inline content ----
  const renderPatterns = () => {
    if (patternKeys.length === 0) {
      return (
        <ConversationBubble sender="app">
          <p className="text-sm text-foreground leading-relaxed">
            We couldn't identify a specific pattern, but that doesn't mean your experience wasn't real.
          </p>
        </ConversationBubble>
      );
    }
    return (
      <ConversationBubble sender="app">
        <div className="space-y-3">
          {lowConfidence && (
            <p className="text-xs text-muted-foreground italic mb-2">
              We weren't able to identify a specific pattern, but here are some common ones that may still be relevant.
            </p>
          )}
          {useAI
            ? aiResult!.patterns.map((aiMatch) => {
                const pattern = getPatternByKey(aiMatch.key);
                const rs = getResearchStat(aiMatch.key);
                return (
                  <div key={aiMatch.key} className="space-y-1.5">
                    <PatternCard patternKey={aiMatch.key} title={pattern?.title ?? aiMatch.key}
                      explanation={pattern?.explanation ?? ""} personalizedText={aiMatch.personalizedExplanation}
                      confidence={aiMatch.confidence} examples={pattern?.examples ?? []} actions={pattern?.actions ?? []} />
                    {rs && (
                      <p className="text-[11px] text-muted-foreground/60 leading-relaxed pl-1">
                        Research: {rs.stat} — <a href={rs.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-muted-foreground">{rs.source}</a>
                      </p>
                    )}
                  </div>
                );
              })
            : localMatches.map((match) => {
                const rs = getResearchStat(match.pattern.key);
                return (
                  <div key={match.pattern.key} className="space-y-1.5">
                    <PatternCard patternKey={match.pattern.key} title={match.pattern.title}
                      explanation={match.pattern.explanation} personalizedText={match.pattern.whyRelates}
                      confidence={match.confidence} examples={match.pattern.examples} actions={match.pattern.actions} />
                    {rs && (
                      <p className="text-[11px] text-muted-foreground/60 leading-relaxed pl-1">
                        Research: {rs.stat} — <a href={rs.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-muted-foreground">{rs.source}</a>
                      </p>
                    )}
                  </div>
                );
              })}
        </div>
      </ConversationBubble>
    );
  };

  const renderStories = () => {
    const userFeelings = feelings.join(", ").split(", ").filter(Boolean);
    if (matchingStories.length === 0) {
      return (
        <ConversationBubble sender="app">
          <p className="text-sm text-muted-foreground/70 italic">
            As more people reflect, stories will appear here. You're helping build that.
          </p>
        </ConversationBubble>
      );
    }
    return (
      <ConversationBubble sender="app">
        <div className="space-y-3">
          {matchingStories.map((s) => (
            <InlineStoryCard key={s.id} story={s} userContext={where ?? undefined} userFeeling={userFeelings[0]} />
          ))}
          {topPatternKey && (
            <Link to={`/stories?pattern=${topPatternKey}`} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
              <BookText className="w-3.5 h-3.5" aria-hidden="true" />Read more stories →
            </Link>
          )}
        </div>
      </ConversationBubble>
    );
  };

  // ---- Render ----
  return (
    <div id="main-content" className="min-h-screen flex flex-col relative" style={{ background: "var(--gradient-warm)" }}>
      {/* Back link */}
      <div className="px-4 pt-4 pb-2 relative z-10">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />Back
        </Link>
      </div>

      {/* Background glow */}
      <div className="absolute top-[200px] right-0 z-0 pointer-events-none opacity-40">
        <WarmGlow size={180} />
      </div>

      {/* Conversation area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-6 pb-4 relative z-10">
        <div className="max-w-2xl mx-auto space-y-3 pt-4">
          {/* Rendered message history */}
          {messages.map((msg) => (
            <ConversationBubble key={msg.id} sender={msg.sender} showIcon={msg.showIcon}>
              {msg.content}
            </ConversationBubble>
          ))}

          {/* Typing indicator */}
          {typing && <TypingIndicator />}

          {/* Inline interactive elements based on current step */}

          {/* Example prompts */}
          {step === "wait-description" && charCount === 0 && (
            <div className="flex items-start gap-2.5">
              <div className="w-7 shrink-0" />
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Not sure where to start?</p>
                {EXAMPLE_PROMPTS.map((prompt) => (
                  <button key={prompt} type="button" onClick={() => setDescription(prompt)}
                    className="block text-left text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors">
                    "{prompt}"
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Where pills */}
          {step === "wait-where" && (
            <div className="flex items-start gap-2.5">
              <div className="w-7 shrink-0" />
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {WHERE_OPTIONS.map((opt) => (
                    <button key={opt} type="button" onClick={() => handleSelectWhere(opt)}
                      className={`${PILL_BASE} ${PILL_INACTIVE}`}>{opt}</button>
                  ))}
                </div>
                <button type="button" onClick={handleSkipWhere} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Skip</button>
              </div>
            </div>
          )}

          {/* Feelings pills */}
          {step === "wait-feelings" && (
            <div className="flex items-start gap-2.5">
              <div className="w-7 shrink-0" />
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {FEELING_OPTIONS.map((opt) => {
                    const selected = feelings.includes(opt);
                    return (
                      <button key={opt} type="button"
                        onClick={() => setFeelings((prev) => selected ? prev.filter((v) => v !== opt) : [...prev, opt])}
                        className={`${PILL_BASE} ${selected ? PILL_ACTIVE : PILL_INACTIVE}`}>{opt}</button>
                    );
                  })}
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={handleConfirmFeelings}
                    className="text-xs text-primary hover:text-primary/80 font-medium transition-colors">
                    {feelings.length > 0 ? "Continue" : "Skip"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Doubt pills */}
          {step === "wait-doubt" && (
            <div className="flex items-start gap-2.5">
              <div className="w-7 shrink-0" />
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {DOUBT_OPTIONS.map((opt) => (
                    <button key={opt} type="button" onClick={() => handleSelectDoubt(opt)}
                      className={`${PILL_BASE} ${PILL_INACTIVE}`}>{opt}</button>
                  ))}
                </div>
                <button type="button" onClick={handleSkipDoubt} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Skip</button>
              </div>
            </div>
          )}

          {/* Safety interstitial */}
          {step === "safety-check" && (
            <ConversationBubble sender="app" showIcon>
              <div className="space-y-4" style={{ background: "hsl(15 40% 95%)", borderRadius: "1rem", padding: "1.25rem" }}>
                <div className="flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                  <div className="space-y-3">
                    <p className="text-base font-medium text-foreground">{strings.reflect.safetyHeading}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{strings.reflect.safetyBody}</p>
                    <CrisisResourceList />
                    <div className="flex flex-col sm:flex-row items-start gap-3 pt-2">
                      <Button asChild variant="secondary" size="sm" className="rounded-full gap-1.5">
                        <a href={getPrimaryHelpUrl(getCountry())} target="_blank" rel="noopener noreferrer">
                          {strings.reflect.safetyHelpNow} <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                        </a>
                      </Button>
                      <button type="button" onClick={handleDismissSafety}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors underline">
                        {strings.reflect.safetyContinue}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </ConversationBubble>
          )}

          {/* Patterns */}
          {(step === "show-patterns" || (
            ["show-stories-intro", "show-stories", "show-choices", "generating-scripts", "show-scripts",
             "show-closing", "show-next-steps", "show-feedback", "show-journal-invite", "done"
            ].includes(step)
          )) && renderPatterns()}

          {/* Stories */}
          {(step === "show-stories" || (
            ["show-choices", "generating-scripts", "show-scripts",
             "show-closing", "show-next-steps", "show-feedback", "show-journal-invite", "done"
            ].includes(step)
          )) && renderStories()}

          {/* Choices */}
          {step === "show-choices" && (
            <div className="flex items-start gap-2.5">
              <div className="w-7 shrink-0" />
              <div className="space-y-2">
                {[
                  { label: "Give me words to use", action: handleChoiceScripts },
                  { label: "Show me more stories", action: handleChoiceStories },
                  { label: "That's all I needed", action: handleChoiceDone },
                ].map((choice) => (
                  <button key={choice.label} type="button" onClick={choice.action}
                    className="block text-left px-4 py-3 rounded-2xl text-sm text-muted-foreground border border-dashed border-border hover:border-primary/40 hover:text-foreground transition-all bg-transparent w-full sm:w-auto">
                    {choice.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Scripts loading */}
          {step === "generating-scripts" && (
            <ConversationBubble sender="app">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground animate-pulse">Thinking of words that might help…</p>
                <LoadingAffirmation />
              </div>
            </ConversationBubble>
          )}

          {/* Scripts display */}
          {scripts && ["show-scripts", "show-closing", "show-next-steps", "show-feedback", "show-journal-invite", "done"].includes(step) && (
            <ConversationBubble sender="app">
              <div className="space-y-3">
                {scriptsFallback && (
                  <p className="text-xs text-muted-foreground italic">Here are some general approaches that often help:</p>
                )}
                {safetyNote && (
                  <div className="rounded-xl p-3 flex items-start gap-2" style={{ backgroundColor: "hsl(5,30%,94%)" }}>
                    <Shield className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" aria-hidden="true" />
                    <p className="text-sm text-foreground leading-relaxed">{safetyNote}</p>
                  </div>
                )}
                {scripts.map((s, i) => <ScriptCard key={i} script={s} />)}
              </div>
            </ConversationBubble>
          )}

          {/* Next steps */}
          {["show-next-steps", "show-feedback", "show-journal-invite", "done"].includes(step) && (
            <ConversationBubble sender="app">
              <ul className="space-y-2">
                <li className="text-sm text-muted-foreground leading-relaxed pl-3 border-l-2 border-primary/20">
                  Journal about this — putting it into words can help you process.
                </li>
                <li className="text-sm text-muted-foreground leading-relaxed pl-3 border-l-2 border-primary/20">
                  Talk to someone you trust — a friend, family member, or counselor.
                </li>
                <li className="text-sm text-muted-foreground leading-relaxed pl-3 border-l-2 border-primary/20">
                  Your experience is real, even if others minimize it.
                </li>
              </ul>
            </ConversationBubble>
          )}

          {/* Share section */}
          {["show-feedback", "show-journal-invite", "done"].includes(step) && (
            <ConversationBubble sender="app">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                  <p className="text-sm font-medium text-foreground">Share with someone you trust</p>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Create a private summary link. It expires after 7 days and never includes your written words.
                </p>
                {!shareLink ? (
                  <Button onClick={handleCreateShare} disabled={shareLoading} variant="outline" size="sm" className="rounded-full">
                    {shareLoading ? "Creating…" : "Create share link"}
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 rounded-xl bg-background p-2.5">
                      <LinkIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
                      <span className="text-xs text-foreground truncate flex-1">{shareLink}</span>
                      <button onClick={handleCopyShare} className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors shrink-0">
                        {shareCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {shareCopied ? "Copied" : "Copy"}
                      </button>
                    </div>
                    <p className="text-[10px] text-muted-foreground">Expires in 7 days. No written words are shared.</p>
                  </div>
                )}
              </div>
            </ConversationBubble>
          )}

          {/* Feedback */}
          {step === "show-feedback" && !submitted && (
            <ConversationBubble sender="app">
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Did any of these resonate?</p>
                  <div className="flex flex-wrap gap-2">
                    {["yes", "somewhat", "not really"].map((opt) => (
                      <button key={opt} onClick={() => setResonated(opt)}
                        className={`${PILL_BASE} ${resonated === opt ? PILL_ACTIVE : PILL_INACTIVE}`}>{opt}</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Would you like to anonymously share this experience to help others?</p>
                  <div className="flex flex-wrap gap-2">
                    {[{ label: "Yes", value: true }, { label: "No", value: false }].map((opt) => (
                      <button key={opt.label} onClick={() => setContribute(opt.value)}
                        className={`${PILL_BASE} ${contribute === opt.value ? PILL_ACTIVE : PILL_INACTIVE}`}>{opt.label}</button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Contributing means your anonymous patterns will be used to create a composite narrative. No identifying details.
                  </p>
                </div>
                <Button onClick={handleSubmitFeedback} disabled={!resonated} size="sm" className="rounded-full">
                  Submit reflection
                </Button>
              </div>
            </ConversationBubble>
          )}

          {/* Journal invite */}
          {step === "show-journal-invite" && (
            <ConversationBubble sender="app" showIcon>
              <div className="space-y-3">
                {journalUserId ? (
                  <>
                    <p className="text-sm text-foreground">This reflection has been saved to your journal.</p>
                    <Button asChild size="sm" className="rounded-full">
                      <Link to="/my-journal" className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4" aria-hidden="true" />View your journal
                      </Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <Heart className="w-6 h-6 text-primary/40" aria-hidden="true" />
                    <p className="text-sm font-medium text-foreground">Want to keep track of how you're feeling over time?</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Your private journal — no email, no account, just a passphrase.
                    </p>
                    <div className="flex items-center gap-3">
                      <Button asChild size="sm" className="rounded-full">
                        <Link to="/my-journal">Start my journal</Link>
                      </Button>
                      <Button asChild variant="outline" size="sm" className="rounded-full">
                        <Link to="/reflect" className="flex items-center gap-2">
                          <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />Reflect again
                        </Link>
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </ConversationBubble>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input bar */}
      {step === "wait-description" && (
        <div className="sticky bottom-0 z-20 border-t border-border/40 px-4 sm:px-6 py-3" style={{ backgroundColor: "hsl(33, 28%, 95%)" }}>
          <div className="max-w-2xl mx-auto flex items-end gap-3">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                placeholder="Tell us what happened…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && description.trim() && !overLimit) {
                    e.preventDefault();
                    handleSubmitDescription();
                  }
                }}
                className="min-h-[56px] max-h-[160px] text-base bg-card border-none rounded-2xl px-4 py-3 resize-none shadow-[var(--shadow-soft)] focus-visible:ring-primary/30 pr-12"
              />
              {charCount > 0 && (
                <span className={`absolute bottom-2 right-14 text-[10px] ${overLimit ? "text-destructive" : charCount >= 1800 ? "text-yellow-600" : "text-muted-foreground/50"}`}>
                  {charCount}/{MAX_CHARS}
                </span>
              )}
            </div>
            <button
              onClick={handleSubmitDescription}
              disabled={!description.trim() || overLimit}
              className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 disabled:opacity-40 transition-opacity hover:opacity-90"
              aria-label="Send"
            >
              <ArrowUp className="w-5 h-5" />
            </button>
          </div>
          <div className="max-w-2xl mx-auto flex items-center gap-3 mt-2">
            <Shield className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" aria-hidden="true" />
            <p className="text-[10px] text-muted-foreground/40">{strings.reflect.privacyHeading} {strings.reflect.privacyBody}</p>
          </div>
        </div>
      )}

      {/* Footer disclaimer */}
      {["show-journal-invite", "done"].includes(step) && (
        <div className="px-6 py-6 text-center relative z-10">
          <p className="text-xs text-muted-foreground/40 italic">"{getRandomAffirmation()}"</p>
          <p className="text-xs text-muted-foreground/60 mt-1">This tool does not provide legal, medical, or clinical advice.</p>
        </div>
      )}
    </div>
  );
};

export default Reflect;
