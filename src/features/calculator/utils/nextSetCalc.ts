import { RPE_TABLE } from './rpeTable';
import { NextSetInput, NextSetResult } from '../types';

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
 *
 * @param input - Last set data and target parameters
 * @returns Recommended weight, percentage change, and explanation
 */
export function calculateNextSet(input: NextSetInput): NextSetResult {
  const lastPct = RPE_TABLE[input.lastRpe]?.[input.lastReps - 1];
  if (!lastPct) {
    return {
      recommendedWeight: input.lastWeight,
      percentChange: 0,
      explanation: 'Invalid RPE/rep combination',
    };
  }

  const estimated1RM = (input.lastWeight / lastPct) * 100;

  const targetPct = RPE_TABLE[input.targetRpe]?.[input.targetReps - 1];
  if (!targetPct) {
    return {
      recommendedWeight: input.lastWeight,
      percentChange: 0,
      explanation: 'Invalid target combination',
    };
  }

  const rawWeight = (estimated1RM * targetPct) / 100;
  const recommendedWeight = roundToLoadable(rawWeight, input.unit);
  const percentChange =
    Math.round(((recommendedWeight - input.lastWeight) / input.lastWeight) * 1000) / 10;

  const explanation =
    `Based on e1RM of ${Math.round(estimated1RM)} ${input.unit}, ` +
    `${input.targetReps} reps at RPE ${input.targetRpe} = ${targetPct}% of 1RM`;

  return { recommendedWeight, percentChange, explanation };
}
