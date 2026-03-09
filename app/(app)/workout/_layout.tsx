import { Stack } from 'expo-router';
import { colors } from '@/constants/theme';

/**
 * Workout route group layout.
 * Full-screen modal experience with no header.
 */
export default function WorkoutLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_bottom',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="summary" />
    </Stack>
  );
}
