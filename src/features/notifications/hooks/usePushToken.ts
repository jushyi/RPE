/**
 * Hook that registers the device's push token on mount.
 * Uses a ref to prevent double-registration in StrictMode.
 */

import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { registerPushToken } from '@/features/notifications/utils/pushTokenRegistration';

/**
 * Register push token on mount when the user is authenticated.
 * Returns the registered token (or null if not available).
 */
export function usePushToken(): { token: string | null } {
  const userId = useAuthStore((s) => s.userId);
  const [token, setToken] = useState<string | null>(null);
  const registeredRef = useRef(false);

  useEffect(() => {
    if (!userId || registeredRef.current) return;
    registeredRef.current = true;

    registerPushToken(userId).then((t) => {
      if (t) setToken(t);
    });
  }, [userId]);

  return { token };
}
