import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import type { TraineeProfile } from '@/features/coaching/types';

interface TraineeCardProps {
  trainee: TraineeProfile;
  onPress: () => void;
  onDisconnect: () => void;
}

export function TraineeCard({ trainee, onPress, onDisconnect }: TraineeCardProps) {
  const initial = (trainee.display_name ?? 'U').charAt(0).toUpperCase();

  return (
    <Pressable style={s.card} onPress={onPress}>
      <View style={s.avatar}>
        <Text style={s.avatarText}>{initial}</Text>
      </View>
      <View style={s.info}>
        <Text style={s.name} numberOfLines={1}>
          {trainee.display_name}
        </Text>
        <Text style={s.subtitle}>Trainee</Text>
      </View>
      <Pressable
        style={s.disconnectBtn}
        onPress={onDisconnect}
        hitSlop={12}
      >
        <Ionicons name="close-circle-outline" size={22} color={colors.error} />
      </Pressable>
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  avatar: {
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
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  disconnectBtn: {
    padding: 4,
  },
});
