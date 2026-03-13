import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors } from '@/constants/theme';

export type CoachToggleValue = 'my-plans' | 'trainees';

interface CoachTraineeToggleProps {
  value: CoachToggleValue;
  onValueChange: (value: CoachToggleValue) => void;
}

export function CoachTraineeToggle({ value, onValueChange }: CoachTraineeToggleProps) {
  return (
    <View style={s.container}>
      <View style={s.toggle}>
        <Pressable
          style={[s.segment, value === 'my-plans' && s.segmentActive]}
          onPress={() => onValueChange('my-plans')}
        >
          <Text style={[s.segmentText, value === 'my-plans' && s.segmentTextActive]}>
            My Plans
          </Text>
        </Pressable>
        <Pressable
          style={[s.segment, value === 'trainees' && s.segmentActive]}
          onPress={() => onValueChange('trainees')}
        >
          <Text style={[s.segmentText, value === 'trainees' && s.segmentTextActive]}>
            Trainees
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 3,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  segmentActive: {
    backgroundColor: colors.accent,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  segmentTextActive: {
    color: colors.white,
  },
});
