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
  exercise_id: string | null; // UUID, references exercises(id)
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
  track_prs: boolean;
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

export interface WorkoutSessionRow {
  id: string; // UUID
  user_id: string; // UUID, references auth.users(id)
  plan_id: string | null; // UUID, references workout_plans(id)
  plan_day_id: string | null; // UUID, references plan_days(id)
  started_at: string; // TIMESTAMPTZ
  ended_at: string | null; // TIMESTAMPTZ
  created_at: string; // TIMESTAMPTZ
}

export interface SessionExerciseRow {
  id: string; // UUID
  session_id: string; // UUID, references workout_sessions(id)
  exercise_id: string; // UUID, references exercises(id)
  sort_order: number; // SMALLINT
  created_at: string; // TIMESTAMPTZ
}

export interface SetLogRow {
  id: string; // UUID
  session_exercise_id: string; // UUID, references session_exercises(id)
  set_number: number; // SMALLINT
  weight: number; // NUMERIC(6,2)
  reps: number; // SMALLINT
  unit: 'kg' | 'lbs';
  is_pr: boolean;
  logged_at: string; // TIMESTAMPTZ
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
        Insert: Omit<PRBaseline, 'id' | 'created_at' | 'updated_at' | 'exercise_id'> & {
          id?: string;
          exercise_id?: string | null;
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
      workout_sessions: {
        Row: WorkoutSessionRow;
        Insert: Omit<WorkoutSessionRow, 'id' | 'created_at'> & {
          id?: string;
          plan_id?: string | null;
          plan_day_id?: string | null;
          started_at?: string;
          ended_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Omit<WorkoutSessionRow, 'id' | 'user_id' | 'created_at'>>;
      };
      session_exercises: {
        Row: SessionExerciseRow;
        Insert: Omit<SessionExerciseRow, 'id' | 'created_at'> & {
          id?: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: Partial<Omit<SessionExerciseRow, 'id' | 'session_id' | 'created_at'>>;
      };
      set_logs: {
        Row: SetLogRow;
        Insert: Omit<SetLogRow, 'id'> & {
          id?: string;
          is_pr?: boolean;
        };
        Update: Partial<Omit<SetLogRow, 'id' | 'session_exercise_id'>>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
