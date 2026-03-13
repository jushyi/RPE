import { RPE_TABLE } from './rpeTable';
import { NextSetInput, NextSetResult } from '../types';

/**
 * Snap a raw RPE value to the nearest valid table key (6, 6.5, 7, ... 10).
 * Returns 0 if out of range.
 */
export function snapRpe(raw: number): number {
  if (raw < 6 || raw > 10) return 0;
  return Math.round(raw * 2) / 2;
}

/**
 * Round a weight to the nearest loadable increment.
 *
 * @param weight - Raw weight value
 * @param unit - 'lbs' rounds to nearest 5, 'kg' rounds to nearest 2.5
 */
export function roundToLoadable(weight: number, unit: 'lbs' | 'kg'): number {
  const increment = unit === 'lbs' ? 5 : 2.5;
  return Math.round(weight / increment) * increment;
}

/**
 * Calculate the recommended weight for the next set based on RPE.
 *
 * Derives an estimated 1RM from the last set's weight, reps, and RPE,
 * then calculates the target weight for the desired RPE and rep count.
 * RPE values are snapped to the nearest valid half-step (6-10).
 *
 * @param input - Last set data and target parameters
 * @returns Recommended weight, percentage change, and explanation
 */
export function calculateNextSet(input: NextSetInput): NextSetResult {
  const lastRpeSnapped = snapRpe(input.lastRpe);
  if (lastRpeSnapped === 0) {
    return {
      recommendedWeight: input.lastWeight,
      percentChange: 0,
      explanation: 'RPE must be between 6 and 10',
    };
  }

  const lastPct = RPE_TABLE[lastRpeSnapped]?.[input.lastReps - 1];
  if (!lastPct) {
    return {
      recommendedWeight: input.lastWeight,
      percentChange: 0,
      explanation: 'Reps must be between 1 and 12',
    };
  }

  const estimated1RM = (input.lastWeight / lastPct) * 100;

  const targetRpeSnapped = snapRpe(input.targetRpe);
  if (targetRpeSnapped === 0) {
    return {
      recommendedWeight: input.lastWeight,
      percentChange: 0,
      explanation: 'Target RPE must be between 6 and 10',
    };
  }

  const targetPct = RPE_TABLE[targetRpeSnapped]?.[input.targetReps - 1];
  if (!targetPct) {
    return {
      recommendedWeight: input.lastWeight,
      percentChange: 0,
      explanation: 'Target reps must be between 1 and 12',
    };
  }

  const rawWeight = (estimated1RM * targetPct) / 100;
  const recommendedWeight = roundToLoadable(rawWeight, input.unit);
  const percentChange =
    Math.round(((recommendedWeight - input.lastWeight) / input.lastWeight) * 1000) / 10;

  const explanation =
    `Based on e1RM of ${Math.round(estimated1RM)} ${input.unit}, ` +
    `${input.targetReps} reps at RPE ${targetRpeSnapped} = ${targetPct}% of 1RM`;

  return { recommendedWeight, percentChange, explanation };
}
