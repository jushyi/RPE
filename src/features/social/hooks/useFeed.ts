import { useEffect, useState, useCallback } from 'react';
import { useSocialStore } from '@/stores/socialStore';
import type { SharedItem } from '@/features/social/types';

interface UseFeedResult {
  items: SharedItem[];
  loading: boolean;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;
}

/**
 * Cursor-based paginated feed hook for a group.
 * Fetches initial page on mount and exposes loadMore / refresh.
 */
export function useFeed(groupId: string): UseFeedResult {
  const feedItems = useSocialStore((s) => s.feedItems);
  const feedCursors = useSocialStore((s) => s.feedCursors);
  const loading = useSocialStore((s) => s.loading);
  const fetchFeed = useSocialStore((s) => s.fetchFeed);
  const fetchReactions = useSocialStore((s) => s.fetchReactions);

  const [refreshing, setRefreshing] = useState(false);

  const items: SharedItem[] = feedItems[groupId] ?? [];
  const cursor: string | undefined = feedCursors[groupId];
  const hasMore = cursor !== undefined;

  // Fetch reactions for visible items after items change
  useEffect(() => {
    if (items.length === 0) return;
    for (const item of items) {
      fetchReactions(item.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length, fetchReactions]);

  // Initial fetch on mount
  useEffect(() => {
    if (groupId) {
      fetchFeed(groupId);
    }
    // Only run on mount / groupId change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  const loadMore = useCallback(() => {
    if (!hasMore || loading) return;
    fetchFeed(groupId, cursor);
  }, [hasMore, loading, fetchFeed, groupId, cursor]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    // Clear cursor by fetching without cursor (store resets the page for this group)
    await fetchFeed(groupId);
    setRefreshing(false);
  }, [fetchFeed, groupId]);

  return {
    items,
    loading: loading || refreshing,
    hasMore,
    loadMore,
    refresh,
  };
}
