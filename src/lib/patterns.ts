export interface Pattern {
  key: string;
  title: string;
  explanation: string;
  whyRelates: string;
  keywords: string[];
  contextBoost?: string[];
}

export const PATTERNS: Pattern[] = [
  {
    key: "emotional_invalidation",
    title: "Emotional Invalidation",
    explanation: "When someone dismisses, minimizes, or ignores your feelings — making you question whether your emotional response is justified.",
    whyRelates: "Your description may reflect a situation where your feelings were treated as an overreaction or dismissed entirely.",
    keywords: ["overreacting", "too sensitive", "calm down", "dramatic", "emotional", "hysterical", "irrational", "crazy", "making a big deal", "relax", "chill", "lighten up", "can't take a joke"],
    contextBoost: [],
  },
  {
    key: "benevolent_sexism",
    title: "Benevolent Sexism",
    explanation: "Attitudes that seem positive on the surface but reinforce traditional gender roles — like 'protective' behavior that limits your autonomy.",
    whyRelates: "What you described may involve someone acting 'nice' or 'caring' in a way that felt controlling or patronizing.",
    keywords: ["compliment", "meant well", "just being nice", "protective", "chivalry", "help you", "let me do that", "too heavy", "pretty", "smile more", "for your own good", "delicate"],
    contextBoost: ["workplace", "relationship"],
  },
  {
    key: "gender_role_expectation",
    title: "Gender Role Expectation",
    explanation: "Pressure to behave in ways considered 'appropriate' for your gender — expectations about appearance, caregiving, ambition, or emotional expression.",
    whyRelates: "Your experience may involve being judged for not fitting a specific role or expectation based on gender.",
    keywords: ["should", "supposed to", "real woman", "not ladylike", "housework", "cook", "clean", "take care", "mother", "wife", "bossy", "aggressive", "ambitious", "nurturing", "feminine"],
    contextBoost: ["family", "relationship", "workplace"],
  },
  {
    key: "objectification",
    title: "Objectification",
    explanation: "Being reduced to your physical appearance or body — treated as something to be looked at rather than a whole person.",
    whyRelates: "Your description may involve unwanted attention focused on your body or appearance rather than who you are.",
    keywords: ["body", "looked at", "appearance", "commented on looks", "staring", "outfit", "attractive", "hot", "sexy", "dress", "weight", "figure", "checking out"],
    contextBoost: ["public space", "workplace", "online"],
  },
  {
    key: "harassment",
    title: "Harassment",
    explanation: "Repeated or severe unwanted behavior that creates a hostile, intimidating, or offensive environment.",
    whyRelates: "What you described may involve persistent unwanted behavior that crossed your boundaries.",
    keywords: ["followed", "wouldn't stop", "touched", "catcall", "persistent", "messages", "kept asking", "won't take no", "cornered", "grabbed", "groped", "whispered", "inappropriate"],
    contextBoost: ["workplace", "public space", "online"],
  },
  {
    key: "public_intimidation",
    title: "Public Intimidation",
    explanation: "Behavior in public spaces designed to assert dominance or make you feel small — from unwanted comments to physically blocking your path.",
    whyRelates: "Your experience may involve feeling unsafe or targeted in a public setting.",
    keywords: ["street", "yelled", "scared", "threatened", "alone", "night", "walking", "honked", "whistled", "blocking", "cornered", "public", "stranger"],
    contextBoost: ["public space"],
  },
  {
    key: "safety_threat",
    title: "Safety Threat",
    explanation: "Situations where you felt physically or emotionally unsafe — where leaving, speaking up, or saying no felt risky.",
    whyRelates: "Your description suggests a situation where your sense of safety may have been compromised.",
    keywords: ["afraid", "unsafe", "couldn't leave", "trapped", "stalked", "threatened", "violent", "hit", "scared", "locked", "controlled", "isolated", "weapon"],
    contextBoost: ["relationship", "public space"],
  },
];

const SELF_DOUBT_PHRASES = [
  "maybe i'm", "probably nothing", "i might be", "am i crazy",
  "was i wrong", "too sensitive", "overreacting", "i'm being dramatic",
  "it's not a big deal", "am i overthinking", "i don't know if",
  "maybe it's just me", "i could be wrong", "i'm probably",
];

export function detectSelfDoubt(text: string): boolean {
  const lower = text.toLowerCase();
  return SELF_DOUBT_PHRASES.some((phrase) => lower.includes(phrase));
}

export function analyzeExperience(
  description: string,
  contextWhere?: string,
  contextFeeling?: string,
): { patterns: Pattern[]; selfDoubtDetected: boolean } {
  const lower = description.toLowerCase();
  const selfDoubtDetected = detectSelfDoubt(description);

  const scored = PATTERNS.map((pattern) => {
    let score = 0;
    for (const kw of pattern.keywords) {
      if (lower.includes(kw.toLowerCase())) {
        score++;
      }
    }
    // Context boost
    if (contextWhere && pattern.contextBoost?.includes(contextWhere)) {
      score += 0.5;
    }
    // Feeling-based boost
    if (contextFeeling === "unsafe" && pattern.key === "safety_threat") score += 0.5;
    if (contextFeeling === "humiliating" && pattern.key === "objectification") score += 0.5;
    if (contextFeeling === "confusing" && pattern.key === "benevolent_sexism") score += 0.5;

    return { pattern, score };
  })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  // If nothing matched, return top 2 general patterns
  if (scored.length === 0) {
    const fallback = [PATTERNS[0], PATTERNS[2]]; // emotional invalidation + gender role
    return { patterns: fallback, selfDoubtDetected };
  }

  return { patterns: scored.map((s) => s.pattern), selfDoubtDetected };
}
