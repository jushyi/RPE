import { calculateTotalVolume, calculateDurationMinutes } from '@/features/history/utils/volumeCalc';

describe('calculateTotalVolume', () => {
  it('sums weight * reps across all exercises and sets', () => {
    const exercises = [
      {
        set_logs: [
          { weight: 100, reps: 5 },  // 500
          { weight: 100, reps: 5 },  // 500
        ],
      },
      {
        set_logs: [
          { weight: 60, reps: 10 },  // 600
        ],
      },
    ];
    expect(calculateTotalVolume(exercises)).toBe(1600);
  });

  it('returns 0 for empty exercises', () => {
    expect(calculateTotalVolume([])).toBe(0);
  });

  it('returns 0 for exercises with no sets', () => {
    const exercises = [{ set_logs: [] }];
    expect(calculateTotalVolume(exercises)).toBe(0);
  });

  it('handles zero weight or reps in individual sets', () => {
    const exercises = [
      {
        set_logs: [
          { weight: 0, reps: 10 },   // 0
          { weight: 50, reps: 0 },   // 0
          { weight: 50, reps: 8 },   // 400
        ],
      },
    ];
    expect(calculateTotalVolume(exercises)).toBe(400);
  });
});

describe('calculateDurationMinutes', () => {
  it('returns minutes between start and end timestamps', () => {
    const start = '2026-03-09T10:00:00Z';
    const end = '2026-03-09T11:30:00Z';
    expect(calculateDurationMinutes(start, end)).toBe(90);
  });

  it('returns null when endedAt is null', () => {
    expect(calculateDurationMinutes('2026-03-09T10:00:00Z', null)).toBeNull();
  });

  it('rounds to nearest minute', () => {
    const start = '2026-03-09T10:00:00Z';
    const end = '2026-03-09T10:45:30Z';  // 45.5 minutes -> 46
    expect(calculateDurationMinutes(start, end)).toBe(46);
  });

  it('handles same start and end time', () => {
    const time = '2026-03-09T10:00:00Z';
    expect(calculateDurationMinutes(time, time)).toBe(0);
  });
});
