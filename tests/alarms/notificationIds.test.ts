import { alarmNotificationId, nudgeNotificationId } from '@/features/alarms/utils/notificationIds';

describe('notificationIds', () => {
  describe('alarmNotificationId', () => {
    it('returns alarm_ prefixed ID', () => {
      expect(alarmNotificationId('abc-123')).toBe('alarm_abc-123');
    });

    it('handles UUID-style IDs', () => {
      expect(alarmNotificationId('550e8400-e29b-41d4-a716-446655440000'))
        .toBe('alarm_550e8400-e29b-41d4-a716-446655440000');
    });
  });

  describe('nudgeNotificationId', () => {
    it('returns nudge_ prefixed ID', () => {
      expect(nudgeNotificationId('abc-123')).toBe('nudge_abc-123');
    });

    it('handles UUID-style IDs', () => {
      expect(nudgeNotificationId('550e8400-e29b-41d4-a716-446655440000'))
        .toBe('nudge_550e8400-e29b-41d4-a716-446655440000');
    });
  });
});
