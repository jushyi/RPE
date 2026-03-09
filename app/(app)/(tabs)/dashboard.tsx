import { View, Text } from 'react-native';

/**
 * Placeholder dashboard screen.
 * Plan 03 builds the real dashboard shell with sections.
 */
export default function DashboardScreen() {
  return (
    <View className="flex-1 bg-background items-center justify-center">
      <Text className="text-text-primary text-2xl font-bold">Dashboard</Text>
      <Text className="text-text-secondary mt-2">
        Your workout hub - coming soon
      </Text>
    </View>
  );
}
