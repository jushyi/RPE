/**
 * Plan type definitions for the workout plan builder.
 * Three-level hierarchy: Plan -> PlanDay -> PlanDayExercise (with TargetSets)
 */

import type { Exercise } from '@/features/exercises/types';

export interface TargetSet {
  weight: number;
  reps: number;
  rpe: number | null;
}

export interface PlanDayExercise {
  id: string;
  plan_day_id: string;
  exercise_id: string;
  sort_order: number;
  target_sets: TargetSet[];
  notes: string | null;
  unit_override: 'kg' | 'lbs' | null;
  weight_progression: 'manual' | 'carry_previous';
  created_at: string;
  exercise?: Exercise;
}

export interface PlanDay {
  id: string;
  plan_id: string;
  day_name: string;
  weekday: number | null;
  sort_order: number;
  created_at: string;
  alarm_time: string | null;
  alarm_enabled: boolean;
  plan_day_exercises: PlanDayExercise[];
}

export interface Plan {
  id: string;
  user_id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  plan_days: PlanDay[];
}

export interface PlanSummary {
  id: string;
  user_id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  day_count: number;
  day_names: string[];
}
