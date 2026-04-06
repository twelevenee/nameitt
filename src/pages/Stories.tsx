import { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Heart, PenLine, Flag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getPatternByKey } from "@/lib/patterns";
import { PATTERN_ICONS } from "@/lib/patternIcons";
import { formatDistanceToNow } from "date-fns";

const PILL_BASE = "px-3 py-2 rounded-full text-xs transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
const PILL_ACTIVE = "bg-primary text-primary-foreground";
const PILL_INACTIVE = "bg-secondary text-muted-foreground hover:bg-secondary/80";

const ALL_PATTERNS = [
  "emotional_invalidation", "benevolent_sexism", "gender_role_expectation",
  "objectification", "harassment", "public_intimidation", "safety_threat",
];

interface Story {
  id: string;
  title: string;
  story: string;
  primary_pattern: string;
  resonates: number;
  created_at: string;
}

const RESONATED_KEY = "resonated_stories";

const getResonated = (): Set<string> => {
  try {
    const raw = sessionStorage.getItem(RESONATED_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
};

const addResonated = (id: string) => {
  const set = getResonated();
  set.add(id);
  sessionStorage.setItem(RESONATED_KEY, JSON.stringify([...set]));
};

const PAGE_SIZE = 10;

const StoryCard = ({ story, onReport }: { story: Story; onReport: (id: string) => void }) => {
  const [resonated, setResonated] = useState(getResonated().has(story.id));
  const [count, setCount] = useState(story.resonates);
  const [animating, setAnimating] = useState(false);
  const { toast } = useToast();
  const pattern = getPatternByKey(story.primary_pattern);

  const handleResonate = async () => {
    if (resonated) return;
    setAnimating(true);
    setResonated(true);
    setCount((c) => c + 1);
    addResonated(story.id);
    setTimeout(() => setAnimating(false), 400);

    try {
      await supabase.rpc("increment_resonates", { story_id: story.id });
    } catch {
      toast({ title: "Could not save.", variant: "destructive" });
    }
  };

  return (
    <div className="rounded-2xl bg-card p-6 space-y-4 shadow-[var(--shadow-soft)]">
      <h3 className="text-base font-medium text-foreground">{story.title}</h3>
      <p className="text-sm text-foreground/80 leading-[1.75]">{story.story}</p>
      <div className="flex items-center gap-3 flex-wrap">
        {pattern && (
          <Badge variant="secondary" className="rounded-full text-xs gap-1.5">
            <span className="text-muted-foreground">{PATTERN_ICONS[story.primary_pattern]}</span>
            {pattern.title}
          </Badge>
        )}
        <span className="text-[11px] text-muted-foreground">
          {formatDistanceToNow(new Date(story.created_at), { addSuffix: true })}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <button
          onClick={handleResonate}
          disabled={resonated}
          className={`inline-flex items-center gap-1.5 text-xs transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded ${
            resonated ? "text-primary" : "text-muted-foreground hover:text-primary"
          }`}
          aria-label={resonated ? `${count} people relate` : "This resonates with me"}
        >
          <Heart
            className={`w-3.5 h-3.5 transition-transform duration-300 ${animating ? "scale-125" : ""} ${resonated ? "fill-current" : ""}`}
            aria-hidden="true"
          />
          {resonated
            ? count > 1 ? `${count} people relate` : "You relate"
            : "This resonates with me"}
        </button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
              <Flag className="w-3 h-3 inline mr-1" aria-hidden="true" />Report
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Report this story</AlertDialogTitle>
              <AlertDialogDescription>
                If this story contains identifying information or inappropriate content, reporting it will remove it from the feed for review.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => onReport(story.id)} className="rounded-full">Report</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

const Stories = () => {
  const [searchParams] = useSearchParams();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string | null>(searchParams.get("pattern"));
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const { toast } = useToast();

  useEffect(() => { document.title = "Stories — Was I Too Sensitive?"; }, []);

  const fetchStories = useCallback(async (pageNum: number, patternFilter: string | null, append = false) => {
    setLoading(true);
    try {
      let query = supabase
        .from("stories")
        .select("id, title, story, primary_pattern, resonates, created_at")
        .order("created_at", { ascending: false })
        .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);

      if (patternFilter) {
        query = query.eq("primary_pattern", patternFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      const rows = (data ?? []) as Story[];
      setStories((prev) => append ? [...prev, ...rows] : rows);
      setHasMore(rows.length === PAGE_SIZE);
    } catch {
      toast({ title: "Could not load stories.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    setPage(0);
    fetchStories(0, filter);
  }, [filter, fetchStories]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchStories(next, filter, true);
  };

  const handleReport = async (id: string) => {
    try {
      await supabase.from("stories").update({ reported: true } as any).eq("id", id);
      setStories((prev) => prev.filter((s) => s.id !== id));
      toast({ title: "Thank you. This story has been flagged for review." });
    } catch {
      toast({ title: "Could not report story.", variant: "destructive" });
    }
  };

  return (
    <div id="main-content" className="min-h-screen px-6 py-10" style={{ background: "var(--gradient-warm)" }}>
      <div className="max-w-2xl mx-auto space-y-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />Home
        </Link>

        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl text-foreground tracking-tight">Stories</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">Anonymous reflections from people who questioned their experiences.</p>
        </div>

        {/* Pattern filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide" role="radiogroup" aria-label="Filter by pattern">
          <button
            role="radio"
            aria-checked={filter === null}
            onClick={() => setFilter(null)}
            className={`${PILL_BASE} whitespace-nowrap ${filter === null ? PILL_ACTIVE : PILL_INACTIVE}`}
          >
            All
          </button>
          {ALL_PATTERNS.map((key) => {
            const pat = getPatternByKey(key);
            return (
              <button
                key={key}
                role="radio"
                aria-checked={filter === key}
                onClick={() => setFilter(key)}
                className={`${PILL_BASE} whitespace-nowrap ${filter === key ? PILL_ACTIVE : PILL_INACTIVE}`}
              >
                {pat?.title ?? key}
              </button>
            );
          })}
        </div>

        {/* Stories feed */}
        {!loading && stories.length === 0 ? (
          <div className="rounded-2xl bg-card p-8 text-center space-y-4 shadow-[var(--shadow-soft)]">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Stories will appear here as people choose to share their reflections. Every story helps someone else feel less alone.
            </p>
            <Button asChild className="rounded-full">
              <Link to="/reflect" className="inline-flex items-center gap-2">
                <PenLine className="w-4 h-4" aria-hidden="true" />Reflect on an experience
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {stories.map((s) => <StoryCard key={s.id} story={s} onReport={handleReport} />)}

            {loading && <p className="text-sm text-muted-foreground text-center py-4" role="status">Loading…</p>}

            {hasMore && !loading && stories.length > 0 && (
              <div className="text-center pt-2">
                <Button variant="ghost" onClick={loadMore} className="rounded-full text-sm text-muted-foreground">
                  Load more stories
                </Button>
              </div>
            )}
          </div>
        )}

        <p className="text-xs text-muted-foreground/60 text-center pb-6">
          These stories are AI-generated from anonymous reflection data. No identifying information is included.
        </p>
      </div>
    </div>
  );
};

export default Stories;
