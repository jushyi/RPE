/**
 * End-to-end test: Plan workout session creation through sync queue.
 * Verifies that plan_id and plan_day_id survive the full flow:
 *   startPlanSession -> logSet -> finishSession -> enqueueCompletedSession
 */
import { useWorkoutStore } from '@/stores/workoutStore';
import {
  enqueueCompletedSession,
  getPendingQueue,
  clearPendingQueue,
} from '@/features/workout/hooks/useSyncQueue';
import type { PlanDay } from '@/features/plans/types';
import type { WorkoutSession } from '@/features/workout/types';

const PLAN_ID = 'plan-abc-123';
const DAY_ID = 'day-xyz-789';
const USER_ID = 'user-trainee-001';

const mockPlanDay: PlanDay = {
  id: DAY_ID,
  plan_id: PLAN_ID,
  day_name: 'Push Day',
  weekday: 1,
  sort_order: 0,
  created_at: '2026-01-01T00:00:00Z',
  alarm_time: null,
  alarm_enabled: false,
  plan_day_exercises: [
    {
      id: 'pde-1',
      plan_day_id: DAY_ID,
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
  ],
};

beforeEach(() => {
  useWorkoutStore.setState({ activeSession: null, currentExerciseIndex: 0 });
  clearPendingQueue();
});

describe('Plan session end-to-end flow', () => {
  it('preserves plan_id and plan_day_id through start -> log -> finish -> enqueue', () => {
    // Step 1: Start plan session
    useWorkoutStore.getState().startPlanSession(mockPlanDay, USER_ID);
    const active = useWorkoutStore.getState().activeSession;
    expect(active).not.toBeNull();
    expect(active!.plan_id).toBe(PLAN_ID);
    expect(active!.plan_day_id).toBe(DAY_ID);

    // Step 2: Log a set
    const exerciseId = active!.exercises[0].id;
    useWorkoutStore.getState().logSet(exerciseId, {
      id: 'set-001',
      weight: 135,
      reps: 8,
      rpe: 7,
      unit: 'lbs',
      is_pr: false,
      logged_at: new Date().toISOString(),
    });

    // Verify plan_id/plan_day_id still present after logging
    const afterLog = useWorkoutStore.getState().activeSession;
    expect(afterLog!.plan_id).toBe(PLAN_ID);
    expect(afterLog!.plan_day_id).toBe(DAY_ID);

    // Step 3: Finish session
    const completed = useWorkoutStore.getState().finishSession();
    expect(completed).not.toBeNull();
    expect(completed!.plan_id).toBe(PLAN_ID);
    expect(completed!.plan_day_id).toBe(DAY_ID);
    expect(completed!.ended_at).not.toBeNull();

    // Step 4: Enqueue to sync queue
    enqueueCompletedSession(completed!);
    const queue = getPendingQueue();

    // Find the workout_sessions sync item
    const sessionItem = queue.find((i) => i.table === 'workout_sessions');
    expect(sessionItem).toBeDefined();
    expect(sessionItem!.data.plan_id).toBe(PLAN_ID);
    expect(sessionItem!.data.plan_day_id).toBe(DAY_ID);
    expect(sessionItem!.data.user_id).toBe(USER_ID);

    // Verify session exercises reference the correct session
    const exerciseItems = queue.filter((i) => i.table === 'session_exercises');
    expect(exerciseItems).toHaveLength(1);
    expect(exerciseItems[0].data.session_id).toBe(completed!.id);

    // Verify set logs
    const setItems = queue.filter((i) => i.table === 'set_logs');
    expect(setItems).toHaveLength(1);
  });

  it('freestyle session has null plan_id and plan_day_id', () => {
    useWorkoutStore.getState().startFreestyleSession(USER_ID);
    const active = useWorkoutStore.getState().activeSession;
    expect(active!.plan_id).toBeNull();
    expect(active!.plan_day_id).toBeNull();

    const completed = useWorkoutStore.getState().finishSession();
    expect(completed!.plan_id).toBeNull();
    expect(completed!.plan_day_id).toBeNull();

    enqueueCompletedSession(completed!);
    const queue = getPendingQueue();
    const sessionItem = queue.find((i) => i.table === 'workout_sessions');
    expect(sessionItem!.data.plan_id).toBeNull();
    expect(sessionItem!.data.plan_day_id).toBeNull();
  });
});
