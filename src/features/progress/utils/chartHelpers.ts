import type { TimeRange } from '../types';

const KG_TO_LBS = 2.20462;

/**
 * Returns the start date for a given time range, or null for 'all'.
 */
export function getTimeRangeStart(range: TimeRange): Date | null {
  if (range === 'all') return null;

  const now = new Date();
  switch (range) {
    case '1M':
      now.setMonth(now.getMonth() - 1);
      break;
    case '3M':
      now.setMonth(now.getMonth() - 3);
      break;
    case '6M':
      now.setMonth(now.getMonth() - 6);
      break;
    case '1Y':
      now.setFullYear(now.getFullYear() - 1);
      break;
  }
  return now;
}

/**
 * Converts weight between kg and lbs, rounded to 1 decimal place.
 */
export function convertWeight(
  value: number,
  from: 'kg' | 'lbs',
  to: 'kg' | 'lbs',
): number {
  if (from === to) return value;
  if (from === 'kg' && to === 'lbs') {
    return Math.round(value * KG_TO_LBS * 10) / 10;
  }
  // lbs to kg
  return Math.round((value / KG_TO_LBS) * 10) / 10;
}

/**
 * Formats a Unix ms timestamp to "M/D" format.
 */
export function formatChartDate(timestamp: number): string {
  const d = new Date(timestamp);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

/**
 * Estimates workout duration in minutes.
 * 3 min per set (includes rest) + 2 min per exercise (setup/transition).
 */
export function estimateWorkoutDuration(
  exerciseCount: number,
  totalSets: number,
): number {
  return totalSets * 3 + exerciseCount * 2;
}
