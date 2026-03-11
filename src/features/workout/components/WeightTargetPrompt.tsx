/**
 * Post-session target prompt for manual progression exercises.
 * Allows users to set target sets, reps, weight, and RPE for next session.
 */
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase/client';
import type { SessionSummary } from '@/features/workout/types';

interface Props {
  exercises: SessionSummary['exercises_with_manual_progression'];
  planDayId: string | null;
  onDone: () => void;
}

interface ExerciseTargets {
  sets: string;
  reps: string;
  weight: string;
  rpe: string;
}

export default function WeightTargetPrompt({ exercises, planDayId, onDone }: Props) {
  const [targets, setTargets] = useState<Record<string, ExerciseTargets>>(() => {
    const initial: Record<string, ExerciseTargets> = {};
    for (const ex of exercises) {
      initial[ex.exercise_id] = {
        sets: String(ex.sets_completed),
        reps: String(ex.last_reps),
        weight: String(ex.last_weight),
        rpe: '',
      };
    }
    return initial;
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedTargets, setSavedTargets] = useState<Record<string, ExerciseTargets>>({});

  if (exercises.length === 0) return null;

  const updateField = (exerciseId: string, field: keyof ExerciseTargets, value: string) => {
    setTargets((prev) => ({
      ...prev,
      [exerciseId]: { ...prev[exerciseId], [field]: value },
    }));
  };

  const handleSave = async () => {
    if (!planDayId) {
      onDone();
      return;
    }

    setSaving(true);
    try {
      for (const exercise of exercises) {
        const t = targets[exercise.exercise_id];
        if (!t) continue;

        const weight = parseFloat(t.weight);
        const reps = parseInt(t.reps, 10);
        const sets = parseInt(t.sets, 10);
        const rpe = t.rpe ? parseFloat(t.rpe) : null;

        if (isNaN(weight) || weight <= 0) continue;
        if (isNaN(sets) || sets <= 0) continue;

        const targetSets = Array.from({ length: sets }, () => ({
          weight,
          reps: isNaN(reps) ? 0 : reps,
          unit: exercise.unit,
          ...(rpe !== null && !isNaN(rpe) ? { rpe } : {}),
        }));

        await (supabase as any)
          .from('plan_day_exercises')
          .update({ target_sets: targetSets })
          .eq('plan_day_id', planDayId)
          .eq('exercise_id', exercise.exercise_id);
      }
    } catch {
      // Silently ignore errors -- targets are optional
    } finally {
      setSaving(false);
      setSavedTargets({ ...targets });
      setSaved(true);
      Keyboard.dismiss();
    }
  };

  if (saved) {
    return (
      <View style={s.container}>
        <View style={s.header}>
          <Ionicons name="checkmark-circle-outline" size={20} color={colors.success} />
          <Text style={s.title}>Targets Saved</Text>
        </View>
        {exercises.map((exercise) => {
          const t = savedTargets[exercise.exercise_id];
          if (!t) return null;
          const parts = [`${t.sets}x${t.reps}`];
          if (t.weight) parts.push(`@ ${t.weight} ${exercise.unit}`);
          if (t.rpe) parts.push(`RPE ${t.rpe}`);
          return (
            <View key={exercise.exercise_id} style={s.savedRow}>
              <Text style={s.savedExName} numberOfLines={1}>{exercise.exercise_name}</Text>
              <Text style={s.savedValues}>{parts.join(' ')}</Text>
            </View>
          );
        })}
        <Pressable
          onPress={() => setSaved(false)}
          style={({ pressed }) => [s.editButton, pressed && s.buttonPressed]}
        >
          <Ionicons name="pencil-outline" size={16} color={colors.accent} />
          <Text style={s.editText}>Edit</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Ionicons name="trending-up-outline" size={20} color={colors.accent} />
        <Text style={s.title}>Set Targets for Next Session</Text>
      </View>

      {exercises.map((exercise) => {
        const t = targets[exercise.exercise_id] || { sets: '', reps: '', weight: '', rpe: '' };
        return (
          <View key={exercise.exercise_id} style={s.exerciseBlock}>
            <Text style={s.exerciseName}>{exercise.exercise_name}</Text>
            <Text style={s.lastPerf}>
              Last: {exercise.sets_completed} sets x {exercise.last_reps} reps @ {exercise.last_weight} {exercise.unit}
            </Text>
            <View style={s.inputRow}>
              <View style={s.fieldGroup}>
                <Text style={s.fieldLabel}>Sets</Text>
                <TextInput
                  style={s.input}
                  keyboardType="number-pad"
                  placeholder="3"
                  placeholderTextColor={colors.textMuted}
                  value={t.sets}
                  onChangeText={(v) => updateField(exercise.exercise_id, 'sets', v)}
                />
              </View>
              <View style={s.fieldGroup}>
                <Text style={s.fieldLabel}>Reps</Text>
                <TextInput
                  style={s.input}
                  keyboardType="number-pad"
                  placeholder="8"
                  placeholderTextColor={colors.textMuted}
                  value={t.reps}
                  onChangeText={(v) => updateField(exercise.exercise_id, 'reps', v)}
                />
              </View>
              <View style={s.fieldGroup}>
                <Text style={s.fieldLabel}>Weight</Text>
                <TextInput
                  style={[s.input, s.inputWide]}
                  keyboardType="decimal-pad"
                  placeholder="135"
                  placeholderTextColor={colors.textMuted}
                  value={t.weight}
                  onChangeText={(v) => updateField(exercise.exercise_id, 'weight', v)}
                />
              </View>
              <View style={s.fieldGroup}>
                <Text style={s.fieldLabel}>RPE</Text>
                <TextInput
                  style={s.input}
                  keyboardType="decimal-pad"
                  placeholder="--"
                  placeholderTextColor={colors.textMuted}
                  value={t.rpe}
                  onChangeText={(v) => updateField(exercise.exercise_id, 'rpe', v)}
                />
              </View>
            </View>
          </View>
        );
      })}

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
  exerciseBlock: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceElevated,
  },
  exerciseName: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '500',
  },
  lastPerf: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 2,
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  fieldGroup: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  fieldLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceElevated,
    width: '100%',
  },
  inputWide: {
    minWidth: 60,
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
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  savedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceElevated,
  },
  savedExName: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  savedValues: {
    color: colors.textMuted,
    fontSize: 13,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
    paddingVertical: 8,
  },
  editText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
  },
});
