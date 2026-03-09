import React, { useCallback, useRef } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
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

  const handleAddDay = () => {
    const nextName = DEFAULT_DAY_NAMES[days.length] ?? `Day ${days.length + 1}`;
    onChange([...days, { tempId: makeTempId(), day_name: nextName, weekday: null, exercises: [] }]);
  };

  const handleRemoveDay = (index: number) => {
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

  const handleDragEnd = (dayIndex: number, data: DaySlotExercise[]) => {
    const updated = [...days];
    updated[dayIndex] = { ...updated[dayIndex], exercises: data };
    onChange(updated);
  };

  return (
    <View>
      {days.map((day, dayIndex) => (
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

          {/* Exercise list (draggable) */}
          {day.exercises.length > 0 && (
            <DraggableFlatList
              data={day.exercises}
              keyExtractor={(item) => item.tempId}
              onDragEnd={({ data }) => handleDragEnd(dayIndex, data)}
              renderItem={({ item, drag, isActive }: RenderItemParams<DaySlotExercise>) => (
                <ScaleDecorator>
                  <Pressable onLongPress={drag} disabled={isActive}>
                    <PlanExerciseRow
                      exercise={{
                        id: item.tempId,
                        plan_day_id: '',
                        exercise_id: item.exercise_id,
                        sort_order: 0,
                        target_sets: item.target_sets,
                        notes: item.notes,
                        unit_override: item.unit_override,
                        weight_progression: item.weight_progression,
                        created_at: '',
                        exercise: item.exercise as any,
                      }}
                      isEditing={true}
                      onSetsChange={(sets) =>
                        updateExercise(dayIndex, day.exercises.indexOf(item), { target_sets: sets })
                      }
                      onNotesChange={(notes) =>
                        updateExercise(dayIndex, day.exercises.indexOf(item), { notes })
                      }
                      onUnitChange={(unit) =>
                        updateExercise(dayIndex, day.exercises.indexOf(item), { unit_override: unit })
                      }
                      onWeightProgressionChange={(mode) =>
                        updateExercise(dayIndex, day.exercises.indexOf(item), { weight_progression: mode })
                      }
                      onRemove={() =>
                        removeExercise(dayIndex, day.exercises.indexOf(item))
                      }
                    />
                  </Pressable>
                </ScaleDecorator>
              )}
              scrollEnabled={false}
            />
          )}

          {/* Add Exercise button */}
          <Pressable
            onPress={() => handleOpenExercisePicker(dayIndex)}
            style={s.addExerciseBtn}
          >
            <Ionicons name="add-circle-outline" size={18} color={colors.accent} />
            <Text style={s.addExerciseText}>Add Exercise</Text>
          </Pressable>
        </View>
      ))}

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
