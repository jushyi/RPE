export interface WeeklySetLog {
  setNumber: number;
  weight: number;
  reps: number;
  unit: 'kg' | 'lbs';
  isPR: boolean;
}

export interface WeeklyExercise {
  name: string;
  muscleGroups: string[];
  sets: WeeklySetLog[];
  totalVolume: number;
}

export interface WeeklySession {
  id: string;
  startedAt: string;
  endedAt: string;
  durationMinutes: number | null;
  planName: string | null;
  dayName: string | null;
  exercises: WeeklyExercise[];
  totalVolume: number;
  prCount: number;
}

export interface WeeklyDay {
  date: Date;
  dayLabel: string; // "Mon", "Tue", etc.
  dayFull: string; // "Monday", "Tuesday", etc.
  dateLabel: string; // "Mar 16"
  sessions: WeeklySession[];
  totalVolume: number;
  prCount: number;
  isToday: boolean;
}

export interface WeeklySummary {
  weekStart: Date;
  weekEnd: Date;
  totalWorkouts: number;
  totalVolume: number;
  totalPRs: number;
  totalExercises: number;
  avgDurationMinutes: number | null;
  weeklyStreak: number;
  days: WeeklyDay[];
  muscleGroupCounts: Record<string, number>;
}
