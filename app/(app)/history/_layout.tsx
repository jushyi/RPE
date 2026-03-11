import { Stack } from 'expo-router';
import { colors } from '@/constants/theme';

export default function HistoryLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.textPrimary,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="[sessionId]" />
    </Stack>
  );
}
