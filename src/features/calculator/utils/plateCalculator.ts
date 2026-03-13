import { PlateBreakdown } from '../types';

/**
 * Calculate the per-side plate breakdown for a target weight.
 *
 * Uses a greedy algorithm: iterates plates in descending order,
 * fitting as many of each as possible before moving to the next size.
 *
 * @param targetWeight - Total barbell weight to achieve
 * @param barWeight - Weight of the empty bar
 * @param availablePlates - Plate weights in descending order
 * @returns PlateBreakdown with per-side plate counts and any remainder
 */
export function calculatePlates(
  targetWeight: number,
  barWeight: number,
  availablePlates: number[]
): PlateBreakdown {
  if (targetWeight <= barWeight) {
    return { plates: [], remainder: 0 };
  }

  let perSide = Math.round(((targetWeight - barWeight) / 2) * 100) / 100;
  const plates: { weight: number; count: number }[] = [];

  for (const plate of availablePlates) {
    const count = Math.floor((perSide + 0.001) / plate);
    if (count > 0) {
      plates.push({ weight: plate, count });
      perSide = Math.round((perSide - count * plate) * 100) / 100;
    }
  }

  return { plates, remainder: Math.max(0, Math.round(perSide * 100) / 100) };
}
