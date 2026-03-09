import { View, Text } from 'react-native';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

/**
 * Persistent cloud icon in header showing online/offline state.
 *
 * Uses @expo/vector-icons (bundled with Expo) for cloud icons.
 * Falls back to text-based indicators if icons unavailable.
 */
export function HeaderCloudIcon() {
  const { isConnected } = useNetworkStatus();

  // Use simple text-based cloud indicators for reliability
  // Could be upgraded to MaterialCommunityIcons "cloud-check" / "cloud-off-outline"
  return (
    <View className="mr-3 items-center justify-center">
      {isConnected ? (
        <Text className="text-success text-lg">&#9729;&#10003;</Text>
      ) : (
        <Text className="text-warning text-lg">&#9729;&#10007;</Text>
      )}
    </View>
  );
}
