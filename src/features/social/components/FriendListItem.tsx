import React from 'react';
import { View, Text, Pressable, StyleSheet, Alert, Image } from 'react-native';
import { colors } from '@/constants/theme';
import type { FriendProfile } from '@/features/social/types';

interface FriendListItemProps {
  friend: FriendProfile;
  onUnfriend: (friendId: string) => void;
}

export function FriendListItem({ friend, onUnfriend }: FriendListItemProps) {
  const initial = (friend.display_name ?? 'U').charAt(0).toUpperCase();

  const handleLongPress = () => {
    Alert.alert(
      'Unfriend',
      `Remove ${friend.display_name} from your friends list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unfriend',
          style: 'destructive',
          onPress: () => onUnfriend(friend.id),
        },
      ]
    );
  };

  return (
    <Pressable style={s.item} onLongPress={handleLongPress} delayLongPress={400}>
      {friend.avatar_url ? (
        <Image source={{ uri: friend.avatar_url }} style={s.avatar} />
      ) : (
        <View style={s.avatarFallback}>
          <Text style={s.avatarText}>{initial}</Text>
        </View>
      )}
      <View style={s.info}>
        <Text style={s.name} numberOfLines={1}>
          {friend.display_name}
        </Text>
        {friend.handle ? (
          <Text style={s.handle} numberOfLines={1}>
            @{friend.handle}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
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
});
