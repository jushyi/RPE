import { useExerciseStore } from '@/stores/exerciseStore';
import type { Exercise } from '@/features/exercises/types';

const mockExercise = (overrides: Partial<Exercise> = {}): Exercise => ({
  id: 'test-id-1',
  user_id: null,
  name: 'Bench Press',
  muscle_group: 'Chest',
  equipment: 'Barbell',
  notes: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  ...overrides,
});

describe('Exercise CRUD operations', () => {
  beforeEach(() => {
    useExerciseStore.setState({
      exercises: [],
      isLoading: false,
      lastFetched: null,
    });
  });

  describe('createExercise (store-level)', () => {
    it('adds a new exercise to the store', () => {
      const newExercise = mockExercise({
        id: 'custom-1',
        user_id: 'user-123',
        name: 'Landmine Press',
        muscle_group: 'Delts',
        equipment: 'Barbell',
      });

      useExerciseStore.getState().addExercise(newExercise);

      const { exercises } = useExerciseStore.getState();
      expect(exercises).toHaveLength(1);
      expect(exercises[0].name).toBe('Landmine Press');
      expect(exercises[0].user_id).toBe('user-123');
    });

    it('appends to existing exercises without replacing', () => {
      useExerciseStore.getState().setExercises([mockExercise()]);
      useExerciseStore.getState().addExercise(
        mockExercise({ id: 'custom-2', name: 'Cable Fly' })
      );

      const { exercises } = useExerciseStore.getState();
      expect(exercises).toHaveLength(2);
      expect(exercises[0].name).toBe('Bench Press');
      expect(exercises[1].name).toBe('Cable Fly');
    });
  });

  describe('updateExercise (store-level)', () => {
    it('modifies the correct exercise by id', () => {
      useExerciseStore.getState().setExercises([
        mockExercise({ id: 'e1', name: 'Bench Press' }),
        mockExercise({ id: 'e2', name: 'Squat' }),
      ]);

      useExerciseStore.getState().updateExercise('e1', {
        name: 'Incline Bench Press',
        notes: 'Updated notes',
      });

      const { exercises } = useExerciseStore.getState();
      expect(exercises[0].name).toBe('Incline Bench Press');
      expect(exercises[0].notes).toBe('Updated notes');
      expect(exercises[1].name).toBe('Squat');
    });

    it('does not modify other exercises', () => {
      useExerciseStore.getState().setExercises([
        mockExercise({ id: 'e1', name: 'Bench Press' }),
        mockExercise({ id: 'e2', name: 'Squat' }),
      ]);

      useExerciseStore.getState().updateExercise('e1', { name: 'Changed' });

      const { exercises } = useExerciseStore.getState();
      expect(exercises[1].name).toBe('Squat');
      expect(exercises[1].equipment).toBe('Barbell');
    });
  });

  describe('deleteExercise (store-level)', () => {
    it('removes the exercise from the store', () => {
      useExerciseStore.getState().setExercises([
        mockExercise({ id: 'e1', name: 'Bench Press' }),
        mockExercise({ id: 'e2', name: 'Squat' }),
      ]);

      useExerciseStore.getState().removeExercise('e1');

      const { exercises } = useExerciseStore.getState();
      expect(exercises).toHaveLength(1);
      expect(exercises[0].name).toBe('Squat');
    });

    it('does nothing for non-existent id', () => {
      useExerciseStore.getState().setExercises([mockExercise()]);
      useExerciseStore.getState().removeExercise('nonexistent');

      const { exercises } = useExerciseStore.getState();
      expect(exercises).toHaveLength(1);
    });
  });

  describe('duplicate name detection', () => {
    it('detects case-insensitive duplicate names', () => {
      const exercises = [
        mockExercise({ id: 'e1', name: 'Bench Press' }),
        mockExercise({ id: 'e2', name: 'Squat' }),
      ];

      const checkDuplicate = (name: string, excludeId?: string) => {
        const trimmed = name.trim().toLowerCase();
        return exercises.some(
          (e) => e.name.toLowerCase() === trimmed && e.id !== excludeId
        );
      };

      expect(checkDuplicate('bench press')).toBe(true);
      expect(checkDuplicate('BENCH PRESS')).toBe(true);
      expect(checkDuplicate('Bench Press')).toBe(true);
      expect(checkDuplicate('Deadlift')).toBe(false);
    });

    it('excludes current exercise when editing', () => {
      const exercises = [
        mockExercise({ id: 'e1', name: 'Bench Press' }),
        mockExercise({ id: 'e2', name: 'Squat' }),
      ];

      const checkDuplicate = (name: string, excludeId?: string) => {
        const trimmed = name.trim().toLowerCase();
        return exercises.some(
          (e) => e.name.toLowerCase() === trimmed && e.id !== excludeId
        );
      };

      // When editing "Bench Press" (e1), its own name should not be flagged
      expect(checkDuplicate('Bench Press', 'e1')).toBe(false);
      // But "Squat" would be flagged (it's a different exercise)
      expect(checkDuplicate('Squat', 'e1')).toBe(true);
    });

    it('handles leading/trailing whitespace in names', () => {
      const exercises = [
        mockExercise({ id: 'e1', name: 'Bench Press' }),
      ];

      const checkDuplicate = (name: string) => {
        const trimmed = name.trim().toLowerCase();
        return exercises.some((e) => e.name.toLowerCase() === trimmed);
      };

      expect(checkDuplicate('  Bench Press  ')).toBe(true);
      expect(checkDuplicate('bench press ')).toBe(true);
    });
  });
});
