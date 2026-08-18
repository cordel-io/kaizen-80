const QUOTES = [
  "1% better today compounds into 38x better in a year.",
  "Small steps, compounding daily.",
  "Discipline is choosing between what you want now and what you want most.",
  "The system is the goal. Show up.",
  "Kaizen: continuous improvement, one rep at a time.",
  "Progress, not perfection.",
  "You don't rise to your goals, you fall to your systems.",
  "Every checkbox is a vote for who you're becoming."
];

/** Deterministic per day, so the quote stays stable across reloads. */
export function getQuoteOfTheDay(dateKey: string): string {
  let hash = 0;
  for (let i = 0; i < dateKey.length; i++) {
    hash = (hash * 31 + dateKey.charCodeAt(i)) >>> 0;
  }
  return QUOTES[hash % QUOTES.length];
}
