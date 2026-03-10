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
      title: 'Quick Workout',
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
    useWorkoutStore.getState().logSet('se-1', makeSetLog());

    const state = useWorkoutStore.getState();
    const exercise = state.activeSession!.exercises.find((e) => e.id === 'se-1');
    expect(exercise!.logged_sets).toHaveLength(1);
    expect(exercise!.logged_sets[0].weight).toBe(135);
    expect(exercise!.logged_sets[0].reps).toBe(8);

    // Other exercise is unaffected
    const otherExercise = state.activeSession!.exercises.find((e) => e.id === 'se-2');
    expect(otherExercise!.logged_sets).toHaveLength(0);
  });

  it('logSet with non-existent exerciseId is a no-op', () => {
    useWorkoutStore.getState().logSet('nonexistent', makeSetLog());

    const state = useWorkoutStore.getState();
    expect(state.activeSession!.exercises[0].logged_sets).toHaveLength(0);
    expect(state.activeSession!.exercises[1].logged_sets).toHaveLength(0);
  });

  it('multiple logSet calls accumulate sets with incrementing set_number', () => {
    useWorkoutStore.getState().logSet('se-1', makeSetLog({ id: 'set-1' }));
    useWorkoutStore.getState().logSet('se-1', makeSetLog({ id: 'set-2', weight: 145 }));
    useWorkoutStore.getState().logSet('se-1', makeSetLog({ id: 'set-3', weight: 155 }));

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
    useWorkoutStore.getState().logSet('se-1', makeSetLog({ is_pr: true }));

    const state = useWorkoutStore.getState();
    expect(state.activeSession!.exercises[0].logged_sets[0].is_pr).toBe(true);
  });

  it('logSet records logged_at timestamp', () => {
    const now = new Date().toISOString();
    useWorkoutStore.getState().logSet('se-1', makeSetLog({ logged_at: now }));

    const state = useWorkoutStore.getState();
    expect(state.activeSession!.exercises[0].logged_sets[0].logged_at).toBe(now);
  });

  it('logSet targets correct exercise when duplicate exercise_ids exist', () => {
    // Set up session with two exercises sharing the same exercise_id
    useWorkoutStore.setState({
      activeSession: {
        id: 'session-dup',
        user_id: USER_ID,
        plan_id: null,
        plan_day_id: null,
        title: 'Duplicate Test',
        started_at: new Date().toISOString(),
        ended_at: null,
        exercises: [
          {
            id: 'se-1',
            exercise_id: 'ex-1',
            exercise_name: 'Bench Press (Set A)',
            sort_order: 0,
            target_sets: [],
            weight_progression: 'manual',
            unit: 'lbs',
            logged_sets: [],
          },
          {
            id: 'se-3',
            exercise_id: 'ex-1',
            exercise_name: 'Bench Press (Set B)',
            sort_order: 1,
            target_sets: [],
            weight_progression: 'manual',
            unit: 'lbs',
            logged_sets: [],
          },
        ],
      },
      currentExerciseIndex: 0,
    });

    // Log a set targeting the SECOND occurrence by session exercise id
    useWorkoutStore.getState().logSet('se-3', makeSetLog({ weight: 200 }));

    const state = useWorkoutStore.getState();
    const first = state.activeSession!.exercises.find((e) => e.id === 'se-1');
    const second = state.activeSession!.exercises.find((e) => e.id === 'se-3');
    expect(first!.logged_sets).toHaveLength(0);
    expect(second!.logged_sets).toHaveLength(1);
    expect(second!.logged_sets[0].weight).toBe(200);
  });

  it('removeExercise removes correct exercise when duplicate exercise_ids exist', () => {
    useWorkoutStore.setState({
      activeSession: {
        id: 'session-dup2',
        user_id: USER_ID,
        plan_id: null,
        plan_day_id: null,
        title: 'Duplicate Remove Test',
        started_at: new Date().toISOString(),
        ended_at: null,
        exercises: [
          {
            id: 'se-1',
            exercise_id: 'ex-1',
            exercise_name: 'Bench Press (Set A)',
            sort_order: 0,
            target_sets: [],
            weight_progression: 'manual',
            unit: 'lbs',
            logged_sets: [],
          },
          {
            id: 'se-3',
            exercise_id: 'ex-1',
            exercise_name: 'Bench Press (Set B)',
            sort_order: 1,
            target_sets: [],
            weight_progression: 'manual',
            unit: 'lbs',
            logged_sets: [],
          },
        ],
      },
      currentExerciseIndex: 0,
    });

    // Remove the first occurrence by session exercise id
    useWorkoutStore.getState().removeExercise('se-1');

    const state = useWorkoutStore.getState();
    expect(state.activeSession!.exercises).toHaveLength(1);
    expect(state.activeSession!.exercises[0].id).toBe('se-3');
  });
});
