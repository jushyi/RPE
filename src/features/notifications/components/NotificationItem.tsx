import { Pressable, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NotificationRecord } from '../types';
import { NOTIFICATION_ICONS } from '../utils/notificationTypes';
import { relativeTime } from '../utils/relativeTime';
import { colors } from '@/constants/theme';

interface NotificationItemProps {
  notification: NotificationRecord;
  onPress: (notification: NotificationRecord) => void;
}

/**
 * Single row in the notification inbox.
 * Shows an unread indicator dot, type icon, title/body, timestamp, and chevron.
 */
export function NotificationItem({ notification, onPress }: NotificationItemProps) {
  const { name: iconName, color: iconColor } = NOTIFICATION_ICONS[notification.type] ?? {
    name: 'notifications-outline',
    color: colors.textSecondary,
  };

  const isUnread = !notification.read;

  return (
    <Pressable
      onPress={() => onPress(notification)}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.75 }]}
      accessibilityRole="button"
    >
      {/* Unread dot */}
      <View style={styles.dotContainer}>
        {isUnread && <View style={styles.unreadDot} />}
      </View>

      {/* Type icon */}
      <View style={styles.iconContainer}>
        <Ionicons name={iconName as any} size={20} color={iconColor} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text
          style={[styles.title, isUnread ? styles.titleUnread : styles.titleRead]}
          numberOfLines={1}
        >
          {notification.title}
        </Text>
        <Text style={styles.body} numberOfLines={2}>
          {notification.body}
        </Text>
        <Text style={styles.timestamp}>{relativeTime(notification.created_at)}</Text>
      </View>

      {/* Chevron */}
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.surfaceElevated,
  },
  dotContainer: {
    width: 12,
    alignItems: 'center',
    marginRight: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  iconContainer: {
    width: 32,
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 15,
    marginBottom: 2,
    color: colors.textPrimary,
  },
  titleUnread: {
    fontWeight: '600',
  },
  titleRead: {
    fontWeight: '400',
    color: colors.textSecondary,
  },
  body: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 11,
    color: colors.textMuted,
  },
});
