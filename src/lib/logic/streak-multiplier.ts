export function calculateStreakMultiplier(streakDays: number): number {
  return Math.pow(1.01, streakDays);
}
