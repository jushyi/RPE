import { StyleSheet, View } from 'react-native';
import { NotificationInbox } from '@/features/notifications/components/NotificationInbox';
import { colors } from '@/constants/theme';

/**
 * Full-screen notification inbox route.
 * Registered as a Stack screen in app/(app)/_layout.tsx.
 */
export default function NotificationsScreen() {
  return (
    <View style={styles.container}>
      <NotificationInbox />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
