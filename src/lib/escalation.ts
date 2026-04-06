// Pattern severity tiers
const SEVERE_PATTERNS = ["harassment", "safety_threat", "public_intimidation"];
const MILD_PATTERNS = ["emotional_invalidation", "benevolent_sexism", "gender_role_expectation", "objectification"];

const FEELING_SCORES: Record<string, number> = {
  "Much safer": 5,
  "A little better": 4,
  "About the same": 3,
  "Things feel harder": 2,
  "I need support": 1,
};

export interface EscalationResult {
  level: "none" | "gentle" | "concerned" | "urgent";
  signals: string[];
  message: string;
  showResources: boolean;
}

interface ExperienceEntry {
  created_at: string;
  patterns: string[];
}

interface CheckinEntry {
  created_at: string;
  feeling: string;
}

export function detectEscalation(
  experiences: ExperienceEntry[],
  checkins: CheckinEntry[]
): EscalationResult {
  const signals: string[] = [];

  // Sort oldest → newest
  const sortedExp = [...experiences].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  const sortedCheckins = [...checkins].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  // 1. Support request — immediate
  if (sortedCheckins.length > 0) {
    const latest = sortedCheckins[sortedCheckins.length - 1];
    if (latest.feeling === "I need support") {
      signals.push("Your most recent check-in indicates you could use support right now.");
    }
  }

  // 2. Pattern severity escalation
  if (sortedExp.length >= 2) {
    const midpoint = Math.floor(sortedExp.length / 2);
    const earlier = sortedExp.slice(0, midpoint);
    const recent = sortedExp.slice(midpoint);

    const earlierHadMild = earlier.some((e) =>
      e.patterns.some((p) => MILD_PATTERNS.includes(p))
    );
    const recentHasSevere = recent.some((e) =>
      e.patterns.some((p) => SEVERE_PATTERNS.includes(p))
    );

    if (earlierHadMild && recentHasSevere) {
      signals.push(
        "Your more recent experiences involve patterns that may be more serious than earlier ones."
      );
    }
  }

  // 3. Frequency increase
  if (sortedExp.length >= 4) {
    const midpoint = Math.floor(sortedExp.length / 2);
    const earlierGaps: number[] = [];
    const recentGaps: number[] = [];

    for (let i = 1; i < midpoint; i++) {
      earlierGaps.push(
        new Date(sortedExp[i].created_at).getTime() -
          new Date(sortedExp[i - 1].created_at).getTime()
      );
    }
    for (let i = midpoint + 1; i < sortedExp.length; i++) {
      recentGaps.push(
        new Date(sortedExp[i].created_at).getTime() -
          new Date(sortedExp[i - 1].created_at).getTime()
      );
    }

    const avgEarlier =
      earlierGaps.length > 0
        ? earlierGaps.reduce((a, b) => a + b, 0) / earlierGaps.length
        : Infinity;
    const avgRecent =
      recentGaps.length > 0
        ? recentGaps.reduce((a, b) => a + b, 0) / recentGaps.length
        : Infinity;

    if (avgRecent < avgEarlier * 0.5 && avgRecent < Infinity) {
      signals.push(
        "You've been reflecting more frequently recently."
      );
    }
  }

  // 4. Check-in wellbeing decline
  if (sortedCheckins.length >= 3) {
    const last3 = sortedCheckins.slice(-3);
    const scores = last3.map((c) => FEELING_SCORES[c.feeling] ?? 3);
    if (scores[0] > scores[1] && scores[1] > scores[2]) {
      signals.push(
        "Your recent check-ins show a downward trend in how you've been feeling."
      );
    }
  }

  // Determine level
  let level: EscalationResult["level"] = "none";
  let message = "";
  let showResources = false;

  const hasSupport = signals.some((s) => s.includes("support right now"));

  if (hasSupport) {
    level = "urgent";
    message =
      "We want you to know that support is available right now. You deserve to feel safe.";
    showResources = true;
  } else if (signals.length >= 2) {
    level = "concerned";
    message =
      "Your recent experiences seem to be shifting toward more serious patterns. Talking to someone you trust — a friend, counselor, or advocate — could help.";
    showResources = true;
  } else if (signals.length === 1) {
    level = "gentle";
    message =
      "We've noticed some changes in your recent reflections. Remember, you don't have to navigate this alone.";
    showResources = false;
  }

  return { level, signals, message, showResources };
}

export { FEELING_SCORES };
