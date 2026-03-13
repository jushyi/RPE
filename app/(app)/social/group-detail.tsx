import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase/client';
import { useSocialStore } from '@/stores/socialStore';
import { useFriendshipStore } from '@/stores/friendshipStore';
import { GroupMemberList } from '@/features/social/components/GroupMemberList';
import type { FriendProfile, Group } from '@/features/social/types';

export default function GroupDetailScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const router = useRouter();

  const groups = useSocialStore((s) => s.groups);
  const groupMembers = useSocialStore((s) => s.groupMembers);
  const fetchGroupMembers = useSocialStore((s) => s.fetchGroupMembers);
  const leaveGroup = useSocialStore((s) => s.leaveGroup);
  const addMemberToGroup = useSocialStore((s) => s.addMemberToGroup);
  const removeMemberFromGroup = useSocialStore((s) => s.removeMemberFromGroup);
  const toggleMuteGroup = useSocialStore((s) => s.toggleMuteGroup);
  const friends = useFriendshipStore((s) => s.friends);

  const group: Group | undefined = groups.find((g) => g.id === groupId);
  const members = groupMembers[groupId ?? ''] ?? [];

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [memberProfiles, setMemberProfiles] = useState<Record<string, FriendProfile>>({});
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);

  // Fetch current user ID
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUserId(session?.user?.id ?? null);
    });
  }, []);

  // Fetch group members on mount
  useEffect(() => {
    if (groupId) {
      fetchGroupMembers(groupId);
    }
  }, [groupId, fetchGroupMembers]);

  // Fetch member profiles when members change
  useEffect(() => {
    if (members.length === 0) return;

    const userIds = members.map((m) => m.user_id);
    setLoadingProfiles(true);

    supabase
      .from('profiles')
      .select('id, display_name, avatar_url, handle')
      .in('id', userIds)
      .then(({ data, error }) => {
        setLoadingProfiles(false);
        if (error || !data) {
          console.warn('Failed to fetch member profiles:', error?.message);
          return;
        }

        const profileMap: Record<string, FriendProfile> = {};
        for (const p of data as any[]) {
          profileMap[p.id] = {
            id: p.id,
            display_name: p.display_name ?? '',
            avatar_url: p.avatar_url ?? null,
            handle: p.handle ?? '',
          };
        }
        setMemberProfiles(profileMap);
      });
  }, [members]);

  const isCreator = currentUserId != null && group?.created_by === currentUserId;

  const currentMember = members.find((m) => m.user_id === currentUserId);
  const isMuted = currentMember?.muted ?? false;

  const handleToggleMute = useCallback(async () => {
    if (!groupId) return;
    await toggleMuteGroup(groupId);
    await fetchGroupMembers(groupId);
  }, [groupId, toggleMuteGroup, fetchGroupMembers]);

  const handleLeaveGroup = useCallback(() => {
    if (!groupId) return;
    Alert.alert(
      'Leave Group',
      `Are you sure you want to leave "${group?.name ?? 'this group'}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            await leaveGroup(groupId);
            router.back();
          },
        },
      ]
    );
  }, [groupId, group?.name, leaveGroup, router]);

  const handleRemoveMember = useCallback(
    async (gId: string, userId: string) => {
      await removeMemberFromGroup(gId, userId);
      await fetchGroupMembers(gId);
    },
    [removeMemberFromGroup, fetchGroupMembers]
  );

  const handleAddMember = useCallback(
    async (friendId: string) => {
      if (!groupId) return;
      await addMemberToGroup(groupId, friendId);
      setShowAddMember(false);
    },
    [groupId, addMemberToGroup]
  );

  // Friends not already in the group
  const memberUserIds = new Set(members.map((m) => m.user_id));
  const addableFriends = friends.filter((f) => !memberUserIds.has(f.id));

  if (!group) {
    return (
      <SafeAreaView style={s.safeArea} edges={['bottom']}>
        <Stack.Screen
          options={{
            title: 'Group',
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.textPrimary,
            headerTitleStyle: { color: colors.textPrimary, fontWeight: '700' },
          }}
        />
        <View style={s.centered}>
          <ActivityIndicator color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safeArea} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: group.name,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.textPrimary,
          headerTitleStyle: { color: colors.textPrimary, fontWeight: '700' },
        }}
      />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Members section */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>
            Members
            {members.length > 0 ? (
              <Text style={s.sectionCount}> {members.length}</Text>
            ) : null}
          </Text>

          {loadingProfiles && members.length === 0 ? (
            <ActivityIndicator color={colors.accent} style={s.loader} />
          ) : (
            <GroupMemberList
              groupId={groupId ?? ''}
              members={members}
              profiles={memberProfiles}
              currentUserId={currentUserId ?? ''}
              isCreator={isCreator}
              onRemoveMember={handleRemoveMember}
              onAddMemberPress={
                isCreator ? () => setShowAddMember((v) => !v) : undefined
              }
            />
          )}
        </View>

        {/* Add member picker (inline, creator only) */}
        {showAddMember && isCreator ? (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Add Friend to Group</Text>
            {addableFriends.length === 0 ? (
              <Text style={s.emptyText}>
                All your friends are already in this group.
              </Text>
            ) : (
              addableFriends.map((friend) => {
                const initial = (friend.display_name ?? 'U').charAt(0).toUpperCase();
                return (
                  <Pressable
                    key={friend.id}
                    style={s.addFriendRow}
                    onPress={() => handleAddMember(friend.id)}
                  >
                    <View style={s.avatarFallback}>
                      <Text style={s.avatarText}>{initial}</Text>
                    </View>
                    <View style={s.friendInfo}>
                      <Text style={s.friendName} numberOfLines={1}>
                        {friend.display_name}
                      </Text>
                      {friend.handle ? (
                        <Text style={s.friendHandle} numberOfLines={1}>
                          @{friend.handle}
                        </Text>
                      ) : null}
                    </View>
                    <Pressable
                      style={s.addBtn}
                      onPress={() => handleAddMember(friend.id)}
                    >
                      <Text style={s.addBtnText}>Add</Text>
                    </Pressable>
                  </Pressable>
                );
              })
            )}
          </View>
        ) : null}

        {/* Group Feed placeholder */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Group Feed</Text>
          <View style={s.feedPlaceholder}>
            <Text style={s.emptyText}>
              Group sharing coming soon.
            </Text>
          </View>
        </View>

        {/* Action buttons */}
        <View style={s.actions}>
          {/* Mute toggle */}
          <Pressable style={s.actionBtn} onPress={handleToggleMute}>
            <Ionicons
              name={isMuted ? 'notifications-off-outline' : 'notifications-outline'}
              size={20}
              color={isMuted ? colors.textMuted : colors.textPrimary}
              style={s.actionIcon}
            />
            <Text style={[s.actionText, isMuted && s.actionTextMuted]}>
              {isMuted ? 'Unmute Notifications' : 'Mute Notifications'}
            </Text>
          </Pressable>

          {/* Leave group */}
          <Pressable style={[s.actionBtn, s.leaveBtn]} onPress={handleLeaveGroup}>
            <Ionicons
              name="exit-outline"
              size={20}
              color={colors.error}
              style={s.actionIcon}
            />
            <Text style={s.leaveBtnText}>Leave Group</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  sectionCount: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.textMuted,
    textTransform: 'none',
  },
  loader: {
    marginTop: 12,
  },
  feedPlaceholder: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.surfaceElevated,
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
  addFriendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.surfaceElevated,
  },
  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent + '22',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.accent,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  friendHandle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  addBtn: {
    backgroundColor: colors.accent + '22',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  addBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
  },
  actions: {
    marginTop: 32,
    gap: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.surfaceElevated,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  leaveBtn: {
    borderColor: colors.error + '44',
    backgroundColor: colors.error + '11',
  },
  actionIcon: {
    marginRight: 12,
  },
  actionText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  actionTextMuted: {
    color: colors.textMuted,
  },
  leaveBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.error,
  },
});
