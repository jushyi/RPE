export interface HistorySetLog {
  id: string;
  set_number: number;
  weight: number;
  reps: number;
  unit: 'kg' | 'lbs';
  is_pr: boolean;
  estimated_1rm: number | null;
  logged_at: string;
  video_url?: string | null;
}

export interface HistoryExercise {
  id: string; // session_exercise id
  exercise_id: string;
  sort_order: number;
  exercise: {
    name: string;
    muscle_groups: string[];
    equipment: string;
    track_prs: boolean;
  };
  set_logs: HistorySetLog[];
}

export interface HistorySession {
  id: string;
  user_id: string;
  plan_id: string | null;
  plan_day_id: string | null;
  started_at: string;
  ended_at: string | null;
  created_at: string;
  // Nested data
  session_exercises: HistoryExercise[];
  // Derived (computed client-side for list display)
  plan_name?: string;
  day_name?: string;
}

// For list display (computed from HistorySession)
export interface SessionListItem {
  id: string;
  date: string; // ended_at formatted
  exerciseNames: string[]; // First 2 + "+N more"
  totalVolume: number; // sum of weight * reps
  prCount: number; // count of is_pr === true sets
  durationMinutes: number | null; // ended_at - started_at
  planName: string | null; // null = freestyle
  dayName: string | null;
  hasVideo: boolean;
}

// Delta comparison result
export interface ExerciseDelta {
  exerciseId: string;
  weightDelta: number; // positive = improvement
  repsDelta: number; // positive = improvement
  hasPrevious: boolean; // false if no prior session for comparison
}
