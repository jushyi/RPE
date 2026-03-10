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

export function ActiveWorkoutBar() {
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

  return (
    <Pressable
      style={s.container}
      onPress={() => router.push('/workout' as any)}
    >
      <Ionicons name="play" size={18} color="#fff" />
      <View style={s.center}>
        <Text style={s.title} numberOfLines={1}>
          {activeSession!.title}
        </Text>
        <Text style={s.timer}>{elapsed}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.7)" />
    </Pressable>
  );
}

const s = StyleSheet.create({
  container: {
    height: 52,
    backgroundColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
  },
  center: {
    flex: 1,
  },
  title: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  timer: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
  },
});
