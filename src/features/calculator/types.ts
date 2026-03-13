export interface PlateBreakdown {
  plates: { weight: number; count: number }[];
  remainder: number;
}

export interface BarPreset {
  label: string;
  weightLb: number;
  weightKg: number;
}

/** Weight => per-side count mapping used in reverse mode */
export type PlateCount = Record<number, number>;

/** State shape for plate inventory (per unit system) */
export interface PlateInventoryState {
  enabledPlates: number[];
  allPlates: number[];
}

export interface NextSetInput {
  lastWeight: number;
  lastReps: number;
  lastRpe: number;
  targetRpe: number;
  targetReps: number;
  unit: 'kg' | 'lbs';
}

export interface NextSetResult {
  recommendedWeight: number;
  percentChange: number;
  explanation: string;
}
