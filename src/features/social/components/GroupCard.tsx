import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/theme';
import type { Group } from '@/features/social/types';

interface GroupCardProps {
  group: Group;
  memberCount: number;
  isMuted: boolean;
}

export function GroupCard({ group, memberCount, isMuted }: GroupCardProps) {
  const router = useRouter();

  const handlePress = () => {
    router.push({
      pathname: '/(app)/social/group-detail' as any,
      params: { groupId: group.id },
    });
  };

  return (
    <Pressable style={s.card} onPress={handlePress}>
      <View style={s.iconWrapper}>
        <Ionicons name="people-outline" size={22} color={colors.accent} />
      </View>
      <View style={s.info}>
        <Text style={s.name} numberOfLines={1}>
          {group.name}
        </Text>
        <Text style={s.memberCount}>
          {memberCount} {memberCount === 1 ? 'member' : 'members'}
        </Text>
      </View>
      {isMuted ? (
        <Ionicons
          name="notifications-off-outline"
          size={18}
          color={colors.textMuted}
          style={s.muteIcon}
        />
      ) : null}
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.surfaceElevated,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent + '22',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  memberCount: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  muteIcon: {
    marginRight: 8,
  },
});
