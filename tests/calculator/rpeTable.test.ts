import { RPE_TABLE, getWeightForRpeAndReps } from '@/features/calculator/utils/rpeTable';

describe('RPE_TABLE', () => {
  it('RPE 10 at 1 rep equals 100%', () => {
    expect(RPE_TABLE[10][0]).toBe(100);
  });

  it('has entries for RPE 1 through 10 in 0.5 increments', () => {
    const expectedKeys = [10, 9.5, 9, 8.5, 8, 7.5, 7, 6.5, 6, 5.5, 5, 4.5, 4, 3.5, 3, 2.5, 2, 1.5, 1];
    for (const key of expectedKeys) {
      expect(RPE_TABLE[key]).toBeDefined();
    }
  });

  it('each RPE row has 12 rep entries', () => {
    for (const key of Object.keys(RPE_TABLE)) {
      expect(RPE_TABLE[Number(key)]).toHaveLength(12);
    }
  });

  it('percentages decrease as reps increase for same RPE', () => {
    const row = RPE_TABLE[10];
    for (let i = 1; i < row.length; i++) {
      expect(row[i]).toBeLessThan(row[i - 1]);
    }
  });
});

describe('getWeightForRpeAndReps', () => {
  it('returns 100 for e1RM 100, RPE 10, 1 rep', () => {
    expect(getWeightForRpeAndReps(100, 10, 1)).toBe(100);
  });

  it('returns 86.3 for e1RM 100, RPE 10, 5 reps', () => {
    expect(getWeightForRpeAndReps(100, 10, 5)).toBe(86.3);
  });

  it('returns 86.3 for e1RM 100, RPE 8, 3 reps', () => {
    expect(getWeightForRpeAndReps(100, 8, 3)).toBe(86.3);
  });

  it('supports half-step RPE (9.5 at 2 reps)', () => {
    expect(getWeightForRpeAndReps(100, 9.5, 2)).toBe(93.9);
  });

  it('returns valid weight for RPE 5 (now in extended table)', () => {
    expect(getWeightForRpeAndReps(100, 5, 1)).toBe(83.3);
  });

  it('returns 0 for RPE below 1 (RPE 0.5)', () => {
    expect(getWeightForRpeAndReps(100, 0.5, 1)).toBe(0);
  });

  it('returns 0 for reps > 12', () => {
    expect(getWeightForRpeAndReps(100, 10, 15)).toBe(0);
  });

  it('returns 0 for reps < 1', () => {
    expect(getWeightForRpeAndReps(100, 10, 0)).toBe(0);
  });
});
