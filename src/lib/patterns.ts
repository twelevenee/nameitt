export interface WeightedKeyword {
  phrase: string;
  weight: number; // 0.5 = generic, 1.0 = moderate, 2.0 = highly specific
}

export interface Pattern {
  key: string;
  title: string;
  explanation: string;
  whyRelates: string;
  keywords: WeightedKeyword[];
  contextBoost?: string[];
  examples: string[];
  actions: string[];
}

export type Confidence = "high" | "medium" | "low";

export interface PatternMatch {
  pattern: Pattern;
  score: number;
  confidence: Confidence;
}

export interface AnalysisResult {
  matches: PatternMatch[];
  selfDoubtDetected: boolean;
  lowConfidence: boolean;
}

export interface AIPatternMatch {
  key: string;
  confidence: Confidence;
  personalizedExplanation: string;
}

export interface AIAnalysisResult {
  patterns: AIPatternMatch[];
  selfDoubtDetected: boolean;
  validationMessage: string;
}

export function getPatternByKey(key: string): Pattern | undefined {
  return PATTERNS.find((p) => p.key === key);
}

function kw(phrase: string, weight = 1.0): WeightedKeyword {
  return { phrase, weight };
}

export const PATTERNS: Pattern[] = [
  {
    key: "emotional_invalidation",
    title: "Emotional Invalidation",
    explanation: "When someone dismisses, minimizes, or ignores your feelings — making you question whether your emotional response is justified.",
    whyRelates: "Your description may reflect a situation where your feelings were treated as an overreaction or dismissed entirely.",
    keywords: [
      kw("emotional", 0.5), kw("dramatic", 0.5), kw("relax", 0.5), kw("chill", 0.5),
      kw("overreacting"), kw("too sensitive"), kw("calm down"), kw("hysterical"),
      kw("irrational"), kw("crazy"), kw("making a big deal"), kw("lighten up"),
      kw("can't take a joke"),
      kw("talked over me", 2.0), kw("rolled their eyes", 2.0),
      kw("told me to calm down", 2.0), kw("said I was making it up", 2.0),
      kw("laughed at me", 2.0), kw("dismissed what I said", 2.0),
      kw("nobody else thinks that", 2.0), kw("you always do this", 2.0),
      kw("you're being ridiculous", 2.0), kw("it wasn't that bad", 2.0),
      kw("stop being so sensitive", 2.0), kw("you're imagining things", 2.0),
      kw("why are you crying", 1.5), kw("get over it", 1.5),
      kw("it's not a big deal", 1.5), kw("you're blowing this out of proportion", 2.0),
    ],
    contextBoost: [],
    examples: [
      "He said I was overreacting when I brought up how his comment hurt me.",
      "My coworker laughed and told me it wasn't that deep.",
      "She said I was being too emotional to think clearly.",
      "They rolled their eyes when I tried to explain how I felt.",
    ],
    actions: [
      "Write down what happened and how you felt — your experience is valid even if someone dismissed it.",
      "Practice saying: 'I hear that you see it differently, but my feelings are real.'",
      "Talk to someone you trust about what happened.",
    ],
  },
  {
    key: "benevolent_sexism",
    title: "Benevolent Sexism",
    explanation: "Attitudes that seem positive on the surface but reinforce traditional gender roles — like 'protective' behavior that limits your autonomy.",
    whyRelates: "What you described may involve someone acting 'nice' or 'caring' in a way that felt controlling or patronizing.",
    keywords: [
      kw("compliment", 0.5), kw("pretty", 0.5), kw("delicate", 0.5),
      kw("meant well"), kw("just being nice"), kw("protective"), kw("chivalry"),
      kw("help you"), kw("smile more"), kw("for your own good"),
      kw("let me carry that", 2.0), kw("you're too pretty to", 2.0),
      kw("that's not a job for", 2.0), kw("I'm just trying to help", 2.0),
      kw("you don't need to worry about", 2.0), kw("leave that to", 2.0),
      kw("not cut out for", 2.0), kw("let me do that for you", 2.0),
      kw("you shouldn't have to", 1.5), kw("a girl like you", 2.0),
      kw("too heavy for you", 2.0), kw("don't worry your pretty head", 2.0),
      kw("I'll handle it", 1.5), kw("you need a man to", 2.0),
      kw("women are better at", 1.5), kw("it's a compliment", 2.0),
    ],
    contextBoost: ["workplace", "relationship"],
    examples: [
      "My manager said I shouldn't worry about the technical side — he'd handle it for me.",
      "He told me I was too pretty to be working this hard.",
      "A colleague insisted on carrying my things even after I said I was fine.",
      "He said he was just being protective when he told me not to walk alone.",
    ],
    actions: [
      "Notice when 'kindness' comes with an assumption about what you can or can't do.",
      "Try responding with: 'I appreciate the thought, but I've got this.'",
      "Reflect on whether the same offer would be made to a male colleague.",
    ],
  },
  {
    key: "gender_role_expectation",
    title: "Gender Role Expectation",
    explanation: "Pressure to behave in ways considered 'appropriate' for your gender — expectations about appearance, caregiving, ambition, or emotional expression.",
    whyRelates: "Your experience may involve being judged for not fitting a specific role or expectation based on gender.",
    keywords: [
      kw("should", 0.5), kw("bossy", 0.5), kw("ambitious", 0.5), kw("feminine", 0.5),
      kw("supposed to"), kw("real woman"), kw("not ladylike"), kw("housework"),
      kw("cook"), kw("clean"), kw("take care"), kw("mother"), kw("wife"),
      kw("aggressive"), kw("nurturing"),
      kw("act like a lady", 2.0), kw("why don't you smile", 2.0),
      kw("you'd be prettier if", 2.0), kw("when are you having kids", 2.0),
      kw("shouldn't you be", 1.5), kw("your husband", 1.5),
      kw("who's watching the kids", 2.0), kw("not very feminine", 2.0),
      kw("that's a man's job", 2.0), kw("women belong in", 2.0),
      kw("biological clock", 2.0), kw("you'll change your mind", 2.0),
      kw("what kind of mother", 2.0), kw("too aggressive for a woman", 2.0),
      kw("boys will be boys", 2.0), kw("man up", 1.5),
    ],
    contextBoost: ["family", "relationship", "workplace"],
    examples: [
      "My family kept asking when I was going to settle down and have kids.",
      "A coworker called me 'bossy' for doing the same thing our male lead does daily.",
      "I was told I'd be prettier if I smiled more.",
      "My partner expected me to handle all the cooking and cleaning.",
    ],
    actions: [
      "Remind yourself: your worth is not defined by how well you fit someone else's expectations.",
      "Practice setting a boundary: 'That's a personal choice, and I'm comfortable with mine.'",
      "Seek out communities or role models who embrace diverse ways of being.",
    ],
  },
  {
    key: "objectification",
    title: "Objectification",
    explanation: "Being reduced to your physical appearance or body — treated as something to be looked at rather than a whole person.",
    whyRelates: "Your description may involve unwanted attention focused on your body or appearance rather than who you are.",
    keywords: [
      kw("body", 0.5), kw("appearance", 0.5), kw("dress", 0.5), kw("attractive", 0.5),
      kw("looked at"), kw("commented on looks"), kw("staring"), kw("outfit"),
      kw("hot"), kw("sexy"), kw("weight"), kw("figure"), kw("checking out"),
      kw("what were you wearing", 2.0), kw("looked me up and down", 2.0),
      kw("commented on my body", 2.0), kw("made a comment about", 1.5),
      kw("rated my appearance", 2.0), kw("nice legs", 2.0),
      kw("whistled at me", 2.0), kw("undressed me with", 2.0),
      kw("nice body", 2.0), kw("you look good in that", 1.5),
      kw("turned heads", 1.5), kw("easy on the eyes", 2.0),
      kw("meat market", 2.0), kw("eye candy", 2.0),
      kw("showing off your", 2.0), kw("too revealing", 1.5),
    ],
    contextBoost: ["public space", "workplace", "online"],
    examples: [
      "He commented on my outfit instead of the presentation I just gave.",
      "A stranger rated my appearance out loud as I walked past.",
      "My colleague said I was 'easy on the eyes' during a work meeting.",
      "Someone whistled at me from across the street.",
    ],
    actions: [
      "Remember: you are more than how you look, and unwanted comments about your body are not compliments.",
      "If safe, name the behavior: 'I'd prefer you comment on my work, not my appearance.'",
      "Document incidents if they happen at work — a pattern matters.",
    ],
  },
  {
    key: "harassment",
    title: "Harassment",
    explanation: "Repeated or severe unwanted behavior that creates a hostile, intimidating, or offensive environment.",
    whyRelates: "What you described may involve persistent unwanted behavior that crossed your boundaries.",
    keywords: [
      kw("persistent", 0.5), kw("inappropriate", 0.5), kw("messages", 0.5),
      kw("followed"), kw("wouldn't stop"), kw("touched"), kw("catcall"),
      kw("kept asking"), kw("won't take no"), kw("cornered"),
      kw("grabbed"), kw("groped"), kw("whispered"),
      kw("wouldn't leave me alone", 2.0), kw("kept texting me", 2.0),
      kw("showed up uninvited", 2.0), kw("blocked the door", 2.0),
      kw("stood too close", 2.0), kw("touched my", 2.0),
      kw("brushed against me", 2.0), kw("didn't stop when I said", 2.0),
      kw("kept staring at me", 2.0), kw("sent me pictures", 2.0),
      kw("made sexual comments", 2.0), kw("asked me out repeatedly", 2.0),
      kw("wouldn't take no for an answer", 2.0), kw("cornered me", 2.0),
      kw("grabbed my", 2.0), kw("waited for me outside", 2.0),
    ],
    contextBoost: ["workplace", "public space", "online"],
    examples: [
      "He kept asking me out even after I said no multiple times.",
      "A coworker would stand too close and brush against me when no one was looking.",
      "Someone kept sending me messages even after I blocked them.",
      "He cornered me in the hallway and wouldn't let me pass.",
    ],
    actions: [
      "Trust your instincts — if it felt wrong, it matters.",
      "Save any messages or evidence. Documentation can help you later.",
      "Reach out to a trusted person or a helpline — you don't have to handle this alone.",
    ],
  },
  {
    key: "public_intimidation",
    title: "Public Intimidation",
    explanation: "Behavior in public spaces designed to assert dominance or make you feel small — from unwanted comments to physically blocking your path.",
    whyRelates: "Your experience may involve feeling unsafe or targeted in a public setting.",
    keywords: [
      kw("street", 0.5), kw("public", 0.5), kw("stranger", 0.5),
      kw("yelled"), kw("scared"), kw("threatened"), kw("alone"),
      kw("night"), kw("walking"), kw("honked"), kw("whistled"),
      kw("blocking"), kw("cornered"),
      kw("followed me", 2.0), kw("shouted at me from", 2.0),
      kw("honked at me", 2.0), kw("slowed down their car", 2.0),
      kw("made me cross the street", 2.0), kw("walked behind me", 2.0),
      kw("yelled from a car", 2.0), kw("blocked my path", 2.0),
      kw("wouldn't let me pass", 2.0), kw("catcalled me", 2.0),
      kw("leered at me", 2.0), kw("looked me up and down in public", 2.0),
      kw("made me feel watched", 2.0), kw("took a photo of me", 2.0),
      kw("stepped into my space", 2.0),
    ],
    contextBoost: ["public space"],
    examples: [
      "A man followed me for two blocks making comments about my body.",
      "Someone honked and yelled at me from their car while I was walking home.",
      "A stranger blocked my path and wouldn't let me pass until I 'smiled for him.'",
      "I noticed someone taking photos of me without my consent on the train.",
    ],
    actions: [
      "Your safety comes first — change your route, enter a store, or call someone if you feel unsafe.",
      "It's okay to be rude to protect yourself. You don't owe anyone a smile or a conversation.",
      "Share your experience with others — public intimidation thrives on silence.",
    ],
  },
  {
    key: "safety_threat",
    title: "Safety Threat",
    explanation: "Situations where you felt physically or emotionally unsafe — where leaving, speaking up, or saying no felt risky.",
    whyRelates: "Your description suggests a situation where your sense of safety may have been compromised.",
    keywords: [
      kw("afraid", 0.5), kw("unsafe", 0.5), kw("scared", 0.5),
      kw("couldn't leave"), kw("trapped"), kw("stalked"), kw("threatened"),
      kw("violent"), kw("hit"), kw("locked"), kw("controlled"),
      kw("isolated"), kw("weapon"),
      kw("couldn't say no", 2.0), kw("was afraid to leave", 2.0),
      kw("checked my phone", 2.0), kw("controlled who I", 2.0),
      kw("threatened to", 2.0), kw("wouldn't let me", 2.0),
      kw("locked the door", 2.0), kw("took my keys", 2.0),
      kw("cut me off from friends", 2.0), kw("said no one would believe me", 2.0),
      kw("raised a hand", 2.0), kw("punched the wall", 2.0),
      kw("threw something", 2.0), kw("monitored my location", 2.0),
      kw("I couldn't get out", 2.0), kw("made me feel trapped", 2.0),
    ],
    contextBoost: ["relationship", "public space"],
    examples: [
      "He punched the wall next to me when I disagreed with him.",
      "She took my phone so I couldn't call anyone.",
      "I felt trapped because he was blocking the only exit.",
      "He said no one would believe me if I told anyone.",
    ],
    actions: [
      "If you are in immediate danger, call emergency services or a crisis hotline.",
      "Create a safety plan — identify trusted people, safe places, and ways to leave.",
      "You deserve to feel safe. Reaching out for support is a sign of strength, not weakness.",
    ],
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

function scoreToConfidence(score: number): Confidence {
  if (score >= 3.0) return "high";
  if (score >= 1.5) return "medium";
  return "low";
}

const MIN_THRESHOLD = 1.0;

export function analyzeExperience(
  description: string,
  contextWhere?: string,
  contextFeeling?: string,
): AnalysisResult {
  const lower = description.toLowerCase();
  const selfDoubtDetected = detectSelfDoubt(description);

  const scored: PatternMatch[] = PATTERNS.map((pattern) => {
    let score = 0;
    for (const kw of pattern.keywords) {
      if (lower.includes(kw.phrase.toLowerCase())) {
        score += kw.weight;
      }
    }
    // Context boost
    if (contextWhere && pattern.contextBoost?.includes(contextWhere)) {
      score += 0.5;
    }
    // Feeling-based boost
    const f = contextFeeling?.toLowerCase() ?? "";
    if (f.includes("unsafe") && pattern.key === "safety_threat") score += 0.5;
    if (f.includes("humiliating") && pattern.key === "objectification") score += 0.5;
    if (f.includes("confusing") && pattern.key === "benevolent_sexism") score += 0.5;

    return { pattern, score, confidence: scoreToConfidence(score) };
  })
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  // Low-confidence fallback
  if (scored.length === 0 || scored[0].score < MIN_THRESHOLD) {
    const fallbackPatterns = [PATTERNS[0], PATTERNS[2]]; // emotional invalidation + gender role
    const fallbackMatches: PatternMatch[] = fallbackPatterns.map((p) => ({
      pattern: p,
      score: 0,
      confidence: "low" as Confidence,
    }));
    return {
      matches: scored.length > 0 ? scored : fallbackMatches,
      selfDoubtDetected,
      lowConfidence: true,
    };
  }

  return { matches: scored, selfDoubtDetected, lowConfidence: false };
}
