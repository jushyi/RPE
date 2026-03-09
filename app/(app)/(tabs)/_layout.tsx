import { Stack } from 'expo-router';
import { colors } from '@/constants/theme';

/**
 * Tabs group layout. Uses a Stack for now (single screen: dashboard).
 * Future plans will add more screens to this group.
 */
export default function TabsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}
