import { Tabs } from 'expo-router';
import { colors } from '@/constants/theme';

/**
 * Tab navigator layout for the main app.
 * Currently has one tab (dashboard). Future plans will add more tabs.
 */
export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.surfaceElevated,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tabs.Screen
        name="(tabs)"
        options={{
          title: 'Dashboard',
        }}
      />
      <Tabs.Screen
        name="onboarding"
        options={{
          href: null, // Hide from tab bar
        }}
      />
    </Tabs>
  );
}
