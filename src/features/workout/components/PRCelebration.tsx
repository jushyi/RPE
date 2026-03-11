/**
 * Full-screen overlay for PR celebration.
 * Appears when a set exceeds the stored personal record.
 * Auto-dismisses after PR_CELEBRATION_DURATION, tap to dismiss early.
 */
import React, { useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { colors } from '@/constants/theme';
import { PR_CELEBRATION_DURATION } from '@/features/workout/constants';

interface PRCelebrationProps {
  exerciseName: string;
  newWeight: number;
  previousBest: number | null;
  unit: string;
  onDismiss: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export function PRCelebration({
  exerciseName,
  newWeight,
  previousBest,
  unit,
  onDismiss,
}: PRCelebrationProps) {
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Entrance animation
    scale.value = withSpring(1, { damping: 12, stiffness: 100 });
    opacity.value = withTiming(1, { duration: 200 });

    // Auto-dismiss after duration
    opacity.value = withDelay(
      PR_CELEBRATION_DURATION,
      withTiming(0, { duration: 300 }, (finished) => {
        if (finished) {
          runOnJS(onDismiss)();
        }
      })
    );
  }, []);

  const animatedContent = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const animatedOverlay = useAnimatedStyle(() => ({
    opacity: opacity.value * 0.7,
  }));

  const handleDismiss = () => {
    opacity.value = withTiming(0, { duration: 150 }, (finished) => {
      if (finished) {
        runOnJS(onDismiss)();
      }
    });
  };

  return (
    <Pressable style={s.wrapper} onPress={handleDismiss}>
      <Animated.View style={[s.overlay, animatedOverlay]} />
      <Animated.View style={[s.content, animatedContent]}>
        <Text style={s.title}>NEW PR!</Text>
        <Text style={s.exerciseName}>{exerciseName}</Text>
        <Text style={s.newWeight}>
          {newWeight} {unit}
        </Text>
        {previousBest !== null ? (
          <Text style={s.previousBest}>
            Previous best: {previousBest} {unit}
          </Text>
        ) : (
          <Text style={s.previousBest}>First PR!</Text>
        )}
        <Text style={s.tapHint}>Tap to dismiss</Text>
      </Animated.View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  wrapper: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.black,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  title: {
    color: colors.accent,
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: 4,
    marginBottom: 16,
  },
  exerciseName: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  newWeight: {
    color: colors.textPrimary,
    fontSize: 36,
    fontWeight: '800',
    marginBottom: 12,
  },
  previousBest: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
  tapHint: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 24,
  },
});
