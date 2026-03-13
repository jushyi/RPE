import { useNotificationStore } from '@/stores/notificationStore';
import type { NotificationRecord } from '@/features/notifications/types';

// Reset store between tests
beforeEach(() => {
  useNotificationStore.setState({
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    lastFetched: null,
  });
});

const mockNotification = (overrides: Partial<NotificationRecord> = {}): NotificationRecord => ({
  id: 'notif-1',
  user_id: 'user-1',
  type: 'workout_complete',
  title: 'Workout Complete',
  body: 'You finished your workout!',
  data: { type: 'workout_complete', session_id: 'session-1' },
  read: false,
  created_at: new Date().toISOString(),
  ...overrides,
});

describe('notificationStore', () => {
  describe('markAsRead', () => {
    it('sets notification.read to true for the given id', () => {
      const notif = mockNotification({ id: 'n1', read: false });
      useNotificationStore.setState({
        notifications: [notif],
        unreadCount: 1,
      });

      useNotificationStore.getState().markAsRead('n1');

      const state = useNotificationStore.getState();
      expect(state.notifications[0].read).toBe(true);
    });

    it('decrements unreadCount', () => {
      const notif = mockNotification({ id: 'n1', read: false });
      useNotificationStore.setState({
        notifications: [notif],
        unreadCount: 1,
      });

      useNotificationStore.getState().markAsRead('n1');

      expect(useNotificationStore.getState().unreadCount).toBe(0);
    });

    it('does not decrement below 0', () => {
      const notif = mockNotification({ id: 'n1', read: true });
      useNotificationStore.setState({
        notifications: [notif],
        unreadCount: 0,
      });

      useNotificationStore.getState().markAsRead('n1');

      expect(useNotificationStore.getState().unreadCount).toBe(0);
    });
  });

  describe('markAllRead', () => {
    it('sets all notifications to read=true', () => {
      const notifs = [
        mockNotification({ id: 'n1', read: false }),
        mockNotification({ id: 'n2', read: false }),
        mockNotification({ id: 'n3', read: true }),
      ];
      useNotificationStore.setState({
        notifications: notifs,
        unreadCount: 2,
      });

      useNotificationStore.getState().markAllRead();

      const state = useNotificationStore.getState();
      expect(state.notifications.every((n) => n.read === true)).toBe(true);
    });

    it('sets unreadCount to 0', () => {
      const notifs = [
        mockNotification({ id: 'n1', read: false }),
        mockNotification({ id: 'n2', read: false }),
      ];
      useNotificationStore.setState({
        notifications: notifs,
        unreadCount: 2,
      });

      useNotificationStore.getState().markAllRead();

      expect(useNotificationStore.getState().unreadCount).toBe(0);
    });
  });

  describe('refreshUnreadCount', () => {
    it('counts notifications where read=false and updates unreadCount', () => {
      const notifs = [
        mockNotification({ id: 'n1', read: false }),
        mockNotification({ id: 'n2', read: true }),
        mockNotification({ id: 'n3', read: false }),
      ];
      useNotificationStore.setState({
        notifications: notifs,
        unreadCount: 0,
      });

      useNotificationStore.getState().refreshUnreadCount();

      expect(useNotificationStore.getState().unreadCount).toBe(2);
    });
  });

  describe('addLocalNotification', () => {
    it('adds a notification record to the local notifications array', () => {
      useNotificationStore.setState({ notifications: [], unreadCount: 0 });

      useNotificationStore.getState().addLocalNotification({
        user_id: 'user-1',
        type: 'alarm',
        title: 'Workout Alarm',
        body: 'Time to work out!',
        data: { type: 'alarm' },
        read: false,
      });

      const state = useNotificationStore.getState();
      expect(state.notifications).toHaveLength(1);
      expect(state.notifications[0].type).toBe('alarm');
      expect(state.notifications[0].id).toBeDefined();
      expect(state.notifications[0].created_at).toBeDefined();
    });

    it('increments unreadCount when adding unread notification', () => {
      useNotificationStore.setState({ notifications: [], unreadCount: 0 });

      useNotificationStore.getState().addLocalNotification({
        user_id: 'user-1',
        type: 'nudge',
        title: 'Missed Workout',
        body: 'You missed your workout today',
        data: { type: 'nudge' },
        read: false,
      });

      expect(useNotificationStore.getState().unreadCount).toBe(1);
    });
  });
});
