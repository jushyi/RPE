import React from 'react';
import { View, Text, Pressable, StyleSheet, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import type { GroupMember, FriendProfile } from '@/features/social/types';

interface GroupMemberListProps {
  groupId: string;
  members: GroupMember[];
  profiles: Record<string, FriendProfile>;
  currentUserId: string;
  isCreator: boolean;
  onRemoveMember: (groupId: string, userId: string) => void;
  onAddMemberPress?: () => void;
}

/**
 * Renders the list of group members.
 * - Creators see a remove button on non-self members
 * - Current user is labeled "(You)"
 * - If creator, an "Add Member" row appears at the bottom
 */
export function GroupMemberList({
  groupId,
  members,
  profiles,
  currentUserId,
  isCreator,
  onRemoveMember,
  onAddMemberPress,
}: GroupMemberListProps) {
  const handleRemove = (userId: string, displayName: string) => {
    Alert.alert(
      'Remove Member',
      `Remove ${displayName} from this group?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => onRemoveMember(groupId, userId),
        },
      ]
    );
  };

  return (
    <View>
      {members.map((member) => {
        const profile = profiles[member.user_id];
        const displayName = profile?.display_name ?? 'Unknown';
        const handle = profile?.handle ?? null;
        const avatarUrl = profile?.avatar_url ?? null;
        const isCurrentUser = member.user_id === currentUserId;
        const initial = displayName.charAt(0).toUpperCase();

        return (
          <View key={member.id} style={s.memberRow}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={s.avatar} />
            ) : (
              <View style={s.avatarFallback}>
                <Text style={s.avatarText}>{initial}</Text>
              </View>
            )}
            <View style={s.memberInfo}>
              <Text style={s.memberName} numberOfLines={1}>
                {displayName}
                {isCurrentUser ? (
                  <Text style={s.youLabel}> (You)</Text>
                ) : null}
              </Text>
              {handle ? (
                <Text style={s.memberHandle} numberOfLines={1}>
                  @{handle}
                </Text>
              ) : null}
            </View>
            {isCreator && !isCurrentUser ? (
              <Pressable
                style={s.removeBtn}
                onPress={() => handleRemove(member.user_id, displayName)}
                hitSlop={8}
              >
                <Ionicons name="close-circle-outline" size={22} color={colors.error} />
              </Pressable>
            ) : null}
          </View>
        );
      })}

      {isCreator && onAddMemberPress ? (
        <Pressable style={s.addMemberRow} onPress={onAddMemberPress}>
          <View style={s.addMemberIcon}>
            <Ionicons name="person-add-outline" size={18} color={colors.accent} />
          </View>
          <Text style={s.addMemberText}>Add Member</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceElevated,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
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
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  youLabel: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.textMuted,
  },
  memberHandle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  removeBtn: {
    padding: 4,
  },
  addMemberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 4,
  },
  addMemberIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent + '22',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  addMemberText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.accent,
  },
});
