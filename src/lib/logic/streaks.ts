/**
 * Calculates the current streak length from a chronological (oldest-first) list of
 * daily entries. A missed day consumes one freeze and leaves the streak unchanged;
 * once freezes run out, a missed day resets the streak to 0.
 */
export function calculateStreak(
  entries: { date: string; completed: boolean }[],
  freezesAvailable: number,
): number {
  let streak = 0;
  let freezesRemaining = freezesAvailable;

  for (const entry of entries) {
    if (entry.completed) {
      streak += 1;
    } else if (freezesRemaining > 0) {
      freezesRemaining -= 1;
    } else {
      streak = 0;
    }
  }

  return streak;
}
