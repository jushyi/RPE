/**
 * Supabase Database type definitions.
 * These types match the migration schema for profiles and pr_baselines tables.
 * In production, these would be generated via `supabase gen types typescript`.
 */

export interface Profile {
  id: string; // UUID, references auth.users(id)
  display_name: string;
  avatar_url: string | null;
  preferred_unit: 'kg' | 'lbs';
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}

export interface PRBaseline {
  id: string; // UUID
  user_id: string; // UUID, references auth.users(id)
  exercise_name: string; // 'bench_press' | 'squat' | 'deadlift'
  weight: number; // NUMERIC(6,2)
  unit: 'kg' | 'lbs';
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}

export interface ExerciseRow {
  id: string; // UUID
  user_id: string | null; // UUID, NULL = global seed exercise
  name: string;
  muscle_groups: string[];
  equipment: string;
  notes: string | null;
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}

export interface WorkoutPlanRow {
  id: string; // UUID
  user_id: string; // UUID, references auth.users(id)
  name: string;
  is_active: boolean;
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}

export interface PlanDayRow {
  id: string; // UUID
  plan_id: string; // UUID, references workout_plans(id)
  day_name: string;
  weekday: number | null; // SMALLINT, nullable
  sort_order: number; // SMALLINT
  created_at: string; // TIMESTAMPTZ
}

export interface PlanDayExerciseRow {
  id: string; // UUID
  plan_day_id: string; // UUID, references plan_days(id)
  exercise_id: string; // UUID, references exercises(id)
  sort_order: number; // SMALLINT
  target_sets: any; // JSONB - TargetSet[]
  notes: string | null;
  unit_override: string | null;
  weight_progression: string; // 'manual' | 'carry_previous'
  created_at: string; // TIMESTAMPTZ
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Profile, 'id' | 'created_at'>> & {
          updated_at?: string;
        };
      };
      pr_baselines: {
        Row: PRBaseline;
        Insert: Omit<PRBaseline, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<PRBaseline, 'id' | 'user_id' | 'created_at'>> & {
          updated_at?: string;
        };
      };
      exercises: {
        Row: ExerciseRow;
        Insert: Omit<ExerciseRow, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<ExerciseRow, 'id' | 'user_id' | 'created_at'>> & {
          updated_at?: string;
        };
      };
      workout_plans: {
        Row: WorkoutPlanRow;
        Insert: Omit<WorkoutPlanRow, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<WorkoutPlanRow, 'id' | 'user_id' | 'created_at'>> & {
          updated_at?: string;
        };
      };
      plan_days: {
        Row: PlanDayRow;
        Insert: Omit<PlanDayRow, 'id' | 'created_at'> & {
          id?: string;
          weekday?: number | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: Partial<Omit<PlanDayRow, 'id' | 'plan_id' | 'created_at'>>;
      };
      plan_day_exercises: {
        Row: PlanDayExerciseRow;
        Insert: Omit<PlanDayExerciseRow, 'id' | 'created_at'> & {
          id?: string;
          sort_order?: number;
          target_sets?: any;
          notes?: string | null;
          unit_override?: string | null;
          weight_progression?: string;
          created_at?: string;
        };
        Update: Partial<Omit<PlanDayExerciseRow, 'id' | 'plan_day_id' | 'created_at'>>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
