/**
 * Tests for exercise filtering logic.
 * Extracts the filtering useMemo logic as a pure function for testability.
 */

import type { Exercise, MuscleGroup, Equipment } from '@/features/exercises/types';
import { isCustomExercise } from '@/features/exercises/types';

// Pure function matching the useMemo filter logic in exercises.tsx
function filterExercises(
  exercises: Exercise[],
  selectedMuscleGroup: MuscleGroup | null,
  selectedEquipment: Equipment | null,
  searchQuery: string
): Exercise[] {
  let result = exercises;

  if (selectedMuscleGroup) {
    result = result.filter((e) => e.muscle_groups.includes(selectedMuscleGroup));
  }
  if (selectedEquipment) {
    result = result.filter((e) => e.equipment === selectedEquipment);
  }
  if (searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase();
    result = result.filter((e) => e.name.toLowerCase().includes(q));
  }

  return result;
}

const makeExercise = (overrides: Partial<Exercise>): Exercise => ({
  id: 'id-1',
  user_id: null,
  name: 'Bench Press',
  muscle_groups: ['Chest', 'Triceps'],
  equipment: 'Barbell',
  notes: null,
  track_prs: false,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  ...overrides,
});

const sampleExercises: Exercise[] = [
  makeExercise({ id: '1', name: 'Bench Press', muscle_groups: ['Chest', 'Triceps'], equipment: 'Barbell' }),
  makeExercise({ id: '2', name: 'Incline Bench Press', muscle_groups: ['Chest', 'Delts'], equipment: 'Barbell' }),
  makeExercise({ id: '3', name: 'Dumbbell Flyes', muscle_groups: ['Chest'], equipment: 'Dumbbell' }),
  makeExercise({ id: '4', name: 'Barbell Row', muscle_groups: ['Lats', 'Biceps'], equipment: 'Barbell' }),
  makeExercise({ id: '5', name: 'Lat Pulldown', muscle_groups: ['Lats', 'Biceps'], equipment: 'Cable' }),
  makeExercise({ id: '6', name: 'Squat', muscle_groups: ['Quads', 'Glutes'], equipment: 'Barbell' }),
  makeExercise({ id: '7', name: 'Leg Press', muscle_groups: ['Quads', 'Glutes'], equipment: 'Machine' }),
  makeExercise({ id: '8', name: 'Triceps Pushdown', muscle_groups: ['Triceps'], equipment: 'Cable' }),
  makeExercise({ id: '9', name: 'Plank', muscle_groups: ['Core'], equipment: 'Bodyweight' }),
  makeExercise({ id: '10', name: 'Custom Press', muscle_groups: ['Chest'], equipment: 'Barbell', user_id: 'user-123' }),
];

describe('Exercise filtering', () => {
  it('returns all exercises when no filters applied', () => {
    const result = filterExercises(sampleExercises, null, null, '');
    expect(result).toHaveLength(10);
  });

  it('filters by muscle group (includes multi-muscle exercises)', () => {
    const result = filterExercises(sampleExercises, 'Chest', null, '');
    expect(result).toHaveLength(4); // Bench, Incline, Flyes, Custom Press
    expect(result.every((e) => e.muscle_groups.includes('Chest'))).toBe(true);
  });

  it('filters by secondary muscle group', () => {
    const result = filterExercises(sampleExercises, 'Triceps', null, '');
    expect(result).toHaveLength(2); // Bench Press (Chest+Triceps), Triceps Pushdown
    expect(result.every((e) => e.muscle_groups.includes('Triceps'))).toBe(true);
  });

  it('filters by equipment', () => {
    const result = filterExercises(sampleExercises, null, 'Cable', '');
    expect(result).toHaveLength(2);
    expect(result.every((e) => e.equipment === 'Cable')).toBe(true);
  });

  it('filters by search query (case-insensitive)', () => {
    const result = filterExercises(sampleExercises, null, null, 'bench');
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Bench Press');
    expect(result[1].name).toBe('Incline Bench Press');
  });

  it('combines muscle group + equipment filters', () => {
    const result = filterExercises(sampleExercises, 'Chest', 'Barbell', '');
    expect(result).toHaveLength(3); // Bench, Incline Bench, Custom Press
    expect(result.every((e) => e.muscle_groups.includes('Chest') && e.equipment === 'Barbell')).toBe(true);
  });

  it('combines muscle group + search filters', () => {
    const result = filterExercises(sampleExercises, 'Chest', null, 'bench');
    expect(result).toHaveLength(2);
  });

  it('combines all three filters', () => {
    const result = filterExercises(sampleExercises, 'Chest', 'Barbell', 'bench');
    expect(result).toHaveLength(2); // Bench Press, Incline Bench Press
  });

  it('returns empty array when no matches', () => {
    const result = filterExercises(sampleExercises, 'Forearms', null, '');
    expect(result).toHaveLength(0);
  });

  it('search with whitespace trims correctly', () => {
    const result = filterExercises(sampleExercises, null, null, '  plank  ');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Plank');
  });

  it('empty search string returns all', () => {
    const result = filterExercises(sampleExercises, null, null, '   ');
    expect(result).toHaveLength(10);
  });
});

describe('isCustomExercise', () => {
  it('returns true for exercise with user_id', () => {
    const exercise = makeExercise({ user_id: 'user-123' });
    expect(isCustomExercise(exercise)).toBe(true);
  });

  it('returns false for global seed exercise', () => {
    const exercise = makeExercise({ user_id: null });
    expect(isCustomExercise(exercise)).toBe(false);
  });
});
