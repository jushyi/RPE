import type { TargetSet } from './types';

export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const DEFAULT_DAY_NAMES = ['Day A', 'Day B', 'Day C', 'Day D', 'Day E', 'Day F'];

export const DEFAULT_TARGET_SET: TargetSet = { weight: 0, reps: 0, rpe: null };

export const DEFAULT_WEIGHT_PROGRESSION: 'manual' = 'manual' as const;

export const WEIGHT_PROGRESSION_OPTIONS = [
  {
    value: 'manual' as const,
    label: 'Set Target',
    description: 'Set a specific weight goal each week',
  },
  {
    value: 'carry_previous' as const,
    label: 'Use Previous',
    description: "Automatically use last session's weight",
  },
];
