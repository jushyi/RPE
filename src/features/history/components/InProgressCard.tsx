import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/theme';
import { useWorkoutStore } from '@/stores/workoutStore';

function formatElapsed(startedAt: string): string {
  const diffMs = Date.now() - new Date(startedAt).getTime();
  const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function InProgressCard() {
  const activeSession = useWorkoutStore((s) => s.activeSession);
  const router = useRouter();
  const [elapsed, setElapsed] = useState('00:00');

  const isActive = activeSession !== null && activeSession.ended_at === null;

  useEffect(() => {
    if (!isActive || !activeSession?.started_at) return;

    setElapsed(formatElapsed(activeSession.started_at));

    const interval = setInterval(() => {
      setElapsed(formatElapsed(activeSession.started_at));
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, activeSession?.started_at]);

  if (!isActive) return null;

  const exerciseCount = activeSession!.exercises.length;
  const setsLogged = activeSession!.exercises.reduce(
    (sum, ex) => sum + ex.logged_sets.length,
    0
  );

  return (
    <Pressable onPress={() => router.push('/workout' as any)}>
      <View style={s.card}>
        <View style={s.topRow}>
          <Text style={s.inProgressLabel}>In Progress</Text>
          <Text style={s.timer}>{elapsed}</Text>
        </View>

        <Text style={s.title} numberOfLines={1}>
          {activeSession!.title}
        </Text>

        <View style={s.statsRow}>
          <View style={s.stat}>
            <Ionicons name="barbell-outline" size={14} color={colors.textMuted} />
            <Text style={s.statText}>{exerciseCount} exercises</Text>
          </View>
          <View style={s.stat}>
            <Ionicons name="checkmark-circle-outline" size={14} color={colors.textMuted} />
            <Text style={s.statText}>{setsLogged} sets logged</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  inProgressLabel: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '700',
  },
  timer: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '600',
  },
  title: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    color: colors.textMuted,
    fontSize: 13,
  },
});
