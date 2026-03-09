import type { MuscleGroup } from '../types';

/** Distinct color for each muscle group -- bold, high-contrast on dark backgrounds */
export const MUSCLE_GROUP_COLORS: Record<MuscleGroup, string> = {
  Chest: '#ef4444',      // red
  Lats: '#3b82f6',       // blue
  Delts: '#f59e0b',      // amber
  Biceps: '#8b5cf6',     // violet
  Triceps: '#ec4899',    // pink
  Forearms: '#f97316',   // orange
  Quads: '#22c55e',      // green
  Hamstrings: '#14b8a6', // teal
  Glutes: '#e11d48',     // rose
  Calves: '#06b6d4',     // cyan
  Core: '#eab308',       // yellow
  Traps: '#6366f1',      // indigo
};

/** All muscle groups derived from color map keys */
export const MUSCLE_GROUPS: MuscleGroup[] = Object.keys(MUSCLE_GROUP_COLORS) as MuscleGroup[];
