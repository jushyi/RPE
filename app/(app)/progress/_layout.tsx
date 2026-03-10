import { Stack } from 'expo-router';

export default function ProgressLayout() {
  return (
    <Stack>
      <Stack.Screen name="[exerciseId]" options={{ headerShown: false }} />
    </Stack>
  );
}
