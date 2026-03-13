import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase/client';
import { useSocialStore } from '@/stores/socialStore';
import { useFeed } from '@/features/social/hooks/useFeed';
import { SharedWorkoutCard } from '@/features/social/components/SharedWorkoutCard';
import { SharedPRCard } from '@/features/social/components/SharedPRCard';
import { SharedVideoCard } from '@/features/social/components/SharedVideoCard';
import { ReactionBar } from '@/features/social/components/ReactionBar';
import { getTimeLabel } from '@/features/social/utils/timeLabel';
import type { SharedItem, FriendProfile, Group } from '@/features/social/types';

export default function GroupFeedScreen() {
  const { groupId, groupName } = useLocalSearchParams<{
    groupId: string;
    groupName?: string;
  }>();
  const router = useRouter();

  const groups = useSocialStore((s) => s.groups);
  const group: Group | undefined = groups.find((g) => g.id === groupId);
  const title = groupName ?? group?.name ?? 'Feed';

  const { items, loading, hasMore, loadMore, refresh } = useFeed(groupId ?? '');

  // Author profiles keyed by user_id
  const [profiles, setProfiles] = useState<Record<string, FriendProfile>>({});

  // Fetch profiles for unique authors in items
  useEffect(() => {
    if (items.length === 0) return;

    const missingIds = Array.from(
      new Set(items.map((i) => i.user_id))
    ).filter((uid) => !profiles[uid]);

    if (missingIds.length === 0) return;

    supabase
      .from('profiles')
      .select('id, display_name, avatar_url, handle')
      .in('id', missingIds)
      .then(({ data, error }) => {
        if (error || !data) return;
        setProfiles((prev) => {
          const next = { ...prev };
          for (const p of data as any[]) {
            next[p.id] = {
              id: p.id,
              display_name: p.display_name ?? '',
              avatar_url: p.avatar_url ?? null,
              handle: p.handle ?? '',
            };
          }
          return next;
        });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUserId(session?.user?.id ?? null);
    });
  }, []);

  const renderItem = ({ item }: { item: SharedItem }) => {
    const author = profiles[item.user_id];
    const authorName = author?.display_name ?? 'Someone';
    const authorAvatar = author?.avatar_url ?? null;
    const timeLabel = getTimeLabel(item.created_at);

    return (
      <View style={s.itemWrapper}>
        {item.content_type === 'workout' ? (
          <SharedWorkoutCard
            item={item as any}
            authorName={authorName}
            authorAvatar={authorAvatar}
            timeLabel={timeLabel}
            onPress={() =>
              router.push({
                pathname: '/(app)/social/shared-item-detail' as any,
                params: {
                  itemId: item.id,
                  groupId: item.group_id,
                },
              })
            }
          />
        ) : item.content_type === 'pr' ? (
          <SharedPRCard
            item={item as any}
            authorName={authorName}
            authorAvatar={authorAvatar}
            timeLabel={timeLabel}
          />
        ) : (
          <SharedVideoCard
            item={item as any}
            authorName={authorName}
            authorAvatar={authorAvatar}
            timeLabel={timeLabel}
          />
        )}
        <View style={s.reactionWrapper}>
          <ReactionBar sharedItemId={item.id} />
        </View>
      </View>
    );
  };

  const ListEmpty = () => (
    <View style={s.empty}>
      <Text style={s.emptyText}>No posts yet. Share your workouts to get started.</Text>
    </View>
  );

  const ListFooter = () => {
    if (!hasMore) return null;
    return (
      <View style={s.footer}>
        <ActivityIndicator size="small" color={colors.accent} />
      </View>
    );
  };

  return (
    <SafeAreaView style={s.safeArea} edges={['bottom']}>
      <Stack.Screen
        options={{
          title,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.textPrimary,
          headerTitleStyle: { color: colors.textPrimary, fontWeight: '700' },
        }}
      />

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[
          s.list,
          items.length === 0 && s.listEmpty,
        ]}
        ListEmptyComponent={loading ? null : <ListEmpty />}
        ListFooterComponent={<ListFooter />}
        onEndReached={() => {
          if (hasMore && !loading) loadMore();
        }}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl
            refreshing={loading && items.length > 0}
            onRefresh={refresh}
            tintColor={colors.accent}
          />
        }
        ItemSeparatorComponent={() => <View style={s.separator} />}
      />

      {loading && items.length === 0 ? (
        <View style={s.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    padding: 16,
    paddingBottom: 32,
  },
  listEmpty: {
    flex: 1,
  },
  itemWrapper: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.surfaceElevated,
    overflow: 'hidden',
  },
  reactionWrapper: {
    borderTopWidth: 1,
    borderTopColor: colors.surfaceElevated,
  },
  separator: {
    height: 12,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  footer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
