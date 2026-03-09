import { useExerciseStore } from '@/stores/exerciseStore';
import type { Exercise } from '@/features/exercises/types';

const mockExercise = (overrides: Partial<Exercise> = {}): Exercise => ({
  id: 'test-id-1',
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

describe('exerciseStore', () => {
  beforeEach(() => {
    // Reset store state between tests
    useExerciseStore.setState({
      exercises: [],
      isLoading: false,
      lastFetched: null,
    });
  });

  it('starts with empty exercises', () => {
    const state = useExerciseStore.getState();
    expect(state.exercises).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.lastFetched).toBeNull();
  });

  it('setExercises replaces exercises and sets lastFetched', () => {
    const exercises = [mockExercise(), mockExercise({ id: 'test-id-2', name: 'Squat', muscle_groups: ['Quads', 'Glutes'] })];
    useExerciseStore.getState().setExercises(exercises);

    const state = useExerciseStore.getState();
    expect(state.exercises).toHaveLength(2);
    expect(state.exercises[0].name).toBe('Bench Press');
    expect(state.exercises[1].name).toBe('Squat');
    expect(state.lastFetched).toBeGreaterThan(0);
  });

  it('addExercise appends to exercises', () => {
    useExerciseStore.getState().setExercises([mockExercise()]);
    useExerciseStore.getState().addExercise(
      mockExercise({ id: 'test-id-2', name: 'Squat', muscle_groups: ['Quads', 'Glutes'] })
    );

    const state = useExerciseStore.getState();
    expect(state.exercises).toHaveLength(2);
    expect(state.exercises[1].name).toBe('Squat');
  });

  it('updateExercise updates the matching exercise by id', () => {
    useExerciseStore.getState().setExercises([
      mockExercise(),
      mockExercise({ id: 'test-id-2', name: 'Squat', muscle_groups: ['Quads', 'Glutes'] }),
    ]);

    useExerciseStore.getState().updateExercise('test-id-1', { name: 'Incline Bench Press' });

    const state = useExerciseStore.getState();
    expect(state.exercises[0].name).toBe('Incline Bench Press');
    expect(state.exercises[1].name).toBe('Squat');
  });

  it('updateExercise does nothing for non-existent id', () => {
    useExerciseStore.getState().setExercises([mockExercise()]);
    useExerciseStore.getState().updateExercise('nonexistent', { name: 'Ghost' });

    const state = useExerciseStore.getState();
    expect(state.exercises).toHaveLength(1);
    expect(state.exercises[0].name).toBe('Bench Press');
  });

  it('removeExercise removes exercise by id', () => {
    useExerciseStore.getState().setExercises([
      mockExercise(),
      mockExercise({ id: 'test-id-2', name: 'Squat', muscle_groups: ['Quads', 'Glutes'] }),
    ]);

    useExerciseStore.getState().removeExercise('test-id-1');

    const state = useExerciseStore.getState();
    expect(state.exercises).toHaveLength(1);
    expect(state.exercises[0].name).toBe('Squat');
  });

  it('setLoading updates isLoading flag', () => {
    useExerciseStore.getState().setLoading(true);
    expect(useExerciseStore.getState().isLoading).toBe(true);

    useExerciseStore.getState().setLoading(false);
    expect(useExerciseStore.getState().isLoading).toBe(false);
  });
});
