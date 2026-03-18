import type { NotificationData } from '../types';

/**
 * Maps a notification's data payload to an Expo Router path.
 * Returns null if the notification has no meaningful deep link target
 * or is missing required identifiers.
 */
export function getDeepLinkRoute(data: NotificationData): string | null {
  switch (data.type) {
    case 'workout_complete':
      // Coach context: trainee_id present means this was sent to a coach — navigate to trainee's history
      if (data.trainee_id) {
        const name = data.trainee_name ? `&traineeName=${encodeURIComponent(data.trainee_name)}` : '';
        return `/(app)/plans/trainee-history?traineeId=${data.trainee_id}${name}`;
      }
      return data.session_id ? `/(app)/history/${data.session_id}` : null;
    case 'pr_achieved':
      // Coach context: trainee_id present means this was sent to a coach — navigate to trainee's history
      if (data.trainee_id) {
        const name = data.trainee_name ? `&traineeName=${encodeURIComponent(data.trainee_name)}` : '';
        return `/(app)/plans/trainee-history?traineeId=${data.trainee_id}${name}`;
      }
      // Trainee's own context: show their exercise progress chart
      return data.exercise_id ? `/(app)/progress/${data.exercise_id}` : null;
    case 'plan_update':
      return data.plan_id ? `/(app)/plans/${data.plan_id}` : null;
    case 'alarm':
    case 'nudge':
      return '/(app)/workout';
    case 'weekly_summary':
      return '/(app)/weekly-stats';
    default:
      return null;
  }
}
