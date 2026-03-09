import {
  getPreviousPerformance,
  cachePreviousPerformance,
} from '@/features/workout/hooks/usePreviousPerformance';
import type { PreviousPerformance } from '@/features/workout/types';

describe('Previous Performance', () => {
  it('returns null when no previous session exists', () => {
    const result = getPreviousPerformance('non-existent-exercise');
    expect(result).toBeNull();
  });

  it('returns previous sets when cache hit', () => {
    const mockPerformance: PreviousPerformance = {
      exercise_id: 'ex-1',
      sets: [
        {
          id: 'set-1',
          set_number: 1,
          weight: 185,
          reps: 8,
          unit: 'lbs',
          is_pr: false,
          logged_at: '2026-03-08T10:00:00Z',
        },
        {
          id: 'set-2',
          set_number: 2,
          weight: 185,
          reps: 7,
          unit: 'lbs',
          is_pr: false,
          logged_at: '2026-03-08T10:05:00Z',
        },
      ],
      session_date: '2026-03-08',
    };

    cachePreviousPerformance('ex-1', mockPerformance);
    const result = getPreviousPerformance('ex-1');

    expect(result).not.toBeNull();
    expect(result!.exercise_id).toBe('ex-1');
    expect(result!.sets).toHaveLength(2);
    expect(result!.session_date).toBe('2026-03-08');
  });

  it('returns correct shape with exercise_id, sets array, and session_date', () => {
    const mockPerformance: PreviousPerformance = {
      exercise_id: 'ex-2',
      sets: [
        {
          id: 'set-3',
          set_number: 1,
          weight: 225,
          reps: 5,
          unit: 'lbs',
          is_pr: true,
          logged_at: '2026-03-07T09:00:00Z',
        },
      ],
      session_date: '2026-03-07',
    };

    cachePreviousPerformance('ex-2', mockPerformance);
    const result = getPreviousPerformance('ex-2');

    expect(result).toHaveProperty('exercise_id');
    expect(result).toHaveProperty('sets');
    expect(result).toHaveProperty('session_date');
    expect(Array.isArray(result!.sets)).toBe(true);
    expect(result!.sets[0]).toHaveProperty('weight');
    expect(result!.sets[0]).toHaveProperty('reps');
    expect(result!.sets[0]).toHaveProperty('unit');
  });
});
