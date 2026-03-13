import { useEffect, useCallback } from 'react';
import { FlatList, View, Text, Pressable, ActivityIndicator, StyleSheet, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useNotificationStore } from '@/stores/notificationStore';
import { getDeepLinkRoute } from '../utils/deepLinkRouter';
import { NotificationItem } from './NotificationItem';
import { EmptyInbox } from './EmptyInbox';
import type { NotificationRecord } from '../types';
import { colors } from '@/constants/theme';

/**
 * Full notification inbox with pull-to-refresh, mark all read, and deep link routing.
 */
export function NotificationInbox() {
  const router = useRouter();
  const notifications = useNotificationStore((s) => s.notifications);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const isLoading = useNotificationStore((s) => s.isLoading);
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleItemPress = useCallback((notification: NotificationRecord) => {
    markAsRead(notification.id);
    const route = getDeepLinkRoute(notification.data);
    if (route) {
      router.push(route as any);
    }
  }, [markAsRead, router]);

  const handleRefresh = useCallback(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const renderHeader = () => {
    if (unreadCount === 0) return null;
    return (
      <View style={styles.headerRow}>
        <Pressable
          onPress={markAllRead}
          style={({ pressed }) => [styles.markAllButton, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
          accessibilityLabel="Mark all notifications as read"
        >
          <Text style={styles.markAllText}>Mark all read</Text>
        </Pressable>
      </View>
    );
  };

  if (isLoading && notifications.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <FlatList
      data={notifications}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <NotificationItem notification={item} onPress={handleItemPress} />
      )}
      ListHeaderComponent={renderHeader}
      ListEmptyComponent={<EmptyInbox />}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={handleRefresh}
          tintColor={colors.textMuted}
          colors={[colors.accent]}
        />
      }
      contentContainerStyle={notifications.length === 0 ? styles.emptyContent : undefined}
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.surfaceElevated,
  },
  markAllButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  markAllText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContent: {
    flex: 1,
  },
});
