import { useNetInfo } from '@react-native-community/netinfo';
import { useEffect, useRef } from 'react';

/**
 * Network connectivity hook with transition detection.
 *
 * Tracks when the device transitions between online and offline states
 * so UI components can show temporary banners/toasts on change.
 */
export function useNetworkStatus() {
  const netInfo = useNetInfo();
  const wasConnected = useRef<boolean | null>(netInfo.isConnected);

  const justWentOffline =
    wasConnected.current === true && netInfo.isConnected === false;
  const justCameOnline =
    wasConnected.current === false && netInfo.isConnected === true;

  useEffect(() => {
    wasConnected.current = netInfo.isConnected;
  }, [netInfo.isConnected]);

  return {
    isConnected: netInfo.isConnected ?? true,
    justWentOffline,
    justCameOnline,
  };
}
