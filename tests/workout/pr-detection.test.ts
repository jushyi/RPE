import { checkForPR } from '@/features/workout/hooks/usePRDetection';

interface PRBaseline {
  exercise_id: string;
  weight: number;
  unit: string;
}

describe('checkForPR', () => {
  it('returns isPR false for non-tracked exercise', () => {
    const baselines: PRBaseline[] = [];
    const result = checkForPR('ex-1', 200, baselines, false);
    expect(result.isPR).toBe(false);
    expect(result.previousBest).toBeNull();
  });

  it('returns isPR true for tracked exercise with no baseline (first-time)', () => {
    const baselines: PRBaseline[] = [];
    const result = checkForPR('ex-1', 200, baselines, true);
    expect(result.isPR).toBe(true);
    expect(result.previousBest).toBeNull();
  });

  it('returns isPR true when weight exceeds baseline', () => {
    const baselines: PRBaseline[] = [
      { exercise_id: 'ex-1', weight: 185, unit: 'lbs' },
    ];
    const result = checkForPR('ex-1', 200, baselines, true);
    expect(result.isPR).toBe(true);
    expect(result.previousBest).toBe(185);
  });

  it('returns isPR false when weight equals baseline', () => {
    const baselines: PRBaseline[] = [
      { exercise_id: 'ex-1', weight: 200, unit: 'lbs' },
    ];
    const result = checkForPR('ex-1', 200, baselines, true);
    expect(result.isPR).toBe(false);
    expect(result.previousBest).toBe(200);
  });

  it('returns isPR false when weight is below baseline', () => {
    const baselines: PRBaseline[] = [
      { exercise_id: 'ex-1', weight: 225, unit: 'lbs' },
    ];
    const result = checkForPR('ex-1', 200, baselines, true);
    expect(result.isPR).toBe(false);
    expect(result.previousBest).toBe(225);
  });

  it('handles session PR cache - second higher weight still detects PR', () => {
    const baselines: PRBaseline[] = [
      { exercise_id: 'ex-1', weight: 185, unit: 'lbs' },
    ];
    // First PR at 200
    const result1 = checkForPR('ex-1', 200, baselines, true);
    expect(result1.isPR).toBe(true);
    expect(result1.previousBest).toBe(185);

    // Second set at 210 - update baselines to simulate session cache
    const updatedBaselines: PRBaseline[] = [
      { exercise_id: 'ex-1', weight: 200, unit: 'lbs' },
    ];
    const result2 = checkForPR('ex-1', 210, updatedBaselines, true);
    expect(result2.isPR).toBe(true);
    expect(result2.previousBest).toBe(200);
  });
});
