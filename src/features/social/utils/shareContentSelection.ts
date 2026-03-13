/**
 * Utility functions for building share payloads with per-content-type selection.
 *
 * These are pure functions used by SharePrompt and the retroactive share flow
 * to construct the payload that gets passed to socialStore.shareToGroups.
 */

import type { ShareableContent } from '@/features/social/types/chat';

/**
 * Builds a ShareableContent payload from the user's checkbox selections.
 * This is the payload shape used for real-time post-workout sharing.
 */
export function buildSharePayload(content: ShareableContent): ShareableContent {
  return {
    workoutSummary: content.workoutSummary,
    selectedPRs: content.selectedPRs,
    selectedVideos: content.selectedVideos,
  };
}

/**
 * Builds a retroactive share payload that includes the original workout date.
 *
 * Used when sharing a past workout from the History detail screen.
 * Feed cards will display "Workout from [workout_date]" alongside the share time.
 *
 * @param content - The content selection from the share prompt checkboxes
 * @param workoutDate - The original workout date (ISO date string, e.g. "2026-03-01")
 */
export function buildRetroactiveSharePayload(
  content: ShareableContent,
  workoutDate: string
): ShareableContent & { workout_date: string } {
  return {
    workoutSummary: content.workoutSummary,
    selectedPRs: content.selectedPRs,
    selectedVideos: content.selectedVideos,
    workout_date: workoutDate,
  };
}
