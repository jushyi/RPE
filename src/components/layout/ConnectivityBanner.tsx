import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

/**
 * Animated toast banner for connectivity changes.
 *
 * - "You're offline" (amber) when device goes offline
 * - "Back online" (green) when connectivity restored, auto-dismiss after 3s
 * - Slides in from top using react-native-reanimated
 */
export function ConnectivityBanner() {
  const { justWentOffline, justCameOnline, isConnected } = useNetworkStatus();
  const [bannerState, setBannerState] = useState<'offline' | 'online' | 'hidden'>(
    'hidden'
  );
  const translateY = useSharedValue(-80);

  useEffect(() => {
    if (justWentOffline) {
      setBannerState('offline');
      translateY.value = withTiming(0, { duration: 300 });
    } else if (justCameOnline) {
      setBannerState('online');
      translateY.value = withTiming(0, { duration: 300 });

      // Auto-dismiss after 3 seconds
      translateY.value = withDelay(
        3000,
        withTiming(-80, { duration: 300 }, (finished) => {
          if (finished) {
            runOnJS(setBannerState)('hidden');
          }
        })
      );
    }
  }, [justWentOffline, justCameOnline, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (bannerState === 'hidden') return null;

  const isOfflineBanner = bannerState === 'offline';

  return (
    <Animated.View
      style={animatedStyle}
      className={`absolute top-0 left-0 right-0 z-50 px-4 pt-12 pb-3 ${
        isOfflineBanner ? 'bg-warning' : 'bg-success'
      }`}
    >
      <Text className="text-white text-sm font-semibold text-center">
        {isOfflineBanner ? "You're offline" : 'Back online'}
      </Text>
    </Animated.View>
  );
}
