import type { NotificationData } from '../types';

/**
 * Maps a notification's data payload to an Expo Router path.
 * Returns null if the notification has no meaningful deep link target
 * or is missing required identifiers.
 */
export function getDeepLinkRoute(data: NotificationData): string | null {
  switch (data.type) {
    case 'workout_complete':
      return data.session_id ? `/(app)/history/${data.session_id}` : null;
    case 'pr_achieved':
      return data.exercise_id ? `/(app)/progress/${data.exercise_id}` : null;
    case 'plan_update':
      return data.plan_id ? `/(app)/plans/${data.plan_id}` : null;
    case 'alarm':
    case 'nudge':
      return '/(app)/workout';
    case 'weekly_summary':
    default:
      return null;
  }
}
