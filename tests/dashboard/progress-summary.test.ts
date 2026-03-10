import { calculateWeeklyStreak } from '@/features/dashboard/hooks/useProgressSummary';

describe('calculateWeeklyStreak', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    // Set to Wednesday March 11, 2026
    jest.setSystemTime(new Date('2026-03-11T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns 0 for empty sessions', () => {
    expect(calculateWeeklyStreak([])).toBe(0);
  });

  it('returns 3 for 3 consecutive weeks of sessions', () => {
    const sessions = [
      { ended_at: '2026-03-10T18:00:00Z' }, // Current week (week of Mar 8)
      { ended_at: '2026-03-03T18:00:00Z' }, // Previous week (week of Mar 1)
      { ended_at: '2026-02-24T18:00:00Z' }, // Two weeks ago (week of Feb 22)
    ];
    expect(calculateWeeklyStreak(sessions)).toBe(3);
  });

  it('returns streak up to gap week', () => {
    const sessions = [
      { ended_at: '2026-03-10T18:00:00Z' }, // Current week
      { ended_at: '2026-03-03T18:00:00Z' }, // Previous week
      // Gap - no workout week of Feb 22
      { ended_at: '2026-02-17T18:00:00Z' }, // Three weeks ago
    ];
    expect(calculateWeeklyStreak(sessions)).toBe(2);
  });

  it('counts current week without workout (user may work out later)', () => {
    // No workout this week, but had consecutive weeks before
    const sessions = [
      { ended_at: '2026-03-06T18:00:00Z' }, // Last week (week of Mar 1)
      { ended_at: '2026-02-27T18:00:00Z' }, // Two weeks ago
    ];
    // Current week is still in progress, so it should count previous consecutive weeks
    expect(calculateWeeklyStreak(sessions)).toBe(2);
  });

  it('handles multiple sessions in same week (counts as one)', () => {
    const sessions = [
      { ended_at: '2026-03-10T18:00:00Z' }, // Current week - session 1
      { ended_at: '2026-03-09T18:00:00Z' }, // Current week - session 2
      { ended_at: '2026-03-08T18:00:00Z' }, // Current week - session 3
      { ended_at: '2026-03-03T18:00:00Z' }, // Previous week
    ];
    expect(calculateWeeklyStreak(sessions)).toBe(2);
  });

  it('returns 1 for workout only in current week', () => {
    const sessions = [
      { ended_at: '2026-03-10T18:00:00Z' }, // Current week only
    ];
    expect(calculateWeeklyStreak(sessions)).toBe(1);
  });
});
