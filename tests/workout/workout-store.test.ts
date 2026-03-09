import { useWorkoutStore } from '@/stores/workoutStore';
import type { WorkoutSession, SessionExercise } from '@/features/workout/types';
import type { PlanDay } from '@/features/plans/types';

const mockPlanDay: PlanDay = {
  id: 'day-1',
  plan_id: 'plan-1',
  day_name: 'Push Day',
  weekday: 1,
  sort_order: 0,
  created_at: '2026-01-01T00:00:00Z',
  plan_day_exercises: [
    {
      id: 'pde-1',
      plan_day_id: 'day-1',
      exercise_id: 'ex-1',
      sort_order: 0,
      target_sets: [{ weight: 135, reps: 8, rpe: 7 }],
      notes: null,
      unit_override: 'lbs',
      weight_progression: 'carry_previous',
      created_at: '2026-01-01T00:00:00Z',
      exercise: {
        id: 'ex-1',
        name: 'Bench Press',
        muscle_groups: ['Chest'],
        equipment: 'Barbell',
        user_id: null,
        notes: null,
        track_prs: true,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
    },
    {
      id: 'pde-2',
      plan_day_id: 'day-1',
      exercise_id: 'ex-2',
      sort_order: 1,
      target_sets: [{ weight: 50, reps: 12, rpe: null }],
      notes: null,
      unit_override: null,
      weight_progression: 'manual',
      created_at: '2026-01-01T00:00:00Z',
      exercise: {
        id: 'ex-2',
        name: 'Dumbbell Flyes',
        muscle_groups: ['Chest'],
        equipment: 'Dumbbell',
        user_id: null,
        notes: null,
        track_prs: false,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
    },
  ],
};

const mockSessionExercise: SessionExercise = {
  id: 'se-new',
  exercise_id: 'ex-3',
  exercise_name: 'Squat',
  sort_order: 0,
  target_sets: [],
  weight_progression: 'manual',
  unit: 'lbs',
  logged_sets: [],
};

const USER_ID = 'user-123';

describe('workoutStore', () => {
  beforeEach(() => {
    useWorkoutStore.setState({
      activeSession: null,
      currentExerciseIndex: 0,
    });
  });

  it('starts with no active session', () => {
    const state = useWorkoutStore.getState();
    expect(state.activeSession).toBeNull();
    expect(state.currentExerciseIndex).toBe(0);
  });

  it('startPlanSession creates session with exercises from plan day', () => {
    useWorkoutStore.getState().startPlanSession(mockPlanDay, USER_ID);

    const state = useWorkoutStore.getState();
    expect(state.activeSession).not.toBeNull();
    expect(state.activeSession!.plan_id).toBe('plan-1');
    expect(state.activeSession!.plan_day_id).toBe('day-1');
    expect(state.activeSession!.user_id).toBe(USER_ID);
    expect(state.activeSession!.exercises).toHaveLength(2);
    expect(state.activeSession!.exercises[0].exercise_name).toBe('Bench Press');
    expect(state.activeSession!.exercises[0].exercise_id).toBe('ex-1');
    expect(state.activeSession!.exercises[1].exercise_name).toBe('Dumbbell Flyes');
    expect(state.currentExerciseIndex).toBe(0);
  });

  it('startFreestyleSession creates session with empty exercises array', () => {
    useWorkoutStore.getState().startFreestyleSession(USER_ID);

    const state = useWorkoutStore.getState();
    expect(state.activeSession).not.toBeNull();
    expect(state.activeSession!.plan_id).toBeNull();
    expect(state.activeSession!.plan_day_id).toBeNull();
    expect(state.activeSession!.user_id).toBe(USER_ID);
    expect(state.activeSession!.exercises).toEqual([]);
  });

  it('addExercise appends to exercises array', () => {
    useWorkoutStore.getState().startFreestyleSession(USER_ID);
    useWorkoutStore.getState().addExercise(mockSessionExercise);

    const state = useWorkoutStore.getState();
    expect(state.activeSession!.exercises).toHaveLength(1);
    expect(state.activeSession!.exercises[0].exercise_name).toBe('Squat');
  });

  it('removeExercise removes correct exercise', () => {
    useWorkoutStore.getState().startPlanSession(mockPlanDay, USER_ID);
    useWorkoutStore.getState().removeExercise('ex-1');

    const state = useWorkoutStore.getState();
    expect(state.activeSession!.exercises).toHaveLength(1);
    expect(state.activeSession!.exercises[0].exercise_id).toBe('ex-2');
  });

  it('reorderExercises replaces exercises array', () => {
    useWorkoutStore.getState().startPlanSession(mockPlanDay, USER_ID);

    const exercises = useWorkoutStore.getState().activeSession!.exercises;
    const reversed = [...exercises].reverse();
    useWorkoutStore.getState().reorderExercises(reversed);

    const state = useWorkoutStore.getState();
    expect(state.activeSession!.exercises[0].exercise_id).toBe('ex-2');
    expect(state.activeSession!.exercises[1].exercise_id).toBe('ex-1');
  });

  it('setCurrentExerciseIndex updates index', () => {
    useWorkoutStore.getState().setCurrentExerciseIndex(3);
    expect(useWorkoutStore.getState().currentExerciseIndex).toBe(3);
  });

  it('finishSession returns session with ended_at and clears activeSession', () => {
    useWorkoutStore.getState().startFreestyleSession(USER_ID);

    const completed = useWorkoutStore.getState().finishSession();

    expect(completed).not.toBeNull();
    expect(completed!.ended_at).not.toBeNull();
    expect(completed!.user_id).toBe(USER_ID);
    expect(useWorkoutStore.getState().activeSession).toBeNull();
    expect(useWorkoutStore.getState().currentExerciseIndex).toBe(0);
  });

  it('discardSession clears activeSession', () => {
    useWorkoutStore.getState().startFreestyleSession(USER_ID);
    useWorkoutStore.getState().discardSession();

    expect(useWorkoutStore.getState().activeSession).toBeNull();
    expect(useWorkoutStore.getState().currentExerciseIndex).toBe(0);
  });

  it('starting a session while one exists replaces the old session', () => {
    useWorkoutStore.getState().startFreestyleSession(USER_ID);
    const firstSessionId = useWorkoutStore.getState().activeSession!.id;

    useWorkoutStore.getState().startPlanSession(mockPlanDay, USER_ID);
    const state = useWorkoutStore.getState();

    expect(state.activeSession!.id).not.toBe(firstSessionId);
    expect(state.activeSession!.plan_id).toBe('plan-1');
  });
});
