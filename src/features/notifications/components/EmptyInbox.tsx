import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';

/**
 * Empty state displayed in the notification inbox when there are no notifications.
 */
export function EmptyInbox() {
  return (
    <View style={styles.container}>
      <Ionicons name="notifications-off-outline" size={48} color={colors.textMuted} />
      <Text style={styles.label}>No notifications yet</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 16,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 16,
  },
});
