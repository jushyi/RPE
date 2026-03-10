import { useWorkoutStore } from '@/stores/workoutStore';
import type { SetLog } from '@/features/workout/types';

const USER_ID = 'user-123';

const makeSetLog = (overrides: Partial<Omit<SetLog, 'set_number'>> = {}): Omit<SetLog, 'set_number'> => ({
  id: 'set-' + Math.random().toString(36).slice(2, 8),
  weight: 135,
  reps: 8,
  unit: 'lbs',
  rpe: null,
  is_pr: false,
  logged_at: new Date().toISOString(),
  ...overrides,
});

describe('set logging', () => {
  beforeEach(() => {
    useWorkoutStore.setState({
      activeSession: null,
      currentExerciseIndex: 0,
    });

    // Start a plan-based session with one exercise
    useWorkoutStore.getState().startSession({
      id: 'session-1',
      user_id: USER_ID,
      plan_id: null,
      plan_day_id: null,
      started_at: new Date().toISOString(),
      ended_at: null,
      exercises: [
        {
          id: 'se-1',
          exercise_id: 'ex-1',
          exercise_name: 'Bench Press',
          sort_order: 0,
          target_sets: [{ weight: 135, reps: 8, rpe: 7 }],
          weight_progression: 'carry_previous',
          unit: 'lbs',
          logged_sets: [],
        },
        {
          id: 'se-2',
          exercise_id: 'ex-2',
          exercise_name: 'Squat',
          sort_order: 1,
          target_sets: [],
          weight_progression: 'manual',
          unit: 'lbs',
          logged_sets: [],
        },
      ],
    });
  });

  it('logSet appends set to correct exercise logged_sets', () => {
    useWorkoutStore.getState().logSet('ex-1', makeSetLog());

    const state = useWorkoutStore.getState();
    const exercise = state.activeSession!.exercises.find((e) => e.exercise_id === 'ex-1');
    expect(exercise!.logged_sets).toHaveLength(1);
    expect(exercise!.logged_sets[0].weight).toBe(135);
    expect(exercise!.logged_sets[0].reps).toBe(8);

    // Other exercise is unaffected
    const otherExercise = state.activeSession!.exercises.find((e) => e.exercise_id === 'ex-2');
    expect(otherExercise!.logged_sets).toHaveLength(0);
  });

  it('logSet with non-existent exerciseId is a no-op', () => {
    useWorkoutStore.getState().logSet('nonexistent', makeSetLog());

    const state = useWorkoutStore.getState();
    expect(state.activeSession!.exercises[0].logged_sets).toHaveLength(0);
    expect(state.activeSession!.exercises[1].logged_sets).toHaveLength(0);
  });

  it('multiple logSet calls accumulate sets with incrementing set_number', () => {
    useWorkoutStore.getState().logSet('ex-1', makeSetLog({ id: 'set-1' }));
    useWorkoutStore.getState().logSet('ex-1', makeSetLog({ id: 'set-2', weight: 145 }));
    useWorkoutStore.getState().logSet('ex-1', makeSetLog({ id: 'set-3', weight: 155 }));

    const state = useWorkoutStore.getState();
    const sets = state.activeSession!.exercises[0].logged_sets;
    expect(sets).toHaveLength(3);
    expect(sets[0].set_number).toBe(1);
    expect(sets[1].set_number).toBe(2);
    expect(sets[2].set_number).toBe(3);
    expect(sets[1].weight).toBe(145);
    expect(sets[2].weight).toBe(155);
  });

  it('logSet preserves is_pr flag from input', () => {
    useWorkoutStore.getState().logSet('ex-1', makeSetLog({ is_pr: true }));

    const state = useWorkoutStore.getState();
    expect(state.activeSession!.exercises[0].logged_sets[0].is_pr).toBe(true);
  });

  it('logSet records logged_at timestamp', () => {
    const now = new Date().toISOString();
    useWorkoutStore.getState().logSet('ex-1', makeSetLog({ logged_at: now }));

    const state = useWorkoutStore.getState();
    expect(state.activeSession!.exercises[0].logged_sets[0].logged_at).toBe(now);
  });
});
