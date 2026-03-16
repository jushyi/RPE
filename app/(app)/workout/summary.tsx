/**
 * Post-workout summary screen.
 * Shows session stats, weight target prompts for manual progression exercises,
 * and handles session sync + previous performance caching on completion.
 */
import React, { useState, useEffect, useMemo, useSyncExternalStore, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import SessionSummaryCard, {
  computeSessionSummary,
} from '@/features/workout/components/SessionSummary';
import WeightTargetPrompt from '@/features/workout/components/WeightTargetPrompt';
import SharePrompt from '@/features/social/components/SharePrompt';
import { flushSyncQueue } from '@/features/workout/hooks/useSyncQueue';
import { cachePreviousPerformance } from '@/features/workout/hooks/usePreviousPerformance';
import { getUploadState, subscribeUploadState } from '@/features/videos/utils/videoUploadQueue';
import { supabase } from '@/lib/supabase/client';
import type { WorkoutSession } from '@/features/workout/types';
import { getCompletedSession, clearCompletedSession, resetFinishingFlag } from '@/features/workout/workoutSessionBridge';

function useVideoUploadStatus() {
  const subscribe = useCallback((cb: () => void) => subscribeUploadState(cb), []);
  return useSyncExternalStore(subscribe, getUploadState, getUploadState);
}

export default function WorkoutSummaryScreen() {
  const router = useRouter();
  const [session] = useState<WorkoutSession | null>(() => getCompletedSession());
  const [showTargets, setShowTargets] = useState(true);
  const uploadStatus = useVideoUploadStatus();
  const isUploading = uploadStatus.status === 'uploading';

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

  // Extracted from inline IIFE so it can be shared with SharePrompt
  // Must be before early return to satisfy rules-of-hooks
  const prExercises = useMemo(() => {
    if (!session) return [];
    const summary = computeSessionSummary(session);
    if (summary.prs_hit === 0) return [];
    return session.exercises
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

        {prExercises.length > 0 && (
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
        )}

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

        {/* Share with groups */}
        <SharePrompt session={session} prs={prExercises} />

        {/* Video upload status banner */}
        {isUploading && (
          <View style={s.uploadBanner}>
            <ActivityIndicator size="small" color={colors.accent} />
            <Text style={s.uploadText}>
              Uploading {uploadStatus.pending} video{uploadStatus.pending !== 1 ? 's' : ''}...
            </Text>
          </View>
        )}
        {uploadStatus.status === 'success' && (
          <View style={s.uploadBanner}>
            <Ionicons name="checkmark-circle-outline" size={18} color={colors.success} />
            <Text style={[s.uploadText, { color: colors.success }]}>Video uploaded</Text>
          </View>
        )}
        {uploadStatus.status === 'error' && (
          <View style={[s.uploadBanner, s.uploadBannerError]}>
            <Ionicons name="alert-circle-outline" size={18} color={colors.error} />
            <Text style={[s.uploadText, { color: colors.error }]}>
              {uploadStatus.error || 'Video upload failed'}
            </Text>
          </View>
        )}

        <Pressable
          onPress={isUploading ? undefined : handleDone}
          style={({ pressed }) => [
            s.doneButton,
            isUploading && s.doneButtonDisabled,
            !isUploading && pressed && s.doneButtonPressed,
          ]}
        >
          {isUploading ? (
            <View style={s.doneButtonRow}>
              <ActivityIndicator size="small" color={colors.textMuted} />
              <Text style={[s.doneButtonText, s.doneButtonTextDisabled]}>Uploading video...</Text>
            </View>
          ) : (
            <Text style={s.doneButtonText}>Done</Text>
          )}
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
  uploadBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.surfaceElevated,
  },
  uploadBannerError: {
    borderColor: colors.error,
  },
  uploadText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  doneButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 48,
    alignItems: 'center',
    marginTop: 8,
  },
  doneButtonDisabled: {
    backgroundColor: colors.surfaceElevated,
  },
  doneButtonPressed: {
    opacity: 0.8,
  },
  doneButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  doneButtonTextDisabled: {
    color: colors.textMuted,
  },
  doneButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
