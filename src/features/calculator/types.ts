export interface PlateBreakdown {
  plates: { weight: number; count: number }[];
  remainder: number;
}

export interface BarPreset {
  label: string;
  weightLb: number;
  weightKg: number;
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
