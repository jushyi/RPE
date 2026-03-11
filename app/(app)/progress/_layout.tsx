import { Stack } from 'expo-router';
import { colors } from '@/constants/theme';

export default function ProgressLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.textPrimary,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="[exerciseId]" options={{ headerShown: false }} />
    </Stack>
  );
}
