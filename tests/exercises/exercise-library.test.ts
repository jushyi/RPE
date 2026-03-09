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
    result = result.filter((e) => e.muscle_group === selectedMuscleGroup);
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
  muscle_group: 'Chest',
  equipment: 'Barbell',
  notes: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  ...overrides,
});

const sampleExercises: Exercise[] = [
  makeExercise({ id: '1', name: 'Bench Press', muscle_group: 'Chest', equipment: 'Barbell' }),
  makeExercise({ id: '2', name: 'Incline Bench Press', muscle_group: 'Chest', equipment: 'Barbell' }),
  makeExercise({ id: '3', name: 'Dumbbell Flyes', muscle_group: 'Chest', equipment: 'Dumbbell' }),
  makeExercise({ id: '4', name: 'Barbell Row', muscle_group: 'Lats', equipment: 'Barbell' }),
  makeExercise({ id: '5', name: 'Lat Pulldown', muscle_group: 'Lats', equipment: 'Cable' }),
  makeExercise({ id: '6', name: 'Squat', muscle_group: 'Quads', equipment: 'Barbell' }),
  makeExercise({ id: '7', name: 'Leg Press', muscle_group: 'Quads', equipment: 'Machine' }),
  makeExercise({ id: '8', name: 'Triceps Pushdown', muscle_group: 'Triceps', equipment: 'Cable' }),
  makeExercise({ id: '9', name: 'Plank', muscle_group: 'Core', equipment: 'Bodyweight' }),
  makeExercise({ id: '10', name: 'Custom Press', muscle_group: 'Chest', equipment: 'Barbell', user_id: 'user-123' }),
];

describe('Exercise filtering', () => {
  it('returns all exercises when no filters applied', () => {
    const result = filterExercises(sampleExercises, null, null, '');
    expect(result).toHaveLength(10);
  });

  it('filters by muscle group', () => {
    const result = filterExercises(sampleExercises, 'Chest', null, '');
    expect(result).toHaveLength(4); // 3 global chest + 1 custom chest
    expect(result.every((e) => e.muscle_group === 'Chest')).toBe(true);
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
    expect(result.every((e) => e.muscle_group === 'Chest' && e.equipment === 'Barbell')).toBe(true);
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
