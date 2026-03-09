import React, { useCallback, useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import { DEFAULT_DAY_NAMES, WEEKDAY_LABELS, DEFAULT_TARGET_SET } from '../constants';
import type { TargetSet } from '../types';
import type { Exercise } from '@/features/exercises/types';
import { PlanExerciseRow } from './PlanExerciseRow';
import { ExercisePicker } from './ExercisePicker';

export interface DaySlotExercise {
  tempId: string;
  exercise_id: string;
  exercise: { id: string; name: string; muscle_groups?: string[]; muscle_group?: string; equipment: string };
  target_sets: TargetSet[];
  notes: string | null;
  unit_override: 'kg' | 'lbs' | null;
  weight_progression: 'manual' | 'carry_previous';
}

export interface DaySlot {
  tempId: string;
  day_name: string;
  weekday: number | null;
  exercises: DaySlotExercise[];
}

interface DaySlotEditorProps {
  days: DaySlot[];
  onChange: (days: DaySlot[]) => void;
}

let _tempIdCounter = 0;
export function makeTempId() {
  return `temp_${Date.now()}_${++_tempIdCounter}`;
}

export function DaySlotEditor({ days, onChange }: DaySlotEditorProps) {
  const pickerRef = useRef<BottomSheetModal>(null);
  const activeDayIndexRef = useRef<number>(0);
  const [reorderingDayIndex, setReorderingDayIndex] = useState<number | null>(null);

  const handleAddDay = () => {
    const nextName = DEFAULT_DAY_NAMES[days.length] ?? `Day ${days.length + 1}`;
    onChange([...days, { tempId: makeTempId(), day_name: nextName, weekday: null, exercises: [] }]);
  };

  const handleRemoveDay = (index: number) => {
    if (reorderingDayIndex === index) setReorderingDayIndex(null);
    onChange(days.filter((_, i) => i !== index));
  };

  const handleDayNameChange = (index: number, name: string) => {
    const updated = [...days];
    updated[index] = { ...updated[index], day_name: name };
    onChange(updated);
  };

  const handleWeekdayChange = (index: number, weekday: number | null) => {
    const updated = [...days];
    updated[index] = { ...updated[index], weekday };
    onChange(updated);
  };

  const handleOpenExercisePicker = (dayIndex: number) => {
    activeDayIndexRef.current = dayIndex;
    pickerRef.current?.present();
  };

  const handleExerciseSelected = useCallback(
    (exercise: Exercise) => {
      const dayIndex = activeDayIndexRef.current;
      const updated = [...days];
      const day = { ...updated[dayIndex] };
      const newExercise: DaySlotExercise = {
        tempId: makeTempId(),
        exercise_id: exercise.id,
        exercise: {
          id: exercise.id,
          name: exercise.name,
          muscle_groups: exercise.muscle_groups,
          equipment: exercise.equipment,
        },
        target_sets: [{ ...DEFAULT_TARGET_SET }],
        notes: null,
        unit_override: null,
        weight_progression: 'manual',
      };
      day.exercises = [...day.exercises, newExercise];
      updated[dayIndex] = day;
      onChange(updated);
    },
    [days, onChange]
  );

  const updateExercise = (dayIndex: number, exIndex: number, updates: Partial<DaySlotExercise>) => {
    const updated = [...days];
    const day = { ...updated[dayIndex] };
    const exercises = [...day.exercises];
    exercises[exIndex] = { ...exercises[exIndex], ...updates };
    day.exercises = exercises;
    updated[dayIndex] = day;
    onChange(updated);
  };

  const removeExercise = (dayIndex: number, exIndex: number) => {
    const updated = [...days];
    const day = { ...updated[dayIndex] };
    day.exercises = day.exercises.filter((_, i) => i !== exIndex);
    updated[dayIndex] = day;
    onChange(updated);
  };

  const moveExercise = (dayIndex: number, fromIndex: number, direction: 'up' | 'down') => {
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    const updated = [...days];
    const day = { ...updated[dayIndex] };
    const exercises = [...day.exercises];
    const [moved] = exercises.splice(fromIndex, 1);
    exercises.splice(toIndex, 0, moved);
    day.exercises = exercises;
    updated[dayIndex] = day;
    onChange(updated);
  };

  const toggleReorder = (dayIndex: number) => {
    setReorderingDayIndex((prev) => (prev === dayIndex ? null : dayIndex));
  };

  return (
    <View>
      {days.map((day, dayIndex) => {
        const isReordering = reorderingDayIndex === dayIndex;

        return (
          <View key={day.tempId} style={s.dayCard}>
            {/* Day header */}
            <View style={s.dayHeader}>
              <TextInput
                style={s.dayNameInput}
                value={day.day_name}
                onChangeText={(v) => handleDayNameChange(dayIndex, v)}
                placeholder="Day name"
                placeholderTextColor={colors.textMuted}
              />
              {days.length > 1 && (
                <Pressable onPress={() => handleRemoveDay(dayIndex)} hitSlop={8}>
                  <Ionicons name="close-circle" size={22} color={colors.error} />
                </Pressable>
              )}
            </View>

            {/* Weekday picker */}
            <View style={s.weekdayRow}>
              <Pressable
                onPress={() => handleWeekdayChange(dayIndex, null)}
                style={[s.weekdayChip, day.weekday === null && s.weekdayChipActive]}
              >
                <Text style={[s.weekdayText, day.weekday === null && s.weekdayTextActive]}>None</Text>
              </Pressable>
              {WEEKDAY_LABELS.map((label, wdIndex) => (
                <Pressable
                  key={label}
                  onPress={() => handleWeekdayChange(dayIndex, wdIndex)}
                  style={[s.weekdayChip, day.weekday === wdIndex && s.weekdayChipActive]}
                >
                  <Text style={[s.weekdayText, day.weekday === wdIndex && s.weekdayTextActive]}>
                    {label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Reorder toggle (only show if 2+ exercises) */}
            {day.exercises.length >= 2 && (
              <Pressable onPress={() => toggleReorder(dayIndex)} style={s.reorderToggle}>
                <Ionicons
                  name={isReordering ? 'checkmark-circle' : 'reorder-three-outline'}
                  size={18}
                  color={isReordering ? colors.success : colors.textMuted}
                />
                <Text style={[s.reorderToggleText, isReordering && { color: colors.success }]}>
                  {isReordering ? 'Done' : 'Reorder'}
                </Text>
              </Pressable>
            )}

            {/* Exercise list */}
            {isReordering ? (
              // Compact reorder mode
              day.exercises.map((item, exIndex) => (
                <View key={item.tempId} style={s.reorderRow}>
                  <View style={s.reorderButtons}>
                    <Pressable
                      onPress={() => moveExercise(dayIndex, exIndex, 'up')}
                      disabled={exIndex === 0}
                      hitSlop={6}
                    >
                      <Ionicons
                        name="chevron-up"
                        size={20}
                        color={exIndex === 0 ? colors.surfaceElevated : colors.textPrimary}
                      />
                    </Pressable>
                    <Pressable
                      onPress={() => moveExercise(dayIndex, exIndex, 'down')}
                      disabled={exIndex === day.exercises.length - 1}
                      hitSlop={6}
                    >
                      <Ionicons
                        name="chevron-down"
                        size={20}
                        color={exIndex === day.exercises.length - 1 ? colors.surfaceElevated : colors.textPrimary}
                      />
                    </Pressable>
                  </View>
                  <Text style={s.reorderName} numberOfLines={1}>{item.exercise.name}</Text>
                  <Text style={s.reorderIndex}>{exIndex + 1}</Text>
                </View>
              ))
            ) : (
              // Normal edit mode - plain Views, no gesture conflicts
              day.exercises.map((item, exIndex) => (
                <PlanExerciseRow
                  key={item.tempId}
                  exercise={{
                    id: item.tempId,
                    plan_day_id: '',
                    exercise_id: item.exercise_id,
                    sort_order: exIndex,
                    target_sets: item.target_sets,
                    notes: item.notes,
                    unit_override: item.unit_override,
                    weight_progression: item.weight_progression,
                    created_at: '',
                    exercise: item.exercise as any,
                  }}
                  isEditing={true}
                  onSetsChange={(sets) => updateExercise(dayIndex, exIndex, { target_sets: sets })}
                  onNotesChange={(notes) => updateExercise(dayIndex, exIndex, { notes })}
                  onUnitChange={(unit) => updateExercise(dayIndex, exIndex, { unit_override: unit })}
                  onWeightProgressionChange={(mode) => updateExercise(dayIndex, exIndex, { weight_progression: mode })}
                  onRemove={() => removeExercise(dayIndex, exIndex)}
                />
              ))
            )}

            {/* Add Exercise button (hidden during reorder) */}
            {!isReordering && (
              <Pressable
                onPress={() => handleOpenExercisePicker(dayIndex)}
                style={s.addExerciseBtn}
              >
                <Ionicons name="add-circle-outline" size={18} color={colors.accent} />
                <Text style={s.addExerciseText}>Add Exercise</Text>
              </Pressable>
            )}
          </View>
        );
      })}

      {/* Add Day button */}
      <Pressable onPress={handleAddDay} style={s.addDayBtn}>
        <Ionicons name="add" size={20} color={colors.accent} />
        <Text style={s.addDayText}>Add Day</Text>
      </Pressable>

      <ExercisePicker ref={pickerRef} onSelect={handleExerciseSelected} />
    </View>
  );
}

const s = StyleSheet.create({
  dayCard: {
    backgroundColor: colors.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.surfaceElevated,
    padding: 14,
    marginBottom: 14,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dayNameInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    paddingVertical: 4,
    marginRight: 8,
  },
  weekdayRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 12,
  },
  weekdayChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.surfaceElevated,
  },
  weekdayChipActive: {
    backgroundColor: colors.accent,
  },
  weekdayText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  weekdayTextActive: {
    color: '#ffffff',
  },
  reorderToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  reorderToggleText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  reorderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
  },
  reorderButtons: {
    marginRight: 10,
    gap: 2,
  },
  reorderName: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  reorderIndex: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
  },
  addExerciseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    marginTop: 4,
  },
  addExerciseText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  addDayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.accent,
    borderStyle: 'dashed',
    marginBottom: 20,
  },
  addDayText: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: '600',
  },
});
