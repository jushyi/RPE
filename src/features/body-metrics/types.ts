export interface BodyMeasurement {
  id: string;
  user_id: string;
  chest: number | null;
  chest_unit: 'in' | 'cm' | null;
  waist: number | null;
  waist_unit: 'in' | 'cm' | null;
  hips: number | null;
  hips_unit: 'in' | 'cm' | null;
  body_fat_pct: number | null;
  measured_at: string;
  created_at: string;
}

export type CircumferenceMetric = 'chest' | 'waist' | 'hips';
export type BodyMetric = CircumferenceMetric | 'body_fat_pct';
export type CircumferenceUnit = 'in' | 'cm';
