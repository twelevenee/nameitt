export const AFFIRMATIONS = [
  "Your experience matters",
  "There is no wrong way to feel",
  "You belong here",
  "Naming it is the first step",
  "You are not alone in this",
  "Your feelings are valid",
  "It takes courage to reflect",
  "Trust what you felt",
  "You deserve to feel safe",
  "This space is yours",
  "Doubt doesn't erase your truth",
  "You are heard here",
  "Healing isn't linear",
  "Small steps still count",
  "You don't have to figure it all out today",
  "What happened to you was real",
  "You are more than this experience",
  "It's okay to not be okay",
  "Asking questions is strength, not weakness",
  "You showed up for yourself today",
];

const VALIDATION_AFFIRMATIONS = AFFIRMATIONS.slice(0, 5);

export function getRandomAffirmation(): string {
  return AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)];
}

export function getValidationAffirmation(): string {
  return VALIDATION_AFFIRMATIONS[Math.floor(Math.random() * VALIDATION_AFFIRMATIONS.length)];
}
