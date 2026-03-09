import { View, Text } from 'react-native';

/**
 * Placeholder login screen.
 * Plan 02 replaces with real sign-in/sign-up toggle form.
 */
export default function LoginScreen() {
  return (
    <View className="flex-1 bg-background items-center justify-center">
      <Text className="text-text-primary text-2xl font-bold">Sign In</Text>
      <Text className="text-text-secondary mt-2">
        Authentication coming in Plan 02
      </Text>
    </View>
  );
}
