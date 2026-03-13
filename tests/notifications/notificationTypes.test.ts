import { NOTIFICATION_ICONS } from '@/features/notifications/utils/notificationTypes';
import type { NotificationType } from '@/features/notifications/types';

describe('NOTIFICATION_ICONS', () => {
  const allTypes: NotificationType[] = [
    'workout_complete',
    'pr_achieved',
    'plan_update',
    'weekly_summary',
    'alarm',
    'nudge',
  ];

  it('has an entry for all 6 notification types', () => {
    for (const type of allTypes) {
      expect(NOTIFICATION_ICONS[type]).toBeDefined();
    }
  });

  it('each entry has a name and color string', () => {
    for (const type of allTypes) {
      const icon = NOTIFICATION_ICONS[type];
      expect(typeof icon.name).toBe('string');
      expect(typeof icon.color).toBe('string');
      expect(icon.name.length).toBeGreaterThan(0);
      expect(icon.color.length).toBeGreaterThan(0);
    }
  });

  it('maps workout_complete to checkmark-circle with success color', () => {
    expect(NOTIFICATION_ICONS.workout_complete.name).toBe('checkmark-circle');
  });

  it('maps pr_achieved to trophy', () => {
    expect(NOTIFICATION_ICONS.pr_achieved.name).toBe('trophy');
  });

  it('maps alarm to alarm', () => {
    expect(NOTIFICATION_ICONS.alarm.name).toBe('alarm');
  });
});
