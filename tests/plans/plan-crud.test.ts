import { usePlanStore } from '@/stores/planStore';
import type { Plan, PlanDay, PlanDayExercise } from '@/features/plans/types';

const mockPlanDayExercise = (overrides: Partial<PlanDayExercise> = {}): PlanDayExercise => ({
  id: 'pde-1',
  plan_day_id: 'day-1',
  exercise_id: 'ex-1',
  sort_order: 0,
  target_sets: [{ weight: 100, reps: 8, rpe: 7 }],
  notes: null,
  unit_override: null,
  weight_progression: 'carry_previous',
  created_at: '2026-01-01T00:00:00Z',
  exercise: { id: 'ex-1', name: 'Bench Press', muscle_groups: ['Chest'] as any, equipment: 'Barbell' as any, user_id: null, notes: null, track_prs: false, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  ...overrides,
});

const mockPlanDay = (overrides: Partial<PlanDay> = {}): PlanDay => ({
  id: 'day-1',
  plan_id: 'plan-1',
  day_name: 'Push',
  weekday: 1,
  sort_order: 0,
  created_at: '2026-01-01T00:00:00Z',
  alarm_time: null,
  alarm_enabled: false,
  plan_day_exercises: [mockPlanDayExercise()],
  ...overrides,
});

const mockPlan = (overrides: Partial<Plan> = {}): Plan => ({
  id: 'plan-1',
  user_id: 'user-1',
  name: 'Push Pull Legs',
  is_active: false,
  coach_id: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  plan_days: [mockPlanDay()],
  ...overrides,
});

describe('plan-crud: edit draft isolation', () => {
  it('deep clone creates an independent copy that does not affect the original', () => {
    const original = mockPlan();
    const draft: Plan = JSON.parse(JSON.stringify(original));

    // Modify draft
    draft.name = 'Modified Name';
    draft.plan_days[0].day_name = 'Modified Day';
    draft.plan_days[0].plan_day_exercises[0].target_sets[0].weight = 200;

    // Original must be unchanged
    expect(original.name).toBe('Push Pull Legs');
    expect(original.plan_days[0].day_name).toBe('Push');
    expect(original.plan_days[0].plan_day_exercises[0].target_sets[0].weight).toBe(100);

    // Draft must reflect changes
    expect(draft.name).toBe('Modified Name');
    expect(draft.plan_days[0].day_name).toBe('Modified Day');
    expect(draft.plan_days[0].plan_day_exercises[0].target_sets[0].weight).toBe(200);
  });

  it('modifying a draft nested array does not affect original plan_days length', () => {
    const original = mockPlan({
      plan_days: [
        mockPlanDay({ id: 'day-1', day_name: 'Push' }),
        mockPlanDay({ id: 'day-2', day_name: 'Pull', sort_order: 1 }),
      ],
    });
    const draft: Plan = JSON.parse(JSON.stringify(original));

    // Remove a day from draft
    draft.plan_days.splice(0, 1);

    expect(original.plan_days).toHaveLength(2);
    expect(draft.plan_days).toHaveLength(1);
    expect(draft.plan_days[0].day_name).toBe('Pull');
  });
});

describe('plan-crud: store delete', () => {
  beforeEach(() => {
    usePlanStore.setState({
      plans: [],
      isLoading: false,
      lastFetched: null,
    });
  });

  it('removePlan removes the correct plan from store', () => {
    const plans = [
      mockPlan({ id: 'plan-1', name: 'PPL' }),
      mockPlan({ id: 'plan-2', name: 'Upper Lower' }),
    ];
    usePlanStore.getState().setPlans(plans);
    usePlanStore.getState().removePlan('plan-1');

    const state = usePlanStore.getState();
    expect(state.plans).toHaveLength(1);
    expect(state.plans[0].id).toBe('plan-2');
    expect(state.plans[0].name).toBe('Upper Lower');
  });

  it('removePlan does nothing for non-existent id', () => {
    usePlanStore.getState().setPlans([mockPlan()]);
    usePlanStore.getState().removePlan('nonexistent');

    expect(usePlanStore.getState().plans).toHaveLength(1);
  });
});

describe('plan-crud: store setActivePlan', () => {
  beforeEach(() => {
    usePlanStore.setState({
      plans: [],
      isLoading: false,
      lastFetched: null,
    });
  });

  it('setActivePlan marks the target plan active and deactivates all others', () => {
    usePlanStore.getState().setPlans([
      mockPlan({ id: 'plan-1', is_active: true }),
      mockPlan({ id: 'plan-2', is_active: false }),
      mockPlan({ id: 'plan-3', is_active: false }),
    ]);

    usePlanStore.getState().setActivePlan('plan-3');

    const state = usePlanStore.getState();
    expect(state.plans[0].is_active).toBe(false);
    expect(state.plans[1].is_active).toBe(false);
    expect(state.plans[2].is_active).toBe(true);
  });

  it('setActivePlan on already-active plan keeps it active', () => {
    usePlanStore.getState().setPlans([
      mockPlan({ id: 'plan-1', is_active: true }),
      mockPlan({ id: 'plan-2', is_active: false }),
    ]);

    usePlanStore.getState().setActivePlan('plan-1');

    const state = usePlanStore.getState();
    expect(state.plans[0].is_active).toBe(true);
    expect(state.plans[1].is_active).toBe(false);
  });
});

describe('plan-crud: store updatePlan', () => {
  beforeEach(() => {
    usePlanStore.setState({
      plans: [],
      isLoading: false,
      lastFetched: null,
    });
  });

  it('updatePlan updates the specified plan in store', () => {
    usePlanStore.getState().setPlans([mockPlan({ id: 'plan-1', name: 'Old Name' })]);

    const updatedDays = [mockPlanDay({ day_name: 'New Day' })];
    usePlanStore.getState().updatePlan('plan-1', {
      name: 'New Name',
      plan_days: updatedDays,
    });

    const state = usePlanStore.getState();
    expect(state.plans[0].name).toBe('New Name');
    expect(state.plans[0].plan_days[0].day_name).toBe('New Day');
  });
});
