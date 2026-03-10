/**
 * Calculate estimated 1-rep max using the Epley formula.
 * Formula: 1RM = weight * (1 + reps / 30)
 *
 * For 1-rep sets, returns the weight directly (actual 1RM).
 * Returns 0 for invalid inputs (reps <= 0 or weight <= 0).
 */
export function calculateEpley1RM(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return weight;

  const estimated = weight * (1 + reps / 30);
  return Math.round(estimated * 10) / 10; // Round to 1 decimal
}

/**
 * Find the best estimated 1RM across all sets for an exercise in a session.
 */
export function bestSessionE1RM(
  sets: Array<{ weight: number; reps: number }>
): number {
  if (sets.length === 0) return 0;
  return Math.max(0, ...sets.map((s) => calculateEpley1RM(s.weight, s.reps)));
}
