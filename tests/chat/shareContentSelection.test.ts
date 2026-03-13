import { buildSharePayload } from '@/features/social/utils/shareContentSelection';
import type { ShareableContent } from '@/features/social/types/chat';

describe('buildSharePayload', () => {
  it('includes workoutSummary flag when selected', () => {
    const content: ShareableContent = {
      workoutSummary: true,
      selectedPRs: [],
      selectedVideos: [],
    };
    const result = buildSharePayload(content);
    expect(result.workoutSummary).toBe(true);
  });

  it('excludes workoutSummary when not selected', () => {
    const content: ShareableContent = {
      workoutSummary: false,
      selectedPRs: ['pr-1'],
      selectedVideos: [],
    };
    const result = buildSharePayload(content);
    expect(result.workoutSummary).toBe(false);
  });

  it('includes selected PR IDs', () => {
    const content: ShareableContent = {
      workoutSummary: true,
      selectedPRs: ['exercise-1', 'exercise-2'],
      selectedVideos: [],
    };
    const result = buildSharePayload(content);
    expect(result.selectedPRs).toEqual(['exercise-1', 'exercise-2']);
  });

  it('includes selected video set log IDs', () => {
    const content: ShareableContent = {
      workoutSummary: false,
      selectedPRs: [],
      selectedVideos: ['set-log-1', 'set-log-3'],
    };
    const result = buildSharePayload(content);
    expect(result.selectedVideos).toEqual(['set-log-1', 'set-log-3']);
  });

  it('returns empty arrays when nothing selected', () => {
    const content: ShareableContent = {
      workoutSummary: false,
      selectedPRs: [],
      selectedVideos: [],
    };
    const result = buildSharePayload(content);
    expect(result.selectedPRs).toEqual([]);
    expect(result.selectedVideos).toEqual([]);
  });

  it('preserves all three fields in the returned payload', () => {
    const content: ShareableContent = {
      workoutSummary: true,
      selectedPRs: ['pr-a'],
      selectedVideos: ['vid-b'],
    };
    const result = buildSharePayload(content);
    expect(result).toEqual({
      workoutSummary: true,
      selectedPRs: ['pr-a'],
      selectedVideos: ['vid-b'],
    });
  });
});
