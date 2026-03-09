/**
 * Post-session weight target prompt for manual progression exercises.
 * Allows users to set target weight for next session.
 */
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase/client';
import type { SessionSummary } from '@/features/workout/types';

interface Props {
  exercises: SessionSummary['exercises_with_manual_progression'];
  planDayId: string | null;
  onDone: () => void;
}

export default function WeightTargetPrompt({ exercises, planDayId, onDone }: Props) {
  const [targets, setTargets] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  if (exercises.length === 0) return null;

  const handleSave = async () => {
    if (!planDayId) {
      onDone();
      return;
    }

    setSaving(true);
    try {
      // Update target_sets JSONB for each exercise in plan_day_exercises
      for (const exercise of exercises) {
        const targetWeight = parseFloat(targets[exercise.exercise_id] || '');
        if (isNaN(targetWeight) || targetWeight <= 0) continue;

        await (supabase as any)
          .from('plan_day_exercises')
          .update({
            target_sets: [{ weight: targetWeight, reps: 0, unit: exercise.unit }],
          })
          .eq('plan_day_id', planDayId)
          .eq('exercise_id', exercise.exercise_id);
      }
    } catch {
      // Silently ignore errors -- targets are optional
    } finally {
      setSaving(false);
      onDone();
    }
  };

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Ionicons name="trending-up-outline" size={20} color={colors.accent} />
        <Text style={s.title}>Set Targets for Next Session</Text>
      </View>

      {exercises.map((exercise) => (
        <View key={exercise.exercise_id} style={s.exerciseRow}>
          <View style={s.exerciseInfo}>
            <Text style={s.exerciseName}>{exercise.exercise_name}</Text>
            <Text style={s.lastWeight}>
              Last: {exercise.last_weight} {exercise.unit}
            </Text>
          </View>
          <View style={s.inputContainer}>
            <TextInput
              style={s.input}
              keyboardType="decimal-pad"
              placeholder="Target"
              placeholderTextColor={colors.textMuted}
              value={targets[exercise.exercise_id] || ''}
              onChangeText={(text) =>
                setTargets((prev) => ({
                  ...prev,
                  [exercise.exercise_id]: text,
                }))
              }
            />
            <Text style={s.unitLabel}>{exercise.unit}</Text>
          </View>
        </View>
      ))}

      <View style={s.actions}>
        <Pressable
          onPress={onDone}
          style={({ pressed }) => [s.skipButton, pressed && s.buttonPressed]}
        >
          <Text style={s.skipText}>Skip</Text>
        </Pressable>
        <Pressable
          onPress={handleSave}
          disabled={saving}
          style={({ pressed }) => [
            s.saveButton,
            pressed && s.buttonPressed,
            saving && s.buttonDisabled,
          ]}
        >
          <Text style={s.saveText}>
            {saving ? 'Saving...' : 'Save Targets'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: colors.surfaceElevated,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  exerciseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceElevated,
  },
  exerciseInfo: {
    flex: 1,
    marginRight: 12,
  },
  exerciseName: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '500',
  },
  lastWeight: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    width: 80,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceElevated,
  },
  unitLabel: {
    color: colors.textMuted,
    fontSize: 13,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  skipButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceElevated,
  },
  saveButton: {
    flex: 1,
    backgroundColor: colors.accent,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  skipText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  saveText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
});
