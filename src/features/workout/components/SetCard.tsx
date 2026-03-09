import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, Keyboard } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { colors } from '@/constants/theme';
import {
  SWIPE_THRESHOLD,
  SWIPE_ANIMATION_DURATION,
  MAX_WEIGHT,
  MAX_REPS,
} from '@/features/workout/constants';
import type { TargetSet } from '@/features/plans/types';

interface SetCardProps {
  targetSet?: TargetSet;
  setNumber: number;
  unit: 'kg' | 'lbs';
  onLog: (weight: number, reps: number) => void;
  disabled?: boolean;
}

export function SetCard({ targetSet, setNumber, unit, onLog, disabled }: SetCardProps) {
  const [weight, setWeight] = useState(
    targetSet?.weight != null ? String(targetSet.weight) : ''
  );
  const [reps, setReps] = useState(
    targetSet?.reps != null ? String(targetSet.reps) : ''
  );

  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);

  const handleLog = useCallback(() => {
    const w = parseFloat(weight) || 0;
    const r = parseInt(reps, 10) || 0;
    if (w <= 0 || r <= 0) return;
    Keyboard.dismiss();
    onLog(w, r);
  }, [weight, reps, onLog]);

  const pan = Gesture.Pan()
    .activeOffsetY([-15, 15])
    .failOffsetX([-10, 10])
    .enabled(!disabled)
    .onUpdate((e) => {
      'worklet';
      if (e.translationY < 0) {
        translateY.value = e.translationY;
      }
    })
    .onEnd((e) => {
      'worklet';
      if (e.translationY < SWIPE_THRESHOLD) {
        translateY.value = withTiming(-400, { duration: SWIPE_ANIMATION_DURATION });
        opacity.value = withTiming(0, { duration: SWIPE_ANIMATION_DURATION });
        runOnJS(handleLog)();
      } else {
        translateY.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const handleWeightChange = useCallback((text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    const val = parseFloat(cleaned);
    if (cleaned === '' || (val >= 0 && val <= MAX_WEIGHT)) {
      setWeight(cleaned);
    }
  }, []);

  const handleRepsChange = useCallback((text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    const val = parseInt(cleaned, 10);
    if (cleaned === '' || (val >= 0 && val <= MAX_REPS)) {
      setReps(cleaned);
    }
  }, []);

  if (disabled) {
    return (
      <View style={[s.card, s.cardDisabled]}>
        <Text style={s.setLabel}>Set {setNumber}</Text>
        <View style={s.inputRow}>
          <View style={s.inputGroup}>
            <Text style={s.inputLabelMuted}>Weight</Text>
            <Text style={s.completedValue}>{weight || '---'}</Text>
            <Text style={s.unitLabel}>{unit}</Text>
          </View>
          <View style={s.inputGroup}>
            <Text style={s.inputLabelMuted}>Reps</Text>
            <Text style={s.completedValue}>{reps || '---'}</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[s.card, animatedStyle]}>
        <View style={s.setHeader}>
          <Text style={s.setLabel}>Set {setNumber}</Text>
          <Text style={s.swipeHint}>Swipe up to log</Text>
        </View>
        <View style={s.inputRow}>
          <View style={s.inputGroup}>
            <Text style={s.inputLabel}>Weight ({unit})</Text>
            <TextInput
              style={s.input}
              value={weight}
              onChangeText={handleWeightChange}
              keyboardType="decimal-pad"
              returnKeyType="done"
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              selectTextOnFocus
            />
          </View>
          <View style={s.separator} />
          <View style={s.inputGroup}>
            <Text style={s.inputLabel}>Reps</Text>
            <TextInput
              style={s.input}
              value={reps}
              onChangeText={handleRepsChange}
              keyboardType="number-pad"
              returnKeyType="done"
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              selectTextOnFocus
            />
          </View>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.surfaceElevated,
  },
  cardDisabled: {
    opacity: 0.5,
  },
  setHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  setLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  swipeHint: {
    color: colors.textMuted,
    fontSize: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputGroup: {
    flex: 1,
    alignItems: 'center',
  },
  inputLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
  },
  inputLabelMuted: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  input: {
    backgroundColor: colors.surfaceElevated,
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    minHeight: 60,
    minWidth: 120,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  separator: {
    width: 1,
    height: 40,
    backgroundColor: colors.surfaceElevated,
    marginHorizontal: 12,
  },
  unitLabel: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  completedValue: {
    color: colors.textMuted,
    fontSize: 20,
    fontWeight: '600',
  },
});
