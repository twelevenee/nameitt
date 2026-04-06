import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  ArrowLeft, Lock, Copy, Check, BookOpen, PenLine,
  Sun, Sprout, Cloud, CloudRain, Heart, ChevronDown, ExternalLink,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { generatePassphrase } from "@/lib/wordlist";
import {
  hashPassphrase,
  getSessionUserId,
  setSession,
  clearSession,
} from "@/lib/journal-auth";
import { getPatternByKey } from "@/lib/patterns";
import { PATTERN_ICONS } from "@/lib/patternIcons";
import { detectEscalation, FEELING_SCORES } from "@/lib/escalation";
import type { EscalationResult } from "@/lib/escalation";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Dot } from "recharts";
import { getRandomAffirmation } from "@/lib/affirmations";
import { QuietScene, WarmGlow } from "@/components/Illustrations";

// --- Types ---

interface JournalExperience {
  id: string;
  type: "experience";
  created_at: string;
  context_where: string | null;
  context_feeling: string | null;
  self_doubt: string | null;
  analyses: { detected_patterns: unknown; self_doubt_detected: boolean }[];
  scripts: { scripts: unknown; safety_note: string | null }[];
}

interface JournalCheckin {
  id: string;
  type: "checkin";
  created_at: string;
  feeling: string;
}

type TimelineItem = JournalExperience | JournalCheckin;

// --- Constants ---

const FEELING_OPTIONS = [
  { label: "Much safer", icon: Sun, color: "hsl(140, 30%, 55%)" },
  { label: "A little better", icon: Sprout, color: "hsl(140, 20%, 65%)" },
  { label: "About the same", icon: Cloud, color: "hsl(35, 20%, 60%)" },
  { label: "Things feel harder", icon: CloudRain, color: "hsl(30, 40%, 55%)" },
  { label: "I need support", icon: Heart, color: "hsl(5, 40%, 60%)" },
];

const FEELING_COLOR_MAP: Record<string, string> = Object.fromEntries(
  FEELING_OPTIONS.map((f) => [f.label, f.color])
);

const RESOURCES = [
  { name: "RAINN", url: "https://rainn.org", desc: "Support for sexual violence" },
  { name: "National Domestic Violence Hotline", url: "https://thehotline.org", desc: "24/7 support" },
  { name: "Crisis Text Line", url: "https://crisistextline.org", desc: "Text HOME to 741741" },
];

const PILL_BASE = "px-3 py-2 rounded-full text-xs transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 flex items-center gap-1.5";
const PILL_ACTIVE = "bg-primary text-primary-foreground";
const PILL_INACTIVE = "bg-secondary text-muted-foreground hover:bg-secondary/80";

// --- Passphrase Auth Screen ---

