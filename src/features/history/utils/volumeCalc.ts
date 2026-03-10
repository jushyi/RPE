/**
 * Calculate total volume (sum of weight * reps) across all exercises and sets.
 */
export function calculateTotalVolume(
  exercises: Array<{ set_logs: Array<{ weight: number; reps: number }> }>
): number {
  return exercises.reduce(
    (total, ex) =>
      total +
      ex.set_logs.reduce((exTotal, set) => exTotal + set.weight * set.reps, 0),
    0
  );
}

/**
 * Calculate workout duration in minutes between start and end timestamps.
 * Returns null if endedAt is null (session still in progress).
 */
export function calculateDurationMinutes(
  startedAt: string,
  endedAt: string | null
): number | null {
  if (!endedAt) return null;
  const start = new Date(startedAt).getTime();
  const end = new Date(endedAt).getTime();
  return Math.round((end - start) / 60000);
}
