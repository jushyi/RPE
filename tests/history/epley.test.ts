import { calculateEpley1RM, bestSessionE1RM } from '@/features/history/utils/epley';

describe('calculateEpley1RM', () => {
  it('calculates 1RM for normal sets (100kg x 5 = 116.7)', () => {
    expect(calculateEpley1RM(100, 5)).toBe(116.7);
  });

  it('returns weight directly for 1-rep sets', () => {
    expect(calculateEpley1RM(100, 1)).toBe(100);
  });

  it('returns 0 for zero weight', () => {
    expect(calculateEpley1RM(0, 5)).toBe(0);
  });

  it('returns 0 for zero reps', () => {
    expect(calculateEpley1RM(100, 0)).toBe(0);
  });

  it('returns 0 for negative reps', () => {
    expect(calculateEpley1RM(100, -1)).toBe(0);
  });

  it('returns 0 for negative weight', () => {
    expect(calculateEpley1RM(-50, 5)).toBe(0);
  });

  it('handles high rep ranges', () => {
    // 60 * (1 + 10/30) = 60 * 1.333... = 80.0
    expect(calculateEpley1RM(60, 10)).toBe(80);
  });

  it('rounds to 1 decimal place', () => {
    // 75 * (1 + 8/30) = 75 * 1.2666... = 95.0
    expect(calculateEpley1RM(75, 8)).toBe(95);
  });
});

describe('bestSessionE1RM', () => {
  it('returns the max 1RM across sets', () => {
    const sets = [
      { weight: 100, reps: 5 },  // 116.7
      { weight: 80, reps: 10 },  // 106.7
    ];
    expect(bestSessionE1RM(sets)).toBe(116.7);
  });

  it('returns 0 for empty sets', () => {
    expect(bestSessionE1RM([])).toBe(0);
  });

  it('handles single set', () => {
    expect(bestSessionE1RM([{ weight: 100, reps: 1 }])).toBe(100);
  });

  it('handles all invalid sets', () => {
    const sets = [
      { weight: 0, reps: 5 },
      { weight: 100, reps: 0 },
    ];
    expect(bestSessionE1RM(sets)).toBe(0);
  });
});
