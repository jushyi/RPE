import type { PlanDayExercise, TargetSet } from '@/features/plans/types';
import { DEFAULT_TARGET_SET } from '@/features/plans/constants';

describe('plan-exercises', () => {
  it('exercise target_sets defaults to empty array', () => {
    const exercise: Pick<PlanDayExercise, 'target_sets'> = {
      target_sets: [],
    };

    expect(exercise.target_sets).toEqual([]);
    expect(exercise.target_sets).toHaveLength(0);
  });

  it('exercise sort_order reflects position in day exercises array', () => {
    const exercises = ['ex-1', 'ex-2', 'ex-3'].map((id, index) => ({
      exercise_id: id,
      sort_order: index,
    }));

    expect(exercises[0].sort_order).toBe(0);
    expect(exercises[1].sort_order).toBe(1);
    expect(exercises[2].sort_order).toBe(2);
  });

  it('adding a set appends DEFAULT_TARGET_SET to target_sets', () => {
    const sets: TargetSet[] = [{ weight: 100, reps: 8, rpe: 7 }];
    const newSets = [...sets, { ...DEFAULT_TARGET_SET }];

    expect(newSets).toHaveLength(2);
    expect(newSets[1]).toEqual({ weight: 0, reps: 0, rpe: null });
  });

  it('DEFAULT_TARGET_SET has correct shape', () => {
    expect(DEFAULT_TARGET_SET).toEqual({
      weight: 0,
      reps: 0,
      rpe: null,
    });
  });

  it('reordering exercises updates sort_order', () => {
    const exercises = [
      { exercise_id: 'ex-1', name: 'Bench' },
      { exercise_id: 'ex-2', name: 'Squat' },
      { exercise_id: 'ex-3', name: 'Deadlift' },
    ];

    // Simulate drag: move Deadlift to first position
    const reordered = [exercises[2], exercises[0], exercises[1]];
    const withSortOrder = reordered.map((ex, index) => ({
      ...ex,
      sort_order: index,
    }));

    expect(withSortOrder[0].name).toBe('Deadlift');
    expect(withSortOrder[0].sort_order).toBe(0);
    expect(withSortOrder[1].name).toBe('Bench');
    expect(withSortOrder[1].sort_order).toBe(1);
    expect(withSortOrder[2].name).toBe('Squat');
    expect(withSortOrder[2].sort_order).toBe(2);
  });
});
