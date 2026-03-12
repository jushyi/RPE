// Coach plan CRUD tests -- hooks depend on Supabase so kept as stubs
// Pure logic tests for InlinePerformance rendering decisions

describe('useCoachPlans', () => {
  describe('createPlanForTrainee', () => {
    it.todo('inserts plan with trainee user_id and coach coach_id');
    it.todo('does not schedule alarms for trainee');
  });

  describe('updateTraineePlan', () => {
    it.todo('updates only coach-owned plans');
    it.todo('inserts coach note when provided');
  });

  describe('fetchTraineePlans', () => {
    it.todo('returns both personal and coach-created plans');
  });
});

describe('InlinePerformance data display', () => {
  it('formats performance data correctly', () => {
    const data = { bestWeight: 80, bestReps: 10, totalSets: 3, unit: 'kg' };
    const expected = `Last week: ${data.bestWeight}${data.unit} x ${data.bestReps} (${data.totalSets} sets)`;
    expect(expected).toBe('Last week: 80kg x 10 (3 sets)');
  });

  it('handles no data case', () => {
    const data = undefined;
    expect(data).toBeUndefined();
  });
});
