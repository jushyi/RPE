import { useEffect } from 'react';
import { useSocialStore } from '@/stores/socialStore';
import type { Group, GroupMember } from '@/features/social/types';

/**
 * Thin wrapper around socialStore group-related state and actions.
 * Calls fetchGroups on mount.
 */
export function useGroups() {
  const groups = useSocialStore((s) => s.groups);
  const groupMembers = useSocialStore((s) => s.groupMembers);
  const loading = useSocialStore((s) => s.loading);
  const fetchGroups = useSocialStore((s) => s.fetchGroups);
  const createGroup = useSocialStore((s) => s.createGroup);
  const leaveGroup = useSocialStore((s) => s.leaveGroup);
  const addMember = useSocialStore((s) => s.addMemberToGroup);
  const removeMember = useSocialStore((s) => s.removeMemberFromGroup);
  const toggleMute = useSocialStore((s) => s.toggleMuteGroup);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const getMembersForGroup = (groupId: string): GroupMember[] =>
    groupMembers[groupId] ?? [];

  const isGroupMuted = (groupId: string, userId: string): boolean => {
    const members = getMembersForGroup(groupId);
    const member = members.find((m) => m.user_id === userId);
    return member?.muted ?? false;
  };

  return {
    groups,
    loading,
    getMembersForGroup,
    isGroupMuted,
    createGroup,
    leaveGroup,
    addMember,
    removeMember,
    toggleMute,
  };
}
