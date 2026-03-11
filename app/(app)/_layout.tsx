import { Stack } from 'expo-router';
import { colors } from '@/constants/theme';
import { HeaderCloudIcon } from '@/components/layout/HeaderCloudIcon';
import { useSyncQueue } from '@/features/workout/hooks/useSyncQueue';
import { supabase } from '@/lib/supabase/client';

/**
 * App layout wrapping tabs and onboarding routes.
 * HeaderCloudIcon shows connection status in all screen headers.
 * useSyncQueue auto-flushes pending sync items when connectivity is restored.
 */
export default function AppLayout() {
  // Auto-flush sync queue on connectivity restore
  useSyncQueue(supabase);

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
          name="settings"
          options={{ title: 'Settings' }}
        />
    </Stack>
  );
}
