import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import * as Updates from 'expo-updates';
import * as Notifications from 'expo-notifications';
import { colors } from '@/constants/theme';
import { HeaderCloudIcon } from '@/components/layout/HeaderCloudIcon';
import { useSyncQueue } from '@/features/workout/hooks/useSyncQueue';
import { usePushToken } from '@/features/notifications/hooks/usePushToken';
import { getDeepLinkRoute } from '@/features/notifications/utils/deepLinkRouter';
import type { NotificationData } from '@/features/notifications/types';
import { supabase } from '@/lib/supabase/client';

/**
 * App layout wrapping tabs and onboarding routes.
 * HeaderCloudIcon shows connection status in all screen headers.
 * useSyncQueue auto-flushes pending sync items when connectivity is restored.
 * Checks for OTA updates on mount in production builds.
 */
export default function AppLayout() {
  const router = useRouter();

  // Auto-flush sync queue on connectivity restore
  useSyncQueue(supabase);

  // Register push token on every app launch after auth
  usePushToken();

  // Handle cold-start deep links from notification taps
  const lastResponse = Notifications.useLastNotificationResponse();
  useEffect(() => {
    if (!lastResponse) return;
    if (lastResponse.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER) {
      const data = lastResponse.notification.request.content.data as NotificationData;
      const route = getDeepLinkRoute(data);
      if (route) {
        router.push(route as any);
      }
    }
  }, [lastResponse, router]);

  // Check for OTA updates on mount (production only)
  useEffect(() => {
    if (__DEV__) return;

    async function checkForUpdates() {
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        }
      } catch {
        // Silently fail - update check is best-effort
      }
    }

    checkForUpdates();
  }, []);

  return (
    <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.textPrimary,
          headerRight: () => <HeaderCloudIcon />,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="onboarding"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="plans"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="workout"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="history"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="progress"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="body-metrics"
          options={{ title: 'Body Metrics', headerShown: false }}
        />
        <Stack.Screen
          name="videos"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="notifications"
          options={{ title: 'Notifications' }}
        />
    </Stack>
  );
}
