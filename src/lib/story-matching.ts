import { supabase } from "@/integrations/supabase/client";

export interface StoryMatchParams {
  patternKeys: string[];
  context?: string;
  feelings?: string[];
}

export interface MatchedStory {
  id: string;
  title: string;
  story: string;
  primary_pattern: string;
  secondary_pattern: string | null;
  context: string | null;
  feeling: string | null;
  created_at: string;
  story_type: string;
  contains_sensitive_content: boolean;
  sensitive_content_type: string | null;
  source_note: string | null;
}

const STORY_COLS = "id, title, story, primary_pattern, secondary_pattern, context, feeling, created_at, story_type, contains_sensitive_content, sensitive_content_type, source_note";

export async function findMatchingStories(
  params: StoryMatchParams,
  limit: number = 3
): Promise<MatchedStory[]> {
  const { patternKeys, context, feelings } = params;
  if (patternKeys.length === 0) return [];

  const seen = new Set<string>();
  const result: MatchedStory[] = [];

  const addStories = (stories: MatchedStory[]) => {
    // Sort: user stories first, then by feeling match
    const primaryFeeling = feelings?.[0]?.toLowerCase();
    const sorted = [...stories].sort((a, b) => {
      // user > seed
      if (a.story_type !== b.story_type) {
        return a.story_type === "user" ? -1 : 1;
      }
      // feeling match
      if (primaryFeeling) {
        const aMatch = a.feeling?.toLowerCase() === primaryFeeling ? 1 : 0;
        const bMatch = b.feeling?.toLowerCase() === primaryFeeling ? 1 : 0;
        if (aMatch !== bMatch) return bMatch - aMatch;
      }
      return 0;
    });
    for (const s of sorted) {
      if (result.length >= limit) break;
      if (seen.has(s.id)) continue;
      seen.add(s.id);
      result.push(s);
    }
  };

  try {
    // Priority 1: primary_pattern + context
    if (context) {
      const { data } = await supabase
        .from("stories")
        .select(STORY_COLS)
        .in("primary_pattern", patternKeys)
        .eq("context", context)
        .eq("reported", false)
        .order("created_at", { ascending: false })
        .limit(limit * 2);
      if (data) addStories(data as MatchedStory[]);
    }

    // Priority 2: primary_pattern only
    if (result.length < limit) {
      const { data } = await supabase
        .from("stories")
        .select(STORY_COLS)
        .in("primary_pattern", patternKeys)
        .eq("reported", false)
        .order("created_at", { ascending: false })
        .limit(limit * 3);
      if (data) addStories(data as MatchedStory[]);
    }

    // Priority 3: secondary_pattern + context
    if (result.length < limit && context) {
      const { data } = await supabase
        .from("stories")
        .select(STORY_COLS)
        .in("secondary_pattern", patternKeys)
        .eq("context", context)
        .eq("reported", false)
        .order("created_at", { ascending: false })
        .limit(limit * 2);
      if (data) addStories(data as MatchedStory[]);
    }

    // Priority 4: secondary_pattern only
    if (result.length < limit) {
      const { data } = await supabase
        .from("stories")
        .select(STORY_COLS)
        .in("secondary_pattern", patternKeys)
        .eq("reported", false)
        .order("created_at", { ascending: false })
        .limit(limit * 2);
      if (data) addStories(data as MatchedStory[]);
    }
  } catch {
    // Return whatever we have
  }

  return result;
}
