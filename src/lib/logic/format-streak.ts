/**
 * Formats a streak multiplier as a human-readable improvement percentage,
 * e.g. 1.3478 -> "34.78% improvement".
 *
 * @throws {Error} If `multiplier` is less than 1, since improvement can't be negative in this system.
 */
export function formatStreakPercentage(multiplier: number): string {
  if (multiplier < 1) {
    throw new Error("multiplier must be at least 1");
  }

  const percentage = (multiplier - 1) * 100;
  return `${percentage.toFixed(2)}% improvement`;
}
