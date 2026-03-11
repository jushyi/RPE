import React, { useRef } from 'react';
import { View, Text, Animated, Alert, StyleSheet } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { bestSessionE1RM } from '../utils/epley';
import { DeltaIndicator } from './DeltaIndicator';
import { SetRow } from './SetRow';
import type { HistoryExercise, ExerciseDelta } from '../types';

interface SessionExerciseCardProps {
  exercise: HistoryExercise;
  delta?: ExerciseDelta;
  onDeleteSet: (setId: string, sessionExerciseId: string) => void;
  onDeleteExercise?: (sessionExerciseId: string) => void;
}

function renderRightActions(
  _progress: Animated.AnimatedInterpolation<number>,
  dragX: Animated.AnimatedInterpolation<number>,
) {
  const scale = dragX.interpolate({
    inputRange: [-80, 0],
    outputRange: [1, 0.5],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View style={[s.deleteAction, { transform: [{ scale }] }]}>
      <Ionicons name="trash-outline" size={22} color={colors.white} />
      <Text style={s.deleteText}>Delete</Text>
    </Animated.View>
  );
}

export function SessionExerciseCard({
  exercise,
  delta,
  onDeleteSet,
  onDeleteExercise,
}: SessionExerciseCardProps) {
  const swipeableRef = useRef<Swipeable>(null);
  const showE1RM = exercise.exercise.track_prs && exercise.set_logs.length > 0;
  const e1rm = showE1RM ? bestSessionE1RM(exercise.set_logs) : 0;

  const handleSwipeOpen = (direction: 'left' | 'right') => {
    if (direction === 'right' && onDeleteExercise) {
      Alert.alert(
        'Delete Exercise?',
        'This exercise and all its sets will be permanently removed.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => swipeableRef.current?.close(),
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => onDeleteExercise(exercise.id),
          },
        ]
      );
    }
  };

  const content = (
    <Card>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <Text style={s.exerciseName}>{exercise.exercise.name}</Text>
          <View style={s.badgeRow}>
            {exercise.exercise.muscle_groups.map((mg) => (
              <View key={mg} style={s.muscleBadge}>
                <Text style={s.muscleBadgeText}>{mg}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={s.headerRight}>
          {showE1RM && e1rm > 0 && (
            <Text style={s.e1rmText}>Est. 1RM: {e1rm} kg</Text>
          )}
          {delta && <DeltaIndicator delta={delta} />}
        </View>
      </View>

      {/* Set Rows */}
      {exercise.set_logs.map((set) => (
        <SetRow
          key={set.id}
          set={set}
          sessionExerciseId={exercise.id}
          onDeleteSet={onDeleteSet}
        />
      ))}
    </Card>
  );

  if (!onDeleteExercise) return content;

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      onSwipeableOpen={handleSwipeOpen}
      overshootRight={false}
    >
      {content}
    </Swipeable>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  exerciseName: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  muscleBadge: {
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  muscleBadgeText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  e1rmText: {
    color: colors.accentBright,
    fontSize: 12,
    fontWeight: '600',
  },
  deleteAction: {
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRadius: 16,
    marginBottom: 12,
  },
  deleteText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
});
