export type TimeRange = '1M' | '3M' | '6M' | '1Y' | 'all';
export type ChartMetric = 'estimated_1rm' | 'max_weight' | 'total_volume';

export interface ChartPoint {
  date: number;  // Unix timestamp ms (for CartesianChart xKey)
  estimated_1rm: number;
  max_weight: number;
  total_volume: number;
}

export interface BodyweightEntry {
  id: string;
  weight: number;
  unit: 'kg' | 'lbs';
  logged_at: string; // ISO date string (YYYY-MM-DD)
  created_at: string;
}

export interface SparklineData {
  date: number;  // Unix timestamp ms
  value: number;
}

export interface ProgressSummary {
  weeklyStreak: number;
  recentPRs: Array<{ exerciseName: string; weight: number; unit: string; date: string }>;
  weekWorkoutCount: number;
  weekTotalVolume: number;
}

export interface TodaysWorkoutState {
  state: 'planned' | 'rest-day' | 'no-plan';
  plan?: { id: string; name: string };
  todayDay?: { id: string; label: string; exerciseCount: number; estimatedDuration: number };
  nextDay?: { label: string; dayName: string }; // For rest day teaser
}
