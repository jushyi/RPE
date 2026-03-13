import { usePlanStore } from '@/stores/planStore';
import type { Plan } from '@/features/plans/types';

const mockPlan = (overrides: Partial<Plan> = {}): Plan => ({
  id: 'plan-1',
  user_id: 'user-1',
  name: 'Push Pull Legs',
  is_active: false,
  coach_id: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  plan_days: [],
  ...overrides,
});

describe('planStore', () => {
  beforeEach(() => {
    usePlanStore.setState({
      plans: [],
      isLoading: false,
      lastFetched: null,
    });
  });

  it('starts with empty plans array and isLoading false', () => {
    const state = usePlanStore.getState();
    expect(state.plans).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.lastFetched).toBeNull();
  });

  it('setPlans replaces plans and sets lastFetched', () => {
    const plans = [mockPlan(), mockPlan({ id: 'plan-2', name: 'Upper Lower' })];
    usePlanStore.getState().setPlans(plans);

    const state = usePlanStore.getState();
    expect(state.plans).toHaveLength(2);
    expect(state.plans[0].name).toBe('Push Pull Legs');
    expect(state.plans[1].name).toBe('Upper Lower');
    expect(state.lastFetched).toBeGreaterThan(0);
  });

  it('addPlan appends a plan to the array', () => {
    usePlanStore.getState().setPlans([mockPlan()]);
    usePlanStore.getState().addPlan(mockPlan({ id: 'plan-2', name: 'Upper Lower' }));

    const state = usePlanStore.getState();
    expect(state.plans).toHaveLength(2);
    expect(state.plans[1].name).toBe('Upper Lower');
  });

  it('updatePlan updates fields on a specific plan by ID', () => {
    usePlanStore.getState().setPlans([
      mockPlan(),
      mockPlan({ id: 'plan-2', name: 'Upper Lower' }),
    ]);

    usePlanStore.getState().updatePlan('plan-1', { name: 'PPL Modified' });

    const state = usePlanStore.getState();
    expect(state.plans[0].name).toBe('PPL Modified');
    expect(state.plans[1].name).toBe('Upper Lower');
  });

  it('updatePlan does nothing for non-existent id', () => {
    usePlanStore.getState().setPlans([mockPlan()]);
    usePlanStore.getState().updatePlan('nonexistent', { name: 'Ghost' });

    const state = usePlanStore.getState();
    expect(state.plans).toHaveLength(1);
    expect(state.plans[0].name).toBe('Push Pull Legs');
  });

  it('removePlan removes a plan from the array by ID', () => {
    usePlanStore.getState().setPlans([
      mockPlan(),
      mockPlan({ id: 'plan-2', name: 'Upper Lower' }),
    ]);

    usePlanStore.getState().removePlan('plan-1');

    const state = usePlanStore.getState();
    expect(state.plans).toHaveLength(1);
    expect(state.plans[0].name).toBe('Upper Lower');
  });

  it('setActivePlan sets one plan active and all others inactive', () => {
    usePlanStore.getState().setPlans([
      mockPlan({ id: 'plan-1', is_active: true }),
      mockPlan({ id: 'plan-2', name: 'Upper Lower', is_active: false }),
      mockPlan({ id: 'plan-3', name: 'Full Body', is_active: false }),
    ]);

    usePlanStore.getState().setActivePlan('plan-2');

    const state = usePlanStore.getState();
    expect(state.plans[0].is_active).toBe(false);
    expect(state.plans[1].is_active).toBe(true);
    expect(state.plans[2].is_active).toBe(false);
  });

  it('setLoading updates isLoading flag', () => {
    usePlanStore.getState().setLoading(true);
    expect(usePlanStore.getState().isLoading).toBe(true);

    usePlanStore.getState().setLoading(false);
    expect(usePlanStore.getState().isLoading).toBe(false);
  });
});
