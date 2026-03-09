import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import type { Session } from '@supabase/supabase-js';

/**
 * Checks for an existing Supabase session on mount.
 *
 * Offline safety: If the device is offline, skip getSession() because it
 * triggers a token refresh that can fail and clear the session. Instead,
 * read auth state from the Zustand/MMKV store (synchronous, persisted).
 */
export function useSession() {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      try {
        // Dynamically check connectivity to avoid importing NetInfo at module level
        // which could cause issues in test environments
        let isConnected = true;
        try {
          const NetInfo = require('@react-native-community/netinfo');
          const state = await NetInfo.fetch();
          isConnected = state.isConnected ?? true;
        } catch {
          // If NetInfo fails, assume connected
          isConnected = true;
        }

        if (isConnected) {
          const { data } = await supabase.auth.getSession();
          if (mounted) {
            setSession(data.session);
          }
        }
        // If offline, we rely on the persisted Zustand store (isAuthenticated)
        // No need to call getSession which would trigger a refresh
      } catch {
        // Silently handle - the app will use persisted auth state
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      mounted = false;
    };
  }, []);

  return {
    isLoading,
    session,
    isRestoredFromCache: !session && isAuthenticated,
  };
}
