import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Lock, Copy, Check, BookOpen, PenLine } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { generatePassphrase } from "@/lib/wordlist";
import {
  hashPassphrase,
  getSessionHash,
  getSessionUserId,
  setSession,
  clearSession,
} from "@/lib/journal-auth";
import { getPatternByKey } from "@/lib/patterns";
import { PATTERN_ICONS } from "@/lib/patternIcons";

interface JournalEntry {
  id: string;
  created_at: string;
  context_where: string | null;
  context_feeling: string | null;
  self_doubt: string | null;
  analyses: {
    detected_patterns: unknown;
    self_doubt_detected: boolean;
  }[];
}

const CONFIDENCE_LABELS: Record<string, string> = {
  high: "Strong match",
  medium: "Possible match",
  low: "Worth considering",
};

// --- Passphrase Auth Screen ---

const PassphraseScreen = ({ onAuthenticated }: { onAuthenticated: () => void }) => {
  const [mode, setMode] = useState<"choose" | "create" | "enter">("choose");
  const [passphrase, setPassphrase] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleCreate = () => {
    setPassphrase(generatePassphrase());
    setMode("create");
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(passphrase);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirmCreate = async () => {
    setLoading(true);
    try {
      const hash = await hashPassphrase(passphrase);
      const { data, error } = await supabase
        .from("journal_users")
        .insert({ passphrase_hash: hash })
        .select("id")
        .single();
      if (error) throw error;
      setSession(hash, data.id);
      onAuthenticated();
    } catch {
      toast({ title: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!inputValue.trim()) return;
    setLoading(true);
    try {
      const hash = await hashPassphrase(inputValue);
      const { data, error } = await supabase
        .from("journal_users")
        .select("id")
        .eq("passphrase_hash", hash)
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        toast({ title: "Passphrase not recognized. Please check and try again." });
        setLoading(false);
        return;
      }
      setSession(hash, data.id);
      onAuthenticated();
    } catch {
      toast({ title: "Something went wrong. Please try again.", variant: "destructive" });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-6 py-10 flex items-center justify-center" style={{ background: "var(--gradient-warm)" }}>
      <div className="max-w-md w-full space-y-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Back
        </Link>

        <div className="space-y-2 text-center">
          <BookOpen className="w-8 h-8 text-primary mx-auto" aria-hidden="true" />
          <h1 className="text-2xl sm:text-3xl text-foreground tracking-tight">Your Private Journal</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Access your reflections with a private passphrase. No email, no account.
          </p>
        </div>

        {mode === "choose" && (
          <div className="space-y-3">
            <Button onClick={handleCreate} className="w-full rounded-full h-12 text-base">
              Create a private passphrase
            </Button>
            <Button onClick={() => setMode("enter")} variant="outline" className="w-full rounded-full h-12 text-base">
              I already have a passphrase
            </Button>
          </div>
        )}

        {mode === "create" && (
          <div className="space-y-6">
            <div className="rounded-2xl bg-card p-6 space-y-4 shadow-[var(--shadow-soft)] text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Your passphrase</p>
              <p className="text-xl sm:text-2xl font-semibold text-foreground tracking-wide break-all">
                {passphrase}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="rounded-full text-xs gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied" : "Copy to clipboard"}
              </Button>
            </div>

            <div className="rounded-2xl bg-accent/40 p-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                <span className="font-medium text-foreground/70">Important:</span> This is your only key to your journal. We don't store it — if you lose it, we can't recover your reflections. Write it down somewhere safe.
              </p>
            </div>

            <Button
              onClick={handleConfirmCreate}
              disabled={loading}
              className="w-full rounded-full h-12 text-base"
            >
              {loading ? "Creating…" : "I've saved my passphrase"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setMode("choose")}
              className="w-full rounded-full text-sm text-muted-foreground"
            >
              Go back
            </Button>
          </div>
        )}

        {mode === "enter" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="passphrase-input" className="text-sm font-medium text-foreground">
                Enter your passphrase
              </label>
              <Input
                id="passphrase-input"
                type="text"
                placeholder="gentle-river-morning-sky"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className="rounded-xl h-12 text-base bg-card border-none shadow-[var(--shadow-soft)]"
              />
            </div>
            <Button
              onClick={handleLogin}
              disabled={loading || !inputValue.trim()}
              className="w-full rounded-full h-12 text-base"
            >
              {loading ? "Checking…" : "Open my journal"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setMode("choose")}
              className="w-full rounded-full text-sm text-muted-foreground"
            >
              Go back
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Journal Timeline ---

const JournalTimeline = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const userId = getSessionUserId();

  useEffect(() => {
    document.title = "My Journal — Was I Too Sensitive?";
  }, []);

  useEffect(() => {
    if (!userId) return;
    const fetchEntries = async () => {
      try {
        const { data, error } = await supabase
          .from("experiences")
          .select("id, created_at, context_where, context_feeling, self_doubt, analyses(detected_patterns, self_doubt_detected)")
          .eq("journal_user_id", userId)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setEntries((data as unknown as JournalEntry[]) ?? []);
      } catch {
        toast({ title: "Could not load your journal.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchEntries();
  }, [userId, toast]);

  const handleLock = () => {
    clearSession();
    navigate("/");
  };

  return (
    <div id="main-content" className="min-h-screen px-6 py-10" style={{ background: "var(--gradient-warm)" }}>
      <div className="max-w-2xl mx-auto space-y-10">
        <div className="flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Home
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLock}
            className="rounded-full text-xs text-muted-foreground gap-1.5"
          >
            <Lock className="w-3.5 h-3.5" aria-hidden="true" />
            Lock journal
          </Button>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl text-foreground tracking-tight">My Journal</h1>
          <p className="text-muted-foreground text-sm">Your private reflection timeline.</p>
        </div>

        {loading ? (
          <p className="text-muted-foreground text-center py-16" role="status">Loading your reflections…</p>
        ) : entries.length === 0 ? (
          <div className="rounded-2xl bg-card p-8 text-center space-y-4 shadow-[var(--shadow-soft)]">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your journal is empty. When you reflect on an experience, it will appear here.
            </p>
            <Button asChild className="rounded-full">
              <Link to="/reflect" className="inline-flex items-center gap-2">
                <PenLine className="w-4 h-4" aria-hidden="true" />
                Reflect on an experience
              </Link>
            </Button>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-2 bottom-2 w-px bg-border/60" aria-hidden="true" />

            <div className="space-y-6">
              {entries.map((entry) => {
                const analysis = entry.analyses?.[0];
                const patterns = Array.isArray(analysis?.detected_patterns)
                  ? (analysis.detected_patterns as string[])
                  : [];
                const date = new Date(entry.created_at);

                return (
                  <div key={entry.id} className="relative pl-10">
                    {/* Timeline dot */}
                    <div className="absolute left-2.5 top-5 w-3 h-3 rounded-full bg-primary/40 border-2 border-background" aria-hidden="true" />

                    <div className="rounded-2xl bg-card p-5 sm:p-6 space-y-3 shadow-[var(--shadow-soft)]">
                      <p className="text-xs text-muted-foreground">
                        {date.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {entry.context_where && (
                          <Badge variant="secondary" className="rounded-full text-xs">{entry.context_where}</Badge>
                        )}
                        {entry.context_feeling && entry.context_feeling.split(", ").map((f) => (
                          <Badge key={f} variant="secondary" className="rounded-full text-xs">{f}</Badge>
                        ))}
                        {entry.self_doubt && (
                          <Badge variant="outline" className="rounded-full text-xs">Self-doubt: {entry.self_doubt}</Badge>
                        )}
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
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Main Component ---

const Journal = () => {
  const [authenticated, setAuthenticated] = useState(!!getSessionUserId());

  if (!authenticated) {
    return <PassphraseScreen onAuthenticated={() => setAuthenticated(true)} />;
  }

  return <JournalTimeline />;
};

export default Journal;
