import { Stack } from 'expo-router';
import { colors } from '@/constants/theme';
import { HeaderCloudIcon } from '@/components/layout/HeaderCloudIcon';
import CrashRecoveryPrompt from '@/features/workout/components/CrashRecoveryPrompt';
import { useSyncQueue } from '@/features/workout/hooks/useSyncQueue';
import { supabase } from '@/lib/supabase/client';

/**
 * App layout wrapping tabs and onboarding routes.
 * HeaderCloudIcon shows connection status in all screen headers.
 * CrashRecoveryPrompt checks for unfinished workouts on app mount.
 * useSyncQueue auto-flushes pending sync items when connectivity is restored.
 */
export default function AppLayout() {
  // Auto-flush sync queue on connectivity restore
  useSyncQueue(supabase);

  return (
    <>
      <CrashRecoveryPrompt />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.textPrimary,
          headerRight: () => <HeaderCloudIcon />,
          contentStyle: { backgroundColor: colors.background },
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
      </Stack>
    </>
  );
}
