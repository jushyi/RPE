import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { NotificationInbox } from '@/features/notifications/components/NotificationInbox';
import { colors } from '@/constants/theme';

/**
 * Full-screen notification inbox route.
 * Registered as a Stack screen in app/(app)/_layout.tsx.
 */
export default function NotificationsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.navBar}>
        <Pressable onPress={() => router.back()} style={styles.navButton}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.navTitle}>
          <Text style={styles.navTitleText}>Notifications</Text>
        </View>
        <View style={styles.navButton} />
      </View>
      <View style={styles.container}>
        <NotificationInbox />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  navButton: {
    padding: 8,
    width: 40,
  },
  navTitle: {
    flex: 1,
    alignItems: 'center',
  },
  navTitleText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