const PassphraseScreen = ({ onAuthenticated }: { onAuthenticated: () => void }) => {
  const [mode, setMode] = useState<"choose" | "create" | "enter">("choose");
  const [passphrase, setPassphrase] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleCreate = () => { setPassphrase(generatePassphrase()); setMode("create"); };
  const handleCopy = async () => { await navigator.clipboard.writeText(passphrase); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const handleConfirmCreate = async () => {
    setLoading(true);
    try {
      const hash = await hashPassphrase(passphrase);
      const { data, error } = await supabase.from("journal_users").insert({ passphrase_hash: hash }).select("id").single();
      if (error) throw error;
      setSession(hash, data.id);
      onAuthenticated();
    } catch { toast({ title: "Something went wrong. Please try again.", variant: "destructive" }); }
    finally { setLoading(false); }
  };

  const handleLogin = async () => {
    if (!inputValue.trim()) return;
    setLoading(true);
    try {
      const hash = await hashPassphrase(inputValue);
      const { data, error } = await supabase.from("journal_users").select("id").eq("passphrase_hash", hash).maybeSingle();
      if (error) throw error;
      if (!data) { toast({ title: "Passphrase not recognized. Please check and try again." }); setLoading(false); return; }
      setSession(hash, data.id);
      onAuthenticated();
    } catch { toast({ title: "Something went wrong. Please try again.", variant: "destructive" }); setLoading(false); }
  };

  return (
    <div className="min-h-screen px-6 py-10 flex items-center justify-center" style={{ background: "var(--gradient-warm)" }}>
      <div className="max-w-md w-full space-y-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />Back
        </Link>
        <div className="space-y-2 text-center">
          <BookOpen className="w-8 h-8 text-primary mx-auto" aria-hidden="true" />
          <h1 className="text-2xl sm:text-3xl text-foreground tracking-tight">Your Private Journal</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">Access your reflections with a private passphrase. No email, no account.</p>
        </div>

        {mode === "choose" && (
          <div className="space-y-3">
            <Button onClick={handleCreate} className="w-full rounded-full h-12 text-base">Create a private passphrase</Button>
            <Button onClick={() => setMode("enter")} variant="outline" className="w-full rounded-full h-12 text-base">I already have a passphrase</Button>
          </div>
        )}

        {mode === "create" && (
          <div className="space-y-6">
            <div className="rounded-2xl bg-card p-6 space-y-4 shadow-[var(--shadow-soft)] text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Your passphrase</p>
              <p className="text-xl sm:text-2xl font-semibold text-foreground tracking-wide break-all">{passphrase}</p>
              <Button variant="ghost" size="sm" onClick={handleCopy} className="rounded-full text-xs gap-1.5">
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied" : "Copy to clipboard"}
              </Button>
            </div>
            <div className="rounded-2xl bg-accent/40 p-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                <span className="font-medium text-foreground/70">Important:</span> This is your only key to your journal. We don't store it — if you lose it, we can't recover your reflections.
              </p>
            </div>
            <Button onClick={handleConfirmCreate} disabled={loading} className="w-full rounded-full h-12 text-base">{loading ? "Creating…" : "I've saved my passphrase"}</Button>
            <Button variant="ghost" onClick={() => setMode("choose")} className="w-full rounded-full text-sm text-muted-foreground">Go back</Button>
          </div>
        )}

        {mode === "enter" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="passphrase-input" className="text-sm font-medium text-foreground">Enter your passphrase</label>
              <Input id="passphrase-input" type="text" placeholder="gentle-river-morning-sky" value={inputValue}
                onChange={(e) => setInputValue(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className="rounded-xl h-12 text-base bg-card border-none shadow-[var(--shadow-soft)]" />
            </div>
            <Button onClick={handleLogin} disabled={loading || !inputValue.trim()} className="w-full rounded-full h-12 text-base">{loading ? "Checking…" : "Open my journal"}</Button>
            <Button variant="ghost" onClick={() => setMode("choose")} className="w-full rounded-full text-sm text-muted-foreground">Go back</Button>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Check-In Card ---

const CheckInCard = ({ userId, onComplete }: { userId: string; onComplete: () => void }) => {
  const [feeling, setFeeling] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!feeling) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("checkins").insert({
        journal_user_id: userId,
        feeling,
        note: "[not stored for privacy]",
      });
      if (error) throw error;
      setDone(true);
      onComplete();
    } catch {
      toast({ title: "Could not save check-in.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-2xl bg-card p-5 shadow-[var(--shadow-soft)] text-center">
        <p className="text-sm text-foreground">Thank you for checking in.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-card p-5 sm:p-6 space-y-4 shadow-[var(--shadow-soft)]">
      <p className="text-base font-medium text-foreground">How have you been feeling lately?</p>
      <div className="flex flex-wrap gap-2">
        {FEELING_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          return (
            <button
              key={opt.label}
              type="button"
              onClick={() => setFeeling(opt.label)}
              className={`${PILL_BASE} ${feeling === opt.label ? PILL_ACTIVE : PILL_INACTIVE}`}
            >
              <Icon className="w-3.5 h-3.5" aria-hidden="true" />
              {opt.label}
            </button>
          );
        })}
      </div>
      <div className="space-y-1.5">
        <label htmlFor="checkin-note" className="text-xs text-muted-foreground">Anything you want to note? (optional)</label>
        <Textarea
          id="checkin-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="How things have been…"
          className="min-h-[60px] text-sm bg-background border-none rounded-xl p-3 resize-none shadow-[var(--shadow-card)]"
        />
      </div>
      <Button onClick={handleSave} disabled={!feeling || saving} className="rounded-full h-10 text-sm">
        {saving ? "Saving…" : "Save check-in"}
      </Button>
    </div>
  );
};

// --- Escalation Card ---

const EscalationCard = ({ result }: { result: EscalationResult }) => {
  const [expanded, setExpanded] = useState(false);
  if (result.level === "none") return null;

  const bgClass = result.level === "urgent"
    ? "bg-[hsl(5,30%,94%)]"
    : result.level === "concerned"
    ? "bg-[hsl(35,30%,93%)]"
    : "bg-primary/5";

  return (
    <div className={`rounded-2xl ${bgClass} p-5 sm:p-6 space-y-3`}>
      <p className="text-sm text-foreground leading-relaxed">{result.message}</p>

      {result.level === "gentle" && (
        <Collapsible open={expanded} onOpenChange={setExpanded}>
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded" aria-expanded={expanded}>
              Learn more <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? "rotate-180" : ""}`} aria-hidden="true" />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2 space-y-1">
            {result.signals.map((s, i) => (
              <p key={i} className="text-xs text-muted-foreground leading-relaxed">• {s}</p>
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}

      {result.showResources && (
        <div className="space-y-2 pt-1">
          {result.level === "urgent" && (
            <p className="text-base font-semibold text-foreground">Text HOME to 741741 for free crisis support</p>
          )}
          {RESOURCES.map((r) => (
            <a key={r.url} href={r.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ExternalLink className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span><span className="font-medium text-foreground/80">{r.name}</span> — {r.desc}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Wellbeing Chart ---

const WellbeingChart = ({ checkins }: { checkins: JournalCheckin[] }) => {
  if (checkins.length < 3) return null;

  const sorted = [...checkins].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  const data = sorted.map((c) => ({
    date: new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    score: FEELING_SCORES[c.feeling] ?? 3,
  }));

  return (
    <div className="rounded-2xl bg-card p-5 sm:p-6 space-y-3 shadow-[var(--shadow-soft)]">
      <ResponsiveContainer width="100%" height={120}>
        <LineChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: 10 }}>
          <XAxis dataKey="date" hide />
          <YAxis domain={[1, 5]} hide />
          <Line
            type="monotone"
            dataKey="score"
            stroke="hsl(230, 30%, 65%)"
            strokeWidth={2}
            dot={<Dot r={4} fill="hsl(230, 30%, 65%)" stroke="hsl(230, 30%, 65%)" />}
          />
        </LineChart>
      </ResponsiveContainer>
      <p className="text-xs text-muted-foreground text-center">Your wellbeing over time</p>
    </div>
  );
};

// --- Pattern Summary ---

const PatternSummary = ({ experiences, latestPatterns }: { experiences: JournalExperience[]; latestPatterns: string[] }) => {
  const countMap: Record<string, number> = {};
  for (const exp of experiences) {
    const patterns = Array.isArray(exp.analyses?.[0]?.detected_patterns)
      ? (exp.analyses[0].detected_patterns as string[])
      : [];
    for (const p of patterns) {
      countMap[p] = (countMap[p] || 0) + 1;
    }
  }

  const sorted = Object.entries(countMap).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) return null;

  // Determine which patterns are "new" (only in most recent experience)
  const olderPatterns = new Set<string>();
  for (let i = 1; i < experiences.length; i++) {
    const pats = Array.isArray(experiences[i].analyses?.[0]?.detected_patterns)
      ? (experiences[i].analyses[0].detected_patterns as string[])
      : [];
    pats.forEach((p) => olderPatterns.add(p));
  }

  return (
    <div className="rounded-2xl bg-card p-5 sm:p-6 space-y-3 shadow-[var(--shadow-soft)]">
      <p className="text-sm font-medium text-foreground">Patterns across your reflections</p>
      <div className="space-y-2">
        {sorted.map(([key, count]) => {
          const pat = getPatternByKey(key);
          const isNew = latestPatterns.includes(key) && !olderPatterns.has(key);
          return (
            <div key={key} className="flex items-center gap-2">
              <span className="text-muted-foreground shrink-0">{PATTERN_ICONS[key]}</span>
              <span className="text-sm text-foreground flex-1">{pat?.title ?? key}</span>
              <span className="text-xs text-muted-foreground">{count} {count === 1 ? "reflection" : "reflections"}</span>
              {isNew && <Badge variant="secondary" className="rounded-full text-[10px] px-1.5 py-0">new</Badge>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// --- Journal Timeline ---

const JournalTimeline = () => {
  const [experiences, setExperiences] = useState<JournalExperience[]>([]);
  const [checkins, setCheckins] = useState<JournalCheckin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCheckin, setShowCheckin] = useState(false);
  const [escalation, setEscalation] = useState<EscalationResult | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const userId = getSessionUserId();

  useEffect(() => { document.title = "My Journal — Was I Too Sensitive?"; }, []);

  const fetchData = async () => {
    if (!userId) return;
    try {
      const [expRes, checkinRes] = await Promise.all([
        supabase
          .from("experiences")
          .select("id, created_at, context_where, context_feeling, self_doubt, analyses(detected_patterns, self_doubt_detected), scripts(scripts, safety_note)")
          .eq("journal_user_id", userId)
          .order("created_at", { ascending: false }),
        supabase
          .from("checkins")
          .select("id, created_at, feeling")
          .eq("journal_user_id", userId)
          .order("created_at", { ascending: false }),
      ]);

      const exps = ((expRes.data ?? []) as unknown as JournalExperience[]).map((e) => ({ ...e, type: "experience" as const }));
      const chks = ((checkinRes.data ?? []) as unknown as JournalCheckin[]).map((c) => ({ ...c, type: "checkin" as const }));

      setExperiences(exps);
      setCheckins(chks);

      // Determine if check-in should show (no check-in in last 5 days)
      const fiveDaysAgo = Date.now() - 5 * 24 * 60 * 60 * 1000;
      const recentCheckin = chks.find((c) => new Date(c.created_at).getTime() > fiveDaysAgo);
      setShowCheckin(!recentCheckin);

      // Run escalation detection
      const escExps = exps.map((e) => ({
        created_at: e.created_at,
        patterns: Array.isArray(e.analyses?.[0]?.detected_patterns)
          ? (e.analyses[0].detected_patterns as string[])
          : [],
      }));
      const escCheckins = chks.map((c) => ({ created_at: c.created_at, feeling: c.feeling }));
      setEscalation(detectEscalation(escExps, escCheckins));
    } catch {
      toast({ title: "Could not load your journal.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [userId]);

  const handleLock = () => { clearSession(); navigate("/"); };

  // Interleave timeline items
  const timeline: TimelineItem[] = [
    ...experiences,
    ...checkins,
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const latestPatterns = experiences.length > 0 && Array.isArray(experiences[0].analyses?.[0]?.detected_patterns)
    ? (experiences[0].analyses[0].detected_patterns as string[])
    : [];

  return (
    <div id="main-content" className="min-h-screen px-6 py-10" style={{ background: "var(--gradient-warm)" }}>
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />Home
          </Link>
          <Button variant="ghost" size="sm" onClick={handleLock} className="rounded-full text-xs text-muted-foreground gap-1.5">
            <Lock className="w-3.5 h-3.5" aria-hidden="true" />Lock journal
          </Button>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl text-foreground tracking-tight">My Journal</h1>
          <p className="text-muted-foreground text-sm italic">"{getRandomAffirmation()}"</p>
        </div>

        {loading ? (
          <p className="text-muted-foreground text-center py-16" role="status">Loading your reflections…</p>
        ) : (
          <>
            {/* Check-in prompt with warm glow */}
            {showCheckin && userId && (
              <div className="relative">
                <div className="absolute -top-6 -right-6 z-0 pointer-events-none opacity-50">
                  <WarmGlow size={140} />
                </div>
                <div className="relative z-10">
                  <CheckInCard userId={userId} onComplete={() => { setShowCheckin(false); fetchData(); }} />
                </div>
              </div>
            )}

            {/* Escalation message */}
            {escalation && escalation.level !== "none" && <EscalationCard result={escalation} />}

            {/* Wellbeing chart */}
            <WellbeingChart checkins={checkins} />

            {/* Pattern summary */}
            {experiences.length > 0 && <PatternSummary experiences={experiences} latestPatterns={latestPatterns} />}

            {/* Timeline */}
            {timeline.length === 0 ? (
              <div className="rounded-2xl bg-card p-8 text-center space-y-6 shadow-[var(--shadow-soft)]">
                <div className="flex justify-center">
                  <QuietScene className="w-48 h-36 opacity-60" />
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  This is your space. Nothing here yet, and that's perfectly okay. When you're ready to reflect, your thoughts will live here.
                </p>
                <Button asChild className="rounded-full">
                  <Link to="/reflect" className="inline-flex items-center gap-2">
                    <PenLine className="w-4 h-4" aria-hidden="true" />Begin your first reflection
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-4 top-2 bottom-2 w-px bg-border/60" aria-hidden="true" />
                <div className="space-y-4">
                  {timeline.map((item) => {
                    if (item.type === "checkin") {
                      const checkin = item as JournalCheckin;
                      const date = new Date(checkin.created_at);
                      const color = FEELING_COLOR_MAP[checkin.feeling] ?? "hsl(35, 20%, 60%)";
                      const FeelingIcon = FEELING_OPTIONS.find((f) => f.label === checkin.feeling)?.icon ?? Cloud;

                      return (
                        <div key={checkin.id} className="relative pl-10">
                          <div className="absolute left-2.5 top-3.5 w-3 h-3 rounded-full border-2 border-background" style={{ backgroundColor: color }} aria-hidden="true" />
                          <div className="rounded-xl bg-card/70 px-4 py-3 shadow-[var(--shadow-card)] flex items-center gap-3">
                            <FeelingIcon className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-foreground">{checkin.feeling}</p>
                              <p className="text-[11px] text-muted-foreground">
                                {date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // Experience entry
                    const entry = item as JournalExperience;
                    const analysis = entry.analyses?.[0];
                    const patterns = Array.isArray(analysis?.detected_patterns)
                      ? (analysis.detected_patterns as string[])
                      : [];
                    const date = new Date(entry.created_at);

                    return (
                      <div key={entry.id} className="relative pl-10">
                        <div className="absolute left-2.5 top-5 w-3 h-3 rounded-full bg-primary/40 border-2 border-background" aria-hidden="true" />
                        <div className="rounded-2xl bg-card p-5 sm:p-6 space-y-3 shadow-[var(--shadow-soft)]">
                          <p className="text-xs text-muted-foreground">
                            {date.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {entry.context_where && <Badge variant="secondary" className="rounded-full text-xs">{entry.context_where}</Badge>}
                            {entry.context_feeling?.split(", ").map((f) => (
                              <Badge key={f} variant="secondary" className="rounded-full text-xs">{f}</Badge>
                            ))}
                            {entry.self_doubt && <Badge variant="outline" className="rounded-full text-xs">Self-doubt: {entry.self_doubt}</Badge>}
                          </div>
                          {patterns.length > 0 && (
                            <div className="space-y-2 pt-1">
                              <p className="text-xs font-medium text-muted-foreground">Detected patterns</p>
                              <div className="space-y-1.5">
                                {patterns.map((key) => {
                                  const pat = getPatternByKey(key);
                                  return (
                                    <div key={key} className="flex items-center gap-2">
                                      <span className="text-muted-foreground shrink-0">{PATTERN_ICONS[key]}</span>
                                      <span className="text-sm text-foreground">{pat?.title ?? key}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          {analysis?.self_doubt_detected && (
                            <p className="text-xs text-muted-foreground italic">Self-doubt was detected in this reflection</p>
                          )}
                          {entry.scripts?.[0]?.scripts && (
                            <Collapsible>
                              <CollapsibleTrigger asChild>
                                <button className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors pt-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
                                  Your practiced responses
                                  <ChevronDown className="w-3 h-3" aria-hidden="true" />
                                </button>
                              </CollapsibleTrigger>
                              <CollapsibleContent className="pt-2 space-y-2">
                                {(Array.isArray(entry.scripts[0].scripts) ? entry.scripts[0].scripts as { tone: string; text: string; why: string }[] : []).map((s, i) => (
                                  <div key={i} className="rounded-xl bg-background/60 p-3 space-y-1">
                                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{s.tone}</p>
                                    <p className="text-sm text-foreground leading-relaxed">"{s.text}"</p>
                                  </div>
                                ))}
                              </CollapsibleContent>
                            </Collapsible>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// --- Main Component ---

const Journal = () => {
  const [authenticated, setAuthenticated] = useState(!!getSessionUserId());
  if (!authenticated) return <PassphraseScreen onAuthenticated={() => setAuthenticated(true)} />;
  return <JournalTimeline />;
};

export default Journal;
