import { determineTodaysWorkout } from '@/features/dashboard/hooks/useTodaysWorkout';
import { estimateWorkoutDuration } from '@/features/progress/utils/chartHelpers';
import type { Plan, PlanDay, PlanDayExercise } from '@/features/plans/types';

function makePlanDay(overrides: Partial<PlanDay> & { weekday: number | null }): PlanDay {
  return {
    id: `day-${overrides.weekday}`,
    plan_id: 'plan-1',
    day_name: overrides.day_name ?? `Day ${overrides.weekday}`,
    weekday: overrides.weekday,
    sort_order: overrides.sort_order ?? 0,
    created_at: '2026-01-01T00:00:00Z',
    plan_day_exercises: overrides.plan_day_exercises ?? [
      { id: 'e1', plan_day_id: `day-${overrides.weekday}`, exercise_id: 'ex1', sort_order: 0, target_sets: [{weight: 100, reps: 5, rpe: null}, {weight: 100, reps: 5, rpe: null}, {weight: 100, reps: 5, rpe: null}], notes: null, unit_override: null, weight_progression: 'manual', created_at: '2026-01-01T00:00:00Z' } as PlanDayExercise,
      { id: 'e2', plan_day_id: `day-${overrides.weekday}`, exercise_id: 'ex2', sort_order: 1, target_sets: [{weight: 80, reps: 8, rpe: null}, {weight: 80, reps: 8, rpe: null}, {weight: 80, reps: 8, rpe: null}], notes: null, unit_override: null, weight_progression: 'manual', created_at: '2026-01-01T00:00:00Z' } as PlanDayExercise,
    ],
  };
}

function makePlan(days: PlanDay[]): Plan {
  return {
    id: 'plan-1',
    user_id: 'user-1',
    name: 'Push Pull Legs',
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    plan_days: days,
  };
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

describe('determineTodaysWorkout', () => {
  it('returns no-plan when no active plan exists', () => {
    const result = determineTodaysWorkout(null, 1); // Monday
    expect(result.state).toBe('no-plan');
  });

  it('returns planned when today matches a plan day', () => {
    const plan = makePlan([
      makePlanDay({ weekday: 1, day_name: 'Push Day' }),  // Monday
      makePlanDay({ weekday: 3, day_name: 'Pull Day' }),  // Wednesday
      makePlanDay({ weekday: 5, day_name: 'Leg Day' }),   // Friday
    ]);

    const result = determineTodaysWorkout(plan, 1); // Monday
    expect(result.state).toBe('planned');
    expect(result.plan?.name).toBe('Push Pull Legs');
    expect(result.todayDay?.label).toBe('Push Day');
    expect(result.todayDay?.exerciseCount).toBe(2);
    expect(result.todayDay?.estimatedDuration).toBe(estimateWorkoutDuration(2, 6));
  });

  it('returns rest-day when active plan exists but today has no workout', () => {
    const plan = makePlan([
      makePlanDay({ weekday: 1, day_name: 'Push Day' }),  // Monday
      makePlanDay({ weekday: 3, day_name: 'Pull Day' }),  // Wednesday
      makePlanDay({ weekday: 5, day_name: 'Leg Day' }),   // Friday
    ]);

    const result = determineTodaysWorkout(plan, 2); // Tuesday
    expect(result.state).toBe('rest-day');
    expect(result.nextDay?.label).toBe('Pull Day');
    expect(result.nextDay?.dayName).toBe('Wednesday');
  });

  it('wraps around the week (Saturday -> next Monday)', () => {
    const plan = makePlan([
      makePlanDay({ weekday: 1, day_name: 'Push Day' }),  // Monday
      makePlanDay({ weekday: 3, day_name: 'Pull Day' }),  // Wednesday
      makePlanDay({ weekday: 5, day_name: 'Leg Day' }),   // Friday
    ]);

    const result = determineTodaysWorkout(plan, 6); // Saturday
    expect(result.state).toBe('rest-day');
    expect(result.nextDay?.label).toBe('Push Day');
    expect(result.nextDay?.dayName).toBe('Monday');
  });

  it('handles Sunday wrapping (no planned days after Sunday)', () => {
    const plan = makePlan([
      makePlanDay({ weekday: 1, day_name: 'Push Day' }),
      makePlanDay({ weekday: 5, day_name: 'Leg Day' }),
    ]);

    const result = determineTodaysWorkout(plan, 0); // Sunday
    expect(result.state).toBe('rest-day');
    expect(result.nextDay?.label).toBe('Push Day');
    expect(result.nextDay?.dayName).toBe('Monday');
  });

  it('handles plan with no weekday assignments (all null weekdays)', () => {
    const plan = makePlan([
      makePlanDay({ weekday: null, day_name: 'Flex Day' }),
    ]);

    const result = determineTodaysWorkout(plan, 3); // Wednesday
    expect(result.state).toBe('rest-day');
    // No next day since no weekday assigned
    expect(result.nextDay).toBeUndefined();
  });
});

describe('estimateWorkoutDuration', () => {
  it('calculates 3 min/set + 2 min/exercise', () => {
    // Already tested in chart-data.test.ts -- just verifying import works
    expect(estimateWorkoutDuration(3, 9)).toBe(33); // 9*3 + 3*2
  });
});
