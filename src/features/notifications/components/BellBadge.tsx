import { Pressable, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useNotificationStore } from '@/stores/notificationStore';
import { colors } from '@/constants/theme';

/**
 * Formats a numeric unread count for display in the badge.
 * Returns null if count is 0 (badge should be hidden).
 * Returns '9+' if count >= 10.
 * Returns the string count otherwise.
 */
export function formatBadgeCount(count: number): string | null {
  if (count <= 0) return null;
  if (count >= 10) return '9+';
  return String(count);
}

/**
 * Bell icon button with an unread notification count badge.
 * Navigates to the notifications inbox on press.
 */
export function BellBadge() {
  const router = useRouter();
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const badgeLabel = formatBadgeCount(unreadCount);

  return (
    <Pressable
      onPress={() => router.push('/(app)/notifications')}
      hitSlop={8}
      style={({ pressed }) => [styles.container, pressed && { opacity: 0.7 }]}
      accessibilityLabel={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
      accessibilityRole="button"
    >
      <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
      {badgeLabel !== null && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badgeLabel}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    padding: 4,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.accent,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
  },
});
