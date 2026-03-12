/**
 * Post-workout summary screen.
 * Shows session stats, weight target prompts for manual progression exercises,
 * and handles session sync + previous performance caching on completion.
 */
import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import SessionSummaryCard, {
  computeSessionSummary,
} from '@/features/workout/components/SessionSummary';
import WeightTargetPrompt from '@/features/workout/components/WeightTargetPrompt';
import { flushSyncQueue } from '@/features/workout/hooks/useSyncQueue';
import { cachePreviousPerformance } from '@/features/workout/hooks/usePreviousPerformance';
import { supabase } from '@/lib/supabase/client';
import type { WorkoutSession } from '@/features/workout/types';
import { getCompletedSession, clearCompletedSession, resetFinishingFlag } from '@/features/workout/workoutSessionBridge';

export default function WorkoutSummaryScreen() {
  const router = useRouter();
  const [session] = useState<WorkoutSession | null>(() => getCompletedSession());
  const [showTargets, setShowTargets] = useState(true);

  // Reset the finishing flag so workout screen redirect works normally again
  useEffect(() => {
    resetFinishingFlag();
  }, []);

  // Cache previous performance and enqueue sync on mount
  useEffect(() => {
    if (!session) return;

    // Cache each exercise's logged sets for next session's previous performance display
    for (const exercise of session.exercises) {
      if (exercise.logged_sets.length > 0) {
        cachePreviousPerformance(exercise.exercise_id, {
          exercise_id: exercise.exercise_id,
          sets: exercise.logged_sets,
          session_date: session.started_at.split('T')[0],
        });
      }
    }

    // Sync is now handled in finishWorkout (useWorkoutSession.ts) to ensure
    // the workout is saved even if this screen doesn't mount properly.
    // Attempt a flush in case finishWorkout's flush didn't complete.
    flushSyncQueue(supabase).catch(() => {});
  }, [session]);

  const handleDone = () => {
    clearCompletedSession();
    // Navigate to dashboard, replacing the entire stack so no workout screens remain
    try {
      router.dismissAll();
    } catch {
      router.replace('/(app)/(tabs)/dashboard' as any);
    }
  };

  if (!session) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.content}>
          <Ionicons name="checkmark-circle" size={64} color={colors.success} />
          <Text style={s.heading}>Workout Complete</Text>
          <Text style={s.subheading}>Great work!</Text>
          <Pressable
            onPress={handleDone}
            style={({ pressed }) => [s.doneButton, pressed && s.doneButtonPressed]}
          >
            <Text style={s.doneButtonText}>Done</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const summary = computeSessionSummary(session);

  return (
    <SafeAreaView style={s.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View style={s.headerSection}>
          <Ionicons name="checkmark-circle" size={64} color={colors.success} />
          <Text style={s.heading}>Workout Complete</Text>
          <Text style={s.subheading}>Great work! Here is your session summary.</Text>
        </View>

        <SessionSummaryCard session={session} />

        {summary.prs_hit > 0 && (() => {
          const prExercises = session.exercises
            .filter((ex) => ex.logged_sets.some((set) => set.is_pr))
            .map((ex) => {
              const prSets = ex.logged_sets.filter((set) => set.is_pr);
              const maxPR = prSets.reduce((max, set) => set.weight > max.weight ? set : max, prSets[0]);
              return {
                name: ex.exercise_name,
                weight: maxPR.weight,
                unit: maxPR.unit,
              };
            });
          return (
            <View style={s.prSection}>
              <View style={s.prHeader}>
                <Ionicons name="trophy-outline" size={22} color={colors.warning} />
                <Text style={s.prTitle}>Personal Records</Text>
              </View>
              {prExercises.map((pr) => (
                <View key={pr.name} style={s.prRow}>
                  <Text style={s.prExerciseName} numberOfLines={1}>{pr.name}</Text>
                  <Text style={s.prWeight}>New PR: {pr.weight} {pr.unit}</Text>
                </View>
              ))}
            </View>
          );
        })()}

        {showTargets &&
          summary.exercises_with_manual_progression.length > 0 && (
            <View style={s.targetSection}>
              <WeightTargetPrompt
                exercises={summary.exercises_with_manual_progression}
                planDayId={session.plan_day_id}
                onDone={() => setShowTargets(false)}
              />
            </View>
          )}

        <Pressable
          onPress={handleDone}
          style={({ pressed }) => [s.doneButton, pressed && s.doneButtonPressed]}
        >
          <Text style={s.doneButtonText}>Done</Text>
        </Pressable>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
    alignItems: 'center',
    gap: 24,
  },
  headerSection: {
    alignItems: 'center',
    gap: 8,
  },
  heading: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: 'bold',
  },
  subheading: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
  },
  prSection: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.surfaceElevated,
    gap: 12,
  },
  prHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  prTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  prRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  prExerciseName: {
    color: colors.textPrimary,
    fontSize: 15,
    flex: 1,
    marginRight: 12,
  },
  prWeight: {
    color: colors.warning,
    fontSize: 15,
    fontWeight: '700',
  },
  targetSection: {
    width: '100%',
  },
  doneButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 48,
    alignItems: 'center',
    marginTop: 8,
  },
  doneButtonPressed: {
    opacity: 0.8,
  },
  doneButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
});
