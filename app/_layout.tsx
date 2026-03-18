import '../global.css';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import * as Notifications from 'expo-notifications';
import * as Updates from 'expo-updates';
import { createMMKV } from 'react-native-mmkv';
import { colors } from '@/constants/theme';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useAuthStore } from '@/stores/authStore';
import { ConnectivityBanner } from '@/components/layout/ConnectivityBanner';
import { WhatsNewModal } from '@/components/WhatsNewModal';
import { WHATS_NEW } from '@/config/whatsNew';
import { setupAlarmChannel, registerAlarmCategory } from '@/features/alarms/utils/notificationSetup';
import { SNOOZE_MINUTES } from '@/features/alarms/constants';
import { getDeepLinkRoute } from '@/features/notifications/utils/deepLinkRouter';
import type { NotificationData } from '@/features/notifications/types';

const mmkv = createMMKV();
const WHATS_NEW_KEY = 'whats_new_last_seen_id';

// Configure foreground notification presentation
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {

  const { isAuthenticated, isLoading } = useAuth();
  const hasCompletedOnboarding = useAuthStore((s) => s.hasCompletedOnboarding);
  const segments = useSegments();
  const router = useRouter();
  const [showWhatsNew, setShowWhatsNew] = useState(false);

  // OTA update check — fetch + delayed reload like Flick's App.js pattern.
  // Delay gives Expo Router time to finish mounting before reloadAsync().
  useEffect(() => {
    if (__DEV__) return;
    Updates.checkForUpdateAsync()
      .then((update) => {
        if (update.isAvailable) {
          return Updates.fetchUpdateAsync();
        }
      })
      .then((result) => {
        if (result?.isNew) {
          setTimeout(() => {
            Updates.reloadAsync().catch(() => {});
          }, 3000);
        }
      })
      .catch((err) => console.warn('OTA update check failed:', err));
  }, []);

  // Show "What's New" modal after an OTA update is applied
  useEffect(() => {
    if (__DEV__ || isLoading) return;
    const updateId = Updates.updateId;
    if (!updateId) return;

    const lastSeenId = mmkv.getString(WHATS_NEW_KEY);
    if (!lastSeenId) {
      mmkv.set(WHATS_NEW_KEY, updateId);
      return;
    }
    if (lastSeenId === updateId) return;
    if (WHATS_NEW.items.length === 0) {
      mmkv.set(WHATS_NEW_KEY, updateId);
      return;
    }
    setShowWhatsNew(true);
  }, [isLoading]);

  const handleDismissWhatsNew = () => {
    setShowWhatsNew(false);
    const updateId = Updates.updateId;
    if (updateId) {
      mmkv.set(WHATS_NEW_KEY, updateId);
    }
  };

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
        } else if (actionId === Notifications.DEFAULT_ACTION_IDENTIFIER) {
          const data = response.notification.request.content.data as unknown as NotificationData;
          const route = getDeepLinkRoute(data);
          if (route) {
            router.push(route as any);
          }
        }
      }
    );

    return () => subscription.remove();
  }, [router]);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
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
        <WhatsNewModal
          visible={showWhatsNew}
          title={WHATS_NEW.title}
          items={WHATS_NEW.items}
          onDismiss={handleDismissWhatsNew}
        />
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
