/**
 * Workout session type definitions.
 * Used by workoutStore and the active workout UI.
 */

import type { TargetSet } from '@/features/plans/types';

/** A single logged set within an exercise */
export interface SetLog {
  id: string;
  set_number: number;
  weight: number;
  reps: number;
  rpe: number | null;
  unit: 'kg' | 'lbs';
  is_pr: boolean;
  logged_at: string;
}

/** An exercise within an active workout session */
export interface SessionExercise {
  id: string;
  exercise_id: string;
  exercise_name: string;
  sort_order: number;
  target_sets: TargetSet[];
  weight_progression: 'manual' | 'carry_previous';
  unit: 'kg' | 'lbs';
  logged_sets: SetLog[];
}

/** An active or completed workout session */
export interface WorkoutSession {
  id: string;
  user_id: string;
  plan_id: string | null;
  plan_day_id: string | null;
  title: string;
  started_at: string;
  ended_at: string | null;
  exercises: SessionExercise[];
}

/** Previous performance data for an exercise (used for carry-forward weights) */
export interface PreviousPerformance {
  exercise_id: string;
  sets: SetLog[];
  session_date: string;
}

/** Summary statistics for a completed session */
export interface SessionSummary {
  duration_minutes: number;
  total_volume: number;
  exercises_completed: number;
  prs_hit: number;
  exercises_with_manual_progression: Array<{
    exercise_id: string;
    exercise_name: string;
    last_weight: number;
    last_reps: number;
    sets_completed: number;
    unit: string;
  }>;
}
