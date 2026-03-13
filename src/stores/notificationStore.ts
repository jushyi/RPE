import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';
import type { NotificationRecord } from '@/features/notifications/types';
import { supabase } from '@/lib/supabase/client';
import * as Notifications from 'expo-notifications';

// Named MMKV instance for notification persistence
const storage = createMMKV({ id: 'notification-storage' });

const mmkvStorage = {
  getItem: (name: string) => storage.getString(name) ?? null,
  setItem: (name: string, value: string) => storage.set(name, value),
  removeItem: (name: string) => {
    storage.remove(name);
  },
};

interface NotificationState {
  notifications: NotificationRecord[];
  unreadCount: number;
  isLoading: boolean;
  lastFetched: number | null;
}

interface NotificationActions {
  fetchNotifications: () => Promise<void>;
  refreshUnreadCount: () => void;
  markAsRead: (id: string) => void;
  markAllRead: () => void;
  addLocalNotification: (record: Omit<NotificationRecord, 'id' | 'created_at'>) => void;
}

/**
 * Generate a simple UUID v4 for local notification records.
 */
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const useNotificationStore = create<NotificationState & NotificationActions>()(
  persist(
    (set, get) => ({
      // State
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      lastFetched: null,

      // Actions
      fetchNotifications: async () => {
        set({ isLoading: true });
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user) {
            set({ isLoading: false });
            return;
          }

          const userId = session.user.id;

          // Prune records older than 30 days
          const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
          await (supabase as any).from('notifications')
            .delete()
            .eq('user_id', userId)
            .lt('created_at', thirtyDaysAgo);

          // Fetch user's notifications (newest first, limit 50)
          const { data, error } = await (supabase as any)
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(50);

          if (error) {
            console.warn('Failed to fetch notifications:', error.message);
            set({ isLoading: false });
            return;
          }

          const notifications = (data ?? []) as NotificationRecord[];
          const unreadCount = notifications.filter((n) => !n.read).length;

          set({
            notifications,
            unreadCount,
            isLoading: false,
            lastFetched: Date.now(),
          });
        } catch (err) {
          console.warn('Failed to fetch notifications:', err);
          set({ isLoading: false });
        }
      },

      refreshUnreadCount: () => {
        const { notifications } = get();
        const unreadCount = notifications.filter((n) => !n.read).length;
        set({ unreadCount });
      },

      markAsRead: (id: string) => {
        const { notifications, unreadCount } = get();
        const target = notifications.find((n) => n.id === id);
        if (!target) return;

        const wasUnread = !target.read;
        set({
          notifications: notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
          unreadCount: wasUnread ? Math.max(0, unreadCount - 1) : unreadCount,
        });

        // Fire-and-forget Supabase update
        void (async () => {
          try {
            await (supabase as any)
              .from('notifications')
              .update({ read: true })
              .eq('id', id);
          } catch (err) {
            console.warn('Failed to mark notification as read:', err);
          }
        })();
      },

      markAllRead: () => {
        const { notifications } = get();

        set({
          notifications: notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        });

        // Clear OS badge count
        Notifications.setBadgeCountAsync(0).catch(() => {});

        // Fire-and-forget Supabase update: set read=true for all unread
        void (async () => {
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return;
            await (supabase as any)
              .from('notifications')
              .update({ read: true })
              .eq('user_id', session.user.id)
              .eq('read', false);
          } catch (err) {
            console.warn('Failed to mark all notifications as read:', err);
          }
        })();
      },

      addLocalNotification: (record) => {
        const newRecord: NotificationRecord = {
          ...record,
          id: generateId(),
          created_at: new Date().toISOString(),
        };

        const { notifications, unreadCount } = get();

        set({
          notifications: [newRecord, ...notifications],
          unreadCount: record.read ? unreadCount : unreadCount + 1,
        });

        // Fire-and-forget: persist to Supabase
        void (async () => {
          try {
            await (supabase as any)
              .from('notifications')
              .insert({
                user_id: record.user_id,
                type: record.type,
                title: record.title,
                body: record.body,
                data: record.data,
                read: record.read,
              });
          } catch (err) {
            console.warn('Failed to persist local notification:', err);
          }
        })();
      },
    }),
    {
      name: 'notification-storage',
      version: 1,
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
