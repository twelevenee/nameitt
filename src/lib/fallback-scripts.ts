export interface Script {
  tone: string;
  text: string;
  why: string;
}

export const FALLBACK_SCRIPTS: Script[] = [
  {
    tone: "Gentle but firm",
    text: "I understand you may see it differently, but I need you to respect how I feel about this.",
    why: "This acknowledges the other person's perspective while firmly asserting your right to your own feelings.",
  },
  {
    tone: "Direct and clear",
    text: "What you said is not okay with me. I need it to stop.",
    why: "Clear, simple boundaries are the hardest to argue with or dismiss.",
  },
  {
    tone: "De-escalation focused",
    text: "I don't want to argue about this. I just need you to hear me.",
    why: "This reduces tension while still making your needs known.",
  },
];
