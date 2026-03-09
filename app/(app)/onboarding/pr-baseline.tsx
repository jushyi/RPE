import { View, Text } from 'react-native';

/**
 * Placeholder PR baseline entry screen.
 * Plan 03 builds the real form with Big 3 lift inputs and unit toggle.
 */
export default function PRBaselineScreen() {
  return (
    <View className="flex-1 bg-background items-center justify-center">
      <Text className="text-text-primary text-2xl font-bold">PR Baseline</Text>
      <Text className="text-text-secondary mt-2">
        Enter your current lifts - coming soon
      </Text>
    </View>
  );
}
