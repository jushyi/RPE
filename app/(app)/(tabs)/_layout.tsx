import { View } from 'react-native';
import { Tabs } from 'expo-router';
import { BottomTabBar, type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import { ActiveWorkoutBar } from '@/features/workout/components/ActiveWorkoutBar';

function TabBarWithWorkoutBar(props: BottomTabBarProps) {
  return (
    <View>
      <ActiveWorkoutBar />
      <BottomTabBar {...props} />
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={TabBarWithWorkoutBar}
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.surfaceElevated,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <Ionicons name="home-outline" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="plans"
        options={{
          title: 'Plans',
          tabBarIcon: ({ color }) => (
            <Ionicons name="clipboard-outline" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => (
            <Ionicons name="settings-outline" size={20} color={color} />
          ),
          headerShown: true,
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.textPrimary,
        }}
      />
    </Tabs>
  );
}
