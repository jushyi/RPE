import { useEffect, useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { colors } from '@/constants/theme';

const BANNER_HEIGHT = 36;

export function ConnectivityBanner() {
  const { justWentOffline, justCameOnline } = useNetworkStatus();
  const [bannerState, setBannerState] = useState<'offline' | 'online' | 'hidden'>('hidden');
  const insets = useSafeAreaInsets();
  const height = useSharedValue(0);

  const totalHeight = insets.top + BANNER_HEIGHT;

  useEffect(() => {
    if (justWentOffline) {
      setBannerState('offline');
      height.value = withTiming(totalHeight, { duration: 300 });
    } else if (justCameOnline) {
      setBannerState('online');
      height.value = withTiming(totalHeight, { duration: 300 });
      height.value = withDelay(
        3000,
        withTiming(0, { duration: 300 }, (finished) => {
          if (finished) {
            runOnJS(setBannerState)('hidden');
          }
        })
      );
    }
  }, [justWentOffline, justCameOnline, height, totalHeight]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
    overflow: 'hidden' as const,
  }));

  if (bannerState === 'hidden') return null;

  const isOffline = bannerState === 'offline';

  return (
    <Animated.View
      style={[
        {
          backgroundColor: isOffline ? colors.warning : colors.success,
          justifyContent: 'flex-end',
          alignItems: 'center',
          paddingBottom: 8,
        },
        animatedStyle,
      ]}
    >
      <Text style={s.text}>
        {isOffline ? "You're offline" : 'Back online'}
      </Text>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  text: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
