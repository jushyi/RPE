import '../global.css';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import * as Notifications from 'expo-notifications';
import { colors } from '@/constants/theme';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useAuthStore } from '@/stores/authStore';
import { ConnectivityBanner } from '@/components/layout/ConnectivityBanner';
import { setupAlarmChannel, registerAlarmCategory } from '@/features/alarms/utils/notificationSetup';
import { SNOOZE_MINUTES } from '@/features/alarms/constants';

export default function RootLayout() {

  const { isAuthenticated, isLoading } = useAuth();
  const hasCompletedOnboarding = useAuthStore((s) => s.hasCompletedOnboarding);
  const segments = useSegments();
  const router = useRouter();

  // Set up notification channels, categories, and snooze handler on mount
  useEffect(() => {
    setupAlarmChannel().catch((err) =>
      console.warn('Failed to setup alarm channel:', err)
    );
    registerAlarmCategory().catch((err) =>
      console.warn('Failed to register alarm category:', err)
    );

    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const actionId = response.actionIdentifier;
        if (actionId === 'SNOOZE') {
          const content = response.notification.request.content;
          Notifications.scheduleNotificationAsync({
            content: {
              title: content.title ?? 'Wake-up alarm',
              body: content.body ?? 'Snoozed alarm',
              sound: true,
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
              seconds: SNOOZE_MINUTES * 60,
              repeats: false,
            },
          }).catch((err) => console.warn('Failed to schedule snooze:', err));
        }
        // DISMISS action needs no handling
      }
    );

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      // After email confirmation, route to onboarding or dashboard
      if (!hasCompletedOnboarding) {
        router.replace('/(app)/onboarding' as any);
      } else {
        router.replace('/(app)/(tabs)/dashboard');
      }
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={colors.accent} />
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <BottomSheetModalProvider>
        <StatusBar style="light" />
        <ConnectivityBanner />
        <Slot />
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
