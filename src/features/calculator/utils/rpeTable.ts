/**
 * Standard RPE-to-percentage table (Tuchscherer/RTS).
 *
 * Key: RPE value (6-10, including half steps)
 * Value: array of percentages indexed by (reps - 1), for reps 1-12
 */
export const RPE_TABLE: Record<number, number[]> = {
  10:   [100, 95.5, 92.2, 89.2, 86.3, 83.7, 81.1, 78.6, 76.2, 73.9, 71.7, 69.4],
  9.5:  [97.8, 93.9, 90.7, 87.8, 85.0, 82.4, 79.9, 77.4, 75.1, 72.3, 70.7, 68.6],
  9:    [95.5, 92.2, 89.2, 86.3, 83.7, 81.1, 78.6, 76.2, 73.9, 71.7, 69.4, 67.5],
  8.5:  [93.9, 90.7, 87.8, 85.0, 82.4, 79.9, 77.4, 75.1, 72.3, 70.7, 68.6, 66.7],
  8:    [92.2, 89.2, 86.3, 83.7, 81.1, 78.6, 76.2, 73.9, 71.7, 69.4, 67.5, 65.8],
  7.5:  [90.7, 87.8, 85.0, 82.4, 79.9, 77.4, 75.1, 72.3, 70.7, 68.6, 66.7, 64.9],
  7:    [89.2, 86.3, 83.7, 81.1, 78.6, 76.2, 73.9, 71.7, 69.4, 67.5, 65.8, 64.0],
  6.5:  [87.8, 85.0, 82.4, 79.9, 77.4, 75.1, 72.3, 70.7, 68.6, 66.7, 64.9, 63.2],
  6:    [86.3, 83.7, 81.1, 78.6, 76.2, 73.9, 71.7, 69.4, 67.5, 65.8, 64.0, 62.3],
};

/**
 * Look up the target weight for a given e1RM, RPE, and rep count.
 *
 * @param e1rm - Estimated 1-rep max
 * @param rpe - RPE value (must be a key in RPE_TABLE)
 * @param reps - Number of reps (1-12)
 * @returns Target weight rounded to 1 decimal, or 0 if inputs are invalid
 */
export function getWeightForRpeAndReps(
  e1rm: number,
  rpe: number,
  reps: number
): number {
  const percentages = RPE_TABLE[rpe];
  if (!percentages || reps < 1 || reps > 12) return 0;
  return Math.round((e1rm * percentages[reps - 1]) / 100 * 10) / 10;
}
