import { buildRetroactiveSharePayload } from '@/features/social/utils/shareContentSelection';
import type { ShareableContent } from '@/features/social/types/chat';

describe('buildRetroactiveSharePayload', () => {
  const content: ShareableContent = {
    workoutSummary: true,
    selectedPRs: ['exercise-bench'],
    selectedVideos: ['set-log-5'],
  };

  it('includes workout_date field from the original session', () => {
    const result = buildRetroactiveSharePayload(content, '2026-03-01');
    expect(result.workout_date).toBe('2026-03-01');
  });

  it('includes all ShareableContent fields alongside workout_date', () => {
    const result = buildRetroactiveSharePayload(content, '2026-02-14');
    expect(result.workoutSummary).toBe(true);
    expect(result.selectedPRs).toEqual(['exercise-bench']);
    expect(result.selectedVideos).toEqual(['set-log-5']);
  });

  it('has workout_date as a separate field from workoutSummary', () => {
    const result = buildRetroactiveSharePayload(content, '2026-03-01');
    // Both fields exist independently
    expect('workout_date' in result).toBe(true);
    expect('workoutSummary' in result).toBe(true);
  });

  it('preserves the exact workout_date string without modification', () => {
    const dateStr = '2025-12-25';
    const result = buildRetroactiveSharePayload(content, dateStr);
    expect(result.workout_date).toBe(dateStr);
  });
});
