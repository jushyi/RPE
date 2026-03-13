import { BarPreset } from '../types';

/** Standard lb plates in descending order for greedy algorithm */
export const LB_PLATES = [55, 45, 35, 25, 10, 5, 2.5];

/** Standard kg plates in descending order for greedy algorithm */
export const KG_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];

/** Common bar weight presets */
export const BAR_PRESETS: BarPreset[] = [
  { label: 'Olympic Bar', weightLb: 45, weightKg: 20 },
  { label: "Women's Bar", weightLb: 35, weightKg: 15 },
  { label: 'EZ Curl Bar', weightLb: 25, weightKg: 10 },
  { label: 'Training Bar', weightLb: 15, weightKg: 7 },
];

/** IPF-style plate colors for lb plates — mapped from kg equivalents */
export const PLATE_COLORS_LB: Record<number, string> = {
  55: '#EF4444',   // red   (25 kg)
  45: '#3B82F6',   // blue  (20 kg)
  35: '#FBBF24',   // yellow (15 kg)
  25: '#22C55E',   // green (10 kg)
  10: '#F5F5F5',   // white  (5 kg)
  5: '#1a1a1a',    // black (2.5 kg)
  2.5: '#9CA3AF',  // gray  (1.25 kg)
};

/** IPF-style plate colors for kg plates */
export const PLATE_COLORS_KG: Record<number, string> = {
  25: '#EF4444',   // red
  20: '#3B82F6',   // blue
  15: '#FBBF24',   // yellow
  10: '#22C55E',   // green
  5: '#F5F5F5',    // white
  2.5: '#1a1a1a',  // black (small)
  1.25: '#9CA3AF', // gray
};

/** Relative plate heights (proportion of max diameter) keyed by weight.
 *  25kg/55lb and 20kg/45lb are full competition diameter, then smaller. */
export const PLATE_HEIGHTS: Record<number, number> = {
  // lb plates — 55 and 45 are full size (competition bumpers)
  55: 1.0,
  45: 1.0,
  35: 0.85,
  25: 0.72,
  10: 0.58,
  5: 0.45,
  2.5: 0.35,
  // kg plates — 25 and 20 are full size (competition bumpers)
  20: 1.0,
  15: 0.85,
  1.25: 0.28,
};
