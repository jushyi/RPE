import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useNotificationStore } from '@/stores/notificationStore';

/**
 * Hook that refreshes the unread notification count on mount and
 * whenever the app returns to the foreground.
 * Returns the current unreadCount from the store.
 */
export function useUnreadCount(): number {
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const refreshUnreadCount = useNotificationStore((s) => s.refreshUnreadCount);

  useEffect(() => {
    // Refresh on mount
    refreshUnreadCount();

    // Refresh whenever app comes to foreground
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        refreshUnreadCount();
      }
    });

    return () => subscription.remove();
  }, [refreshUnreadCount]);

  return unreadCount;
}
