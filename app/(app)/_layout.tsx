import { Stack } from 'expo-router';
import { colors } from '@/constants/theme';
import { HeaderCloudIcon } from '@/components/layout/HeaderCloudIcon';

/**
 * App layout wrapping tabs and onboarding routes.
 * HeaderCloudIcon shows connection status in all screen headers.
 */
export default function AppLayout() {
  return (
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
    </Stack>
  );
}
