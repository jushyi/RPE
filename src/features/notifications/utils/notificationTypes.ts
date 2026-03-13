import { colors } from '@/constants/theme';
import type { NotificationType } from '../types';

/**
 * Icon and color mapping for each notification type.
 * Uses Ionicons names for rendering in notification list items.
 */
export const NOTIFICATION_ICONS: Record<NotificationType, { name: string; color: string }> = {
  workout_complete: { name: 'checkmark-circle', color: colors.success },
  pr_achieved: { name: 'trophy', color: colors.warning },
  plan_update: { name: 'clipboard', color: colors.accent },
  weekly_summary: { name: 'bar-chart', color: colors.textSecondary },
  alarm: { name: 'alarm', color: colors.accentBright },
  nudge: { name: 'fitness', color: colors.warning },
};
