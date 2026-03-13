import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import { useFriendships } from '@/features/social/hooks/useFriendships';
import { useGroups } from '@/features/social/hooks/useGroups';
import { FriendListItem } from '@/features/social/components/FriendListItem';
import { GroupCard } from '@/features/social/components/GroupCard';
import type { FriendProfile, Group } from '@/features/social/types';
import { supabase } from '@/lib/supabase/client';
import { useEffect, useRef, useState } from 'react';

export default function SocialTab() {
  const router = useRouter();
  const {
    friends,
    pendingCount,
    loading: friendsLoading,
    actions,
  } = useFriendships();

  const {
    groups,
    loading: groupsLoading,
    getMembersForGroup,
  } = useGroups();

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const fetchedUserRef = useRef(false);

  useEffect(() => {
    if (fetchedUserRef.current) return;
    fetchedUserRef.current = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUserId(session?.user?.id ?? null);
    });
  }, []);

  const loading = friendsLoading || groupsLoading;

  const handleUnfriend = useCallback(
    async (friendId: string) => {
      await actions.unfriend(friendId);
    },
    [actions]
  );

  const handleRefresh = useCallback(async () => {
    await Promise.all([
      actions.fetchFriends(),
      actions.fetchPendingRequests(),
      actions.fetchSentRequests(),
    ]);
  }, [actions]);

  const renderFriend = useCallback(
    ({ item }: { item: FriendProfile }) => (
      <FriendListItem friend={item} onUnfriend={handleUnfriend} />
    ),
    [handleUnfriend]
  );

  const renderGroup = useCallback(
    ({ item }: { item: Group }) => {
      const members = getMembersForGroup(item.id);
      const memberCount = members.length;
      const isMuted = currentUserId
        ? (members.find((m) => m.user_id === currentUserId)?.muted ?? false)
        : false;

      return (
        <GroupCard
          group={item}
          memberCount={memberCount}
          isMuted={isMuted}
        />
      );
    },
    [getMembersForGroup, currentUserId]
  );

  return (
    <SafeAreaView style={s.safeArea} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Social</Text>
        <Pressable
          style={s.addBtn}
          onPress={() => router.push('/(app)/social/add-friend' as any)}
          hitSlop={12}
        >
          <Ionicons name="person-add-outline" size={22} color={colors.textPrimary} />
        </Pressable>
      </View>

      <FlatList
        data={friends}
        keyExtractor={(item) => item.id}
        renderItem={renderFriend}
        contentContainerStyle={s.listContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
          />
        }
        ListHeaderComponent={
          <>
            {/* Friends section header */}
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>
                Friends
                {friends.length > 0 ? (
                  <Text style={s.sectionCount}> {friends.length}</Text>
                ) : null}
              </Text>
              {pendingCount > 0 ? (
                <Pressable
                  style={s.pendingBadge}
                  onPress={() => router.push('/(app)/social/friend-requests' as any)}
                >
                  <Text style={s.pendingBadgeText}>
                    {pendingCount} pending
                  </Text>
                  <Ionicons name="chevron-forward" size={14} color={colors.accent} />
                </Pressable>
              ) : null}
            </View>
          </>
        }
        ListEmptyComponent={
          friendsLoading ? (
            <ActivityIndicator color={colors.accent} style={s.loader} />
          ) : (
            <View style={s.emptyState}>
              <Text style={s.emptyText}>No friends yet. Tap + to add friends.</Text>
            </View>
          )
        }
        ListFooterComponent={
          <>
            {/* Groups section */}
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>
                Groups
                {groups.length > 0 ? (
                  <Text style={s.sectionCount}> {groups.length}</Text>
                ) : null}
              </Text>
              <Pressable
                style={s.addGroupBtn}
                onPress={() => router.push('/(app)/social/create-group' as any)}
                hitSlop={8}
              >
                <Ionicons name="add-circle-outline" size={22} color={colors.accent} />
              </Pressable>
            </View>

            {groupsLoading ? (
              <ActivityIndicator color={colors.accent} style={s.loader} />
            ) : groups.length > 0 ? (
              <FlatList
                data={groups}
                keyExtractor={(item) => item.id}
                renderItem={renderGroup}
                scrollEnabled={false}
              />
            ) : (
              <View style={s.emptyState}>
                <Text style={s.emptyText}>
                  No groups yet. Create one to start sharing.
                </Text>
              </View>
            )}
          </>
        }
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  addBtn: {
    padding: 8,
    backgroundColor: colors.surface,
    borderRadius: 10,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sectionCount: {
    fontSize: 17,
    fontWeight: '400',
    color: colors.textMuted,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accent + '22',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  pendingBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent,
  },
  addGroupBtn: {
    padding: 4,
  },
  emptyState: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
  loader: {
    marginTop: 24,
  },
});
