/**
 * Exercise type definitions for the exercise library.
 * MuscleGroup and Equipment are union types matching the database schema.
 */

export type MuscleGroup =
  | 'Chest'
  | 'Lats'
  | 'Delts'
  | 'Biceps'
  | 'Triceps'
  | 'Forearms'
  | 'Quads'
  | 'Hamstrings'
  | 'Glutes'
  | 'Calves'
  | 'Core'
  | 'Traps';

export type Equipment =
  | 'Barbell'
  | 'Dumbbell'
  | 'Cable'
  | 'Machine'
  | 'Bodyweight'
  | 'Kettlebell'
  | 'Band'
  | 'Other';

export interface Exercise {
  id: string;
  user_id: string | null; // null = global seed exercise
  name: string;
  muscle_groups: MuscleGroup[];
  equipment: Equipment;
  notes: string | null;
  track_prs: boolean;
  created_at: string;
  updated_at: string;
}

/** Check if exercise is custom (user-created) vs global seed */
export const isCustomExercise = (exercise: Exercise): boolean =>
  exercise.user_id !== null;
