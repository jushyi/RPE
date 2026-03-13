/**
 * useTypingIndicator — Supabase Realtime Presence for typing state.
 *
 * - Joins group-chat channel with presence config
 * - Exports startTyping() — tracks typing=true, auto-resets after 2s idle
 * - Exports typingUsers[] — names of other users currently typing
 * - Handles AppState background to prevent ghost typing indicators (Pitfall 5)
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { supabase } from '@/lib/supabase/client';

export function useTypingIndicator(groupId: string) {
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const userIdRef = useRef<string | null>(null);
  const displayNameRef = useRef<string>('');

  // Fetch current user info once
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      userIdRef.current = user.id;
    });

    supabase
      .from('profiles')
      .select('display_name, id')
      .then(({ data }) => {
        // Will be loaded after user id resolves; handled in channel subscribe
      });
  }, []);

  useEffect(() => {
    if (!groupId) return;

    let userId = '';
    let displayName = '';

    const initChannel = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      userId = user.id;
      userIdRef.current = userId;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', userId)
        .single();
      displayName = (profileData as any)?.display_name ?? 'Someone';
      displayNameRef.current = displayName;

      const channel = supabase.channel(`group-typing:${groupId}`, {
        config: {
          presence: { key: userId },
        },
      });

      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState() as Record<
            string,
            { typing: boolean; user_name: string }[]
          >;
          const names = Object.entries(state)
            .filter(([key, presences]) => {
              return key !== userId && presences?.[0]?.typing === true;
            })
            .map(([, presences]) => presences[0]?.user_name ?? 'Someone');
          setTypingUsers(names);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.track({ typing: false, user_name: displayName });
          }
        });

      channelRef.current = channel;
    };

    void initChannel();

    // Handle app background — untrack to prevent ghost typing (Pitfall 5)
    const handleAppState = (nextState: AppStateStatus) => {
      if (!channelRef.current) return;
      if (nextState === 'background' || nextState === 'inactive') {
        void channelRef.current.untrack();
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = null;
        }
      } else if (nextState === 'active') {
        void channelRef.current.track({
          typing: false,
          user_name: displayNameRef.current,
        });
      }
    };

    const subscription = AppState.addEventListener('change', handleAppState);

    return () => {
      subscription.remove();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (channelRef.current) {
        void channelRef.current.untrack();
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [groupId]);

  /**
   * Call whenever the user types. Tracks typing=true, resets after 2s idle.
   */
  const startTyping = useCallback(() => {
    const channel = channelRef.current;
    if (!channel) return;

    void channel.track({
      typing: true,
      user_name: displayNameRef.current,
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      void channel.track({
        typing: false,
        user_name: displayNameRef.current,
      });
      typingTimeoutRef.current = null;
    }, 2000);
  }, []);

  const stopTyping = useCallback(() => {
    const channel = channelRef.current;
    if (!channel) return;
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    void channel.track({
      typing: false,
      user_name: displayNameRef.current,
    });
  }, []);

  return { typingUsers, startTyping, stopTyping };
}
