import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSocialStore } from '@/stores/socialStore';
import type { Reaction } from '@/features/social/types';

interface UseReactionsResult {
  reactions: Reaction[];
  reactionCounts: Map<string, number>;
  myReactions: Set<string>;
  toggle: (emoji: string) => Promise<void>;
}

/**
 * Manages reactions for a single shared item with optimistic updates.
 * `emoji` parameter is an icon key string (e.g. "fire"), NOT an emoji character.
 */
export function useReactions(sharedItemId: string): UseReactionsResult {
  const reactions = useSocialStore((s) => s.reactions[sharedItemId] ?? []);
  const addReaction = useSocialStore((s) => s.addReaction);
  const removeReaction = useSocialStore((s) => s.removeReaction);
  const fetchReactions = useSocialStore((s) => s.fetchReactions);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    // Dynamic import avoids module-level circular dep with supabase client
    import('@/lib/supabase/client').then(({ supabase }) => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setCurrentUserId(session?.user?.id ?? null);
      });
    });
  }, []);

  const reactionCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of reactions) {
      counts.set(r.emoji, (counts.get(r.emoji) ?? 0) + 1);
    }
    return counts;
  }, [reactions]);

  const myReactions = useMemo(() => {
    if (!currentUserId) return new Set<string>();
    const mine = new Set<string>();
    for (const r of reactions) {
      if (r.user_id === currentUserId) {
        mine.add(r.emoji);
      }
    }
    return mine;
  }, [reactions, currentUserId]);

  const toggle = useCallback(
    async (emoji: string) => {
      if (!currentUserId) return;

      if (myReactions.has(emoji)) {
        // Find the reaction id to remove
        const existing = reactions.find(
          (r) => r.emoji === emoji && r.user_id === currentUserId
        );
        if (existing) {
          await removeReaction(existing.id);
        }
      } else {
        await addReaction(sharedItemId, emoji);
        // Refresh to get server-assigned id for the new reaction
        await fetchReactions(sharedItemId);
      }
    },
    [currentUserId, myReactions, reactions, removeReaction, addReaction, sharedItemId, fetchReactions]
  );

  return { reactions, reactionCounts, myReactions, toggle };
}
