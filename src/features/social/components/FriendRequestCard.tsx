import React, { useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Image, LayoutAnimation } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import type { FriendRequest, FriendProfile } from '@/features/social/types';

interface FriendRequestCardProps {
  request: FriendRequest;
  sender: FriendProfile | null;
  onAccept: (requestId: string) => void;
  onReject: (requestId: string) => void;
}

export function FriendRequestCard({
  request,
  sender,
  onAccept,
  onReject,
}: FriendRequestCardProps) {
  const displayName = sender?.display_name ?? 'Unknown';
  const handle = sender?.handle ?? null;
  const avatarUrl = sender?.avatar_url ?? null;
  const initial = displayName.charAt(0).toUpperCase();

  const handleAccept = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onAccept(request.id);
  }, [request.id, onAccept]);

  const handleReject = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onReject(request.id);
  }, [request.id, onReject]);

  return (
    <View style={s.card}>
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={s.avatar} />
      ) : (
        <View style={s.avatarFallback}>
          <Text style={s.avatarText}>{initial}</Text>
        </View>
      )}
      <View style={s.info}>
        <Text style={s.name} numberOfLines={1}>
          {displayName}
        </Text>
        {handle ? (
          <Text style={s.handle} numberOfLines={1}>
            @{handle}
          </Text>
        ) : null}
      </View>
      <View style={s.actions}>
        <Pressable style={s.acceptBtn} onPress={handleAccept} hitSlop={8}>
          <Ionicons name="checkmark-outline" size={20} color={colors.success} />
        </Pressable>
        <Pressable style={s.rejectBtn} onPress={handleReject} hitSlop={8}>
          <Ionicons name="close-outline" size={20} color={colors.textMuted} />
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent + '22',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.accent,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  handle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.success + '22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
