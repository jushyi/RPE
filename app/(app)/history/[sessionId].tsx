import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import { useSessionDetail } from '@/features/history/hooks/useSessionDetail';
import { useHistory } from '@/features/history/hooks/useHistory';
import { SessionDetailHeader } from '@/features/history/components/SessionDetailHeader';
import { SessionExerciseCard } from '@/features/history/components/SessionExerciseCard';

function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr);
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

export default function SessionDetailScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const router = useRouter();
  const { session, deltas, isLoading, fetchSession, deleteSet, deleteExercise } =
    useSessionDetail();
  const { deleteSession } = useHistory();

  useEffect(() => {
    if (sessionId) {
      fetchSession(sessionId);
    }
  }, [sessionId]);

  const handleDeleteSession = useCallback(() => {
    Alert.alert(
      'Delete Workout?',
      'This will permanently remove this session and all its logged sets.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const Haptics = require('expo-haptics');
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            } catch {
              // Haptics not available
            }
            try {
              await deleteSession(sessionId!);
              router.back();
            } catch {
              Alert.alert('Error', 'Failed to delete session.');
            }
          },
        },
      ]
    );
  }, [sessionId, deleteSession, router]);

  const handleDeleteSet = useCallback(
    async (setId: string, sessionExerciseId: string) => {
      try {
        await deleteSet(setId, sessionExerciseId);
      } catch {
        Alert.alert('Error', 'Failed to delete set.');
      }
    },
    [deleteSet]
  );

  const handleDeleteExercise = useCallback(
    async (sessionExerciseId: string) => {
      try {
        await deleteExercise(sessionExerciseId);
      } catch {
        Alert.alert('Error', 'Failed to delete exercise.');
      }
    },
    [deleteExercise]
  );

  if (isLoading || !session) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  const title = session.plan_name
    ? `${session.plan_name}${session.day_name ? ` - ${session.day_name}` : ''}`
    : 'Freestyle';
  const dateStr = formatShortDate(session.ended_at ?? session.started_at);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Navigation Bar */}
      <View style={s.navBar}>
        <Pressable onPress={() => router.back()} style={s.navButton}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <View style={s.navTitle}>
          <Text style={s.navTitleText} numberOfLines={1}>{title}</Text>
          <Text style={s.navSubtitle}>{dateStr}</Text>
        </View>
        <Pressable onPress={handleDeleteSession} style={s.navButton}>
          <Ionicons name="trash-outline" size={22} color={colors.error} />
        </Pressable>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <SessionDetailHeader session={session} />

        {session.session_exercises.map((exercise) => {
          const delta = deltas.find(
            (d) => d.exerciseId === exercise.exercise_id
          );
          return (
            <View key={exercise.id} style={s.exerciseCardWrapper}>
              <SessionExerciseCard
                exercise={exercise}
                delta={delta}
                onDeleteSet={handleDeleteSet}
                onDeleteExercise={handleDeleteExercise}
              />
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  navButton: {
    padding: 8,
  },
  navTitle: {
    flex: 1,
    alignItems: 'center',
  },
  navTitleText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  navSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  exerciseCardWrapper: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
});
