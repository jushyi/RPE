/**
 * Reverse bar loading utilities.
 *
 * Pure functions for converting plate counts to total weight,
 * formatting breakdowns, and generating enhanced remainder warnings.
 */

/**
 * Calculate total barbell weight from per-side plate counts and bar weight.
 *
 * @param plateCounts - Record of plate weight => per-side count
 * @param barWeight - Weight of the empty bar
 * @returns Total weight (bar + both sides)
 */
export function calculateTotalWeight(
  plateCounts: Record<number, number>,
  barWeight: number
): number {
  let perSideTotal = 0;
  for (const [weight, count] of Object.entries(plateCounts)) {
    perSideTotal += parseFloat(weight) * count;
  }
  return Math.round((barWeight + perSideTotal * 2) * 100) / 100;
}

/**
 * Convert plate counts to a sorted breakdown array, filtering out zeros.
 *
 * @param plateCounts - Record of plate weight => per-side count
 * @returns Array sorted descending by weight, zeros filtered
 */
export function countsToBreakdown(
  plateCounts: Record<number, number>
): { weight: number; count: number }[] {
  return Object.entries(plateCounts)
    .map(([w, count]) => ({ weight: parseFloat(w), count }))
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.weight - a.weight);
}

/**
 * Generate an enhanced remainder warning that names the specific missing plate.
 *
 * Finds the smallest disabled plate that is <= remainder. If found, tells the
 * user that plate is not in their inventory. Otherwise, returns a generic message.
 *
 * @param remainder - Unaccounted per-side weight
 * @param enabledPlates - Currently enabled plate sizes
 * @param allPlates - All available plate sizes (full set)
 * @param unitLabel - Unit string for display ('lb' or 'kg')
 * @returns Warning message string
 */
export function getMissingPlateMessage(
  remainder: number,
  enabledPlates: number[],
  allPlates: number[],
  unitLabel: string
): string {
  const enabledSet = new Set(enabledPlates);
  // Find disabled plates that could contribute (smallest disabled plate <= remainder)
  const disabledCandidates = allPlates
    .filter((p) => !enabledSet.has(p) && p <= remainder + 0.001)
    .sort((a, b) => a - b); // ascending — smallest first

  if (disabledCandidates.length > 0) {
    const plate = disabledCandidates[0];
    return `Cannot load exactly -- ${plate} ${unitLabel} plates not in your inventory`;
  }

  return `Cannot load exactly -- ${remainder} ${unitLabel} unaccounted`;
}
