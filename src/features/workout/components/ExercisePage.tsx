import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import { useWorkoutStore } from '@/stores/workoutStore';
import { SetCard } from './SetCard';
import { PreviousPerformanceDisplay } from './PreviousPerformance';
import { PRCelebration } from './PRCelebration';
import type { SessionExercise } from '@/features/workout/types';
import type { PRResult } from '@/features/workout/hooks/usePRDetection';

interface ExercisePageProps {
  exercise: SessionExercise;
  onLogSet: (exerciseId: string, weight: number, reps: number, rpe: number | null, unit: 'kg' | 'lbs', isPR: boolean) => void;
  onDetectPR?: (exerciseId: string, weight: number, unit: 'kg' | 'lbs') => Promise<PRResult>;
  onRemove?: (exerciseId: string) => void;
}

interface CelebrationState {
  exerciseName: string;
  newWeight: number;
  previousBest: number | null;
  unit: string;
}

export function ExercisePage({ exercise, onLogSet, onDetectPR, onRemove }: ExercisePageProps) {
  const toggleUnit = useWorkoutStore((s) => s.toggleExerciseUnit);
  const removeSet = useWorkoutStore((s) => s.removeSet);
  const isPlanBased = exercise.target_sets.length > 0;
  const loggedCount = exercise.logged_sets.length;
  const [celebration, setCelebration] = useState<CelebrationState | null>(null);
  // Track extra sets added beyond plan/default count
  const [extraSets, setExtraSets] = useState(0);

  const handleLog = useCallback(
    async (weight: number, reps: number, rpe: number | null) => {
      // Check for PR before logging
      let isPR = false;
      if (onDetectPR) {
        try {
          const result = await onDetectPR(exercise.exercise_id, weight, exercise.unit);
          isPR = result.isPR;
          if (result.isPR) {
            setCelebration({
              exerciseName: exercise.exercise_name,
              newWeight: weight,
              previousBest: result.previousBest,
              unit: exercise.unit,
            });
          }
        } catch {
          // PR detection failure should not block logging
        }
      }
      onLogSet(exercise.id, weight, reps, rpe, exercise.unit, isPR);
    },
    [exercise.id, exercise.exercise_name, exercise.unit, onLogSet, onDetectPR]
  );

  const baseSets = isPlanBased ? exercise.target_sets.length : Math.max(1, loggedCount);
  const totalSets = baseSets + extraSets;

  const handleDeleteSet = useCallback(
    (setNumber: number, isLogged: boolean) => {
      if (isLogged) {
        removeSet(exercise.id, setNumber);
      } else {
        setExtraSets((prev) => Math.max(0, prev - 1));
      }
    },
    [exercise.id, removeSet]
  );

  const setCards = [];
  for (let i = 0; i < totalSets; i++) {
    const setNumber = i + 1;
    const targetSet = isPlanBased ? exercise.target_sets[i] : undefined;
    const loggedSet = exercise.logged_sets.find((s) => s.set_number === setNumber);

    setCards.push(
      <SetCard
        key={`set-${exercise.id}-${setNumber}`}
        targetSet={targetSet}
        setNumber={setNumber}
        unit={exercise.unit}
        onLog={handleLog}
        onDelete={totalSets > 1 ? () => handleDeleteSet(setNumber, !!loggedSet) : undefined}
        isLogged={!!loggedSet}
        loggedSet={loggedSet}
      />
    );
  }

  return (
    <View style={s.wrapper}>
      <ScrollView
        style={s.container}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.header}>
          <View style={s.headerTextRow}>
            <View style={s.headerText}>
              <Text style={s.exerciseName}>{exercise.exercise_name}</Text>
              <View style={s.setsRow}>
                <Text style={s.setsInfo}>
                  {isPlanBased
                    ? `${loggedCount}/${exercise.target_sets.length} sets logged`
                    : `${loggedCount} sets logged`}
                </Text>
                <Pressable
                  onPress={() => toggleUnit(exercise.id)}
                  style={({ pressed }) => [s.unitToggle, pressed && { opacity: 0.7 }]}
                  hitSlop={8}
                >
                  <Ionicons name="swap-horizontal" size={14} color={colors.accent} />
                  <Text style={s.unitToggleText}>{exercise.unit}</Text>
                </Pressable>
              </View>
            </View>
            {onRemove && (
              <Pressable
                onPress={() => Alert.alert(
                  'Remove Exercise',
                  `Remove ${exercise.exercise_name} from this workout?`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Remove', style: 'destructive', onPress: () => onRemove!(exercise.id) },
                  ]
                )}
                style={({ pressed }) => [s.removeBtn, pressed && { opacity: 0.6 }]}
                hitSlop={8}
              >
                <Ionicons name="trash-outline" size={20} color={colors.error} />
              </Pressable>
            )}
          </View>
        </View>

        {/* Previous performance inline display */}
        <PreviousPerformanceDisplay exerciseId={exercise.exercise_id} />

        {/* Set cards — always visible, marked as logged when filled */}
        {setCards}

        {/* Add Set button */}
        <View style={s.setActions}>
          <Pressable
            onPress={() => setExtraSets((prev) => prev + 1)}
            style={({ pressed }) => [s.setActionBtn, pressed && { opacity: 0.7 }]}
          >
            <Ionicons name="add-circle-outline" size={20} color={colors.accent} />
            <Text style={s.addSetText}>Add Set</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* PR Celebration overlay */}
      {celebration && (
        <PRCelebration
          exerciseName={celebration.exerciseName}
          newWeight={celebration.newWeight}
          previousBest={celebration.previousBest}
          unit={celebration.unit}
          onDismiss={() => setCelebration(null)}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingTop: 16,
    paddingBottom: 80,
  },
  header: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  headerTextRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerText: {
    flex: 1,
    marginRight: 12,
  },
  exerciseName: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: 'bold',
  },
  setsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 12,
  },
  setsInfo: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  unitToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  unitToggleText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  removeBtn: {
    padding: 8,
    marginTop: -4,
  },
  setActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginHorizontal: 16,
    marginTop: 4,
  },
  setActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 6,
  },
  addSetText: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: '600',
  },
});
