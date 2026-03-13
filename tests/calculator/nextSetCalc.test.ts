import { calculateNextSet, roundToLoadable } from '@/features/calculator/utils/nextSetCalc';

describe('roundToLoadable', () => {
  it('rounds to nearest 5 lb in lbs mode', () => {
    expect(roundToLoadable(182.3, 'lbs')).toBe(180);
    expect(roundToLoadable(183, 'lbs')).toBe(185);
    expect(roundToLoadable(187.5, 'lbs')).toBe(190);
  });

  it('rounds to nearest 2.5 kg in kg mode', () => {
    expect(roundToLoadable(182.3, 'kg')).toBe(182.5);
    expect(roundToLoadable(81.2, 'kg')).toBe(80);
    expect(roundToLoadable(83.8, 'kg')).toBe(85);
  });
});

describe('calculateNextSet', () => {
  it('returns same weight when RPE and reps are unchanged', () => {
    const result = calculateNextSet({
      lastWeight: 225,
      lastReps: 5,
      lastRpe: 8,
      targetRpe: 8,
      targetReps: 5,
      unit: 'lbs',
    });
    expect(result.recommendedWeight).toBe(225);
    expect(result.percentChange).toBe(0);
  });

  it('recommends lower weight when target RPE is lower', () => {
    const result = calculateNextSet({
      lastWeight: 225,
      lastReps: 5,
      lastRpe: 9,
      targetRpe: 7,
      targetReps: 5,
      unit: 'lbs',
    });
    expect(result.recommendedWeight).toBeLessThan(225);
  });

  it('recommends lower weight when target reps is higher', () => {
    const result = calculateNextSet({
      lastWeight: 225,
      lastReps: 3,
      lastRpe: 8,
      targetRpe: 8,
      targetReps: 8,
      unit: 'lbs',
    });
    expect(result.recommendedWeight).toBeLessThan(225);
  });

  it('rounds to nearest 5 lb in lbs mode', () => {
    const result = calculateNextSet({
      lastWeight: 225,
      lastReps: 5,
      lastRpe: 8,
      targetRpe: 7,
      targetReps: 5,
      unit: 'lbs',
    });
    expect(result.recommendedWeight % 5).toBe(0);
  });

  it('rounds to nearest 2.5 kg in kg mode', () => {
    const result = calculateNextSet({
      lastWeight: 100,
      lastReps: 5,
      lastRpe: 8,
      targetRpe: 7,
      targetReps: 5,
      unit: 'kg',
    });
    expect(result.recommendedWeight % 2.5).toBe(0);
  });

  it('provides explanation string with e1RM and percentage', () => {
    const result = calculateNextSet({
      lastWeight: 225,
      lastReps: 5,
      lastRpe: 8,
      targetRpe: 8,
      targetReps: 5,
      unit: 'lbs',
    });
    expect(result.explanation).toContain('e1RM');
    expect(result.explanation).toContain('lbs');
    expect(result.explanation).toContain('RPE');
  });

  it('handles RPE below valid range gracefully', () => {
    const result = calculateNextSet({
      lastWeight: 225,
      lastReps: 5,
      lastRpe: 0.5, // below valid range
      targetRpe: 8,
      targetReps: 5,
      unit: 'lbs',
    });
    expect(result.recommendedWeight).toBe(225);
    expect(result.percentChange).toBe(0);
  });

  it('works with low RPE values (RPE 3)', () => {
    const result = calculateNextSet({
      lastWeight: 135,
      lastReps: 5,
      lastRpe: 3,
      targetRpe: 8,
      targetReps: 5,
      unit: 'lbs',
    });
    expect(result.recommendedWeight).toBeGreaterThan(135);
  });
});
