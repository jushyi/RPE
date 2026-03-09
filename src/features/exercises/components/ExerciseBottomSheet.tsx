import React, { forwardRef, useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Alert } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetTextInput,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod/v4';
import { zodResolver } from '@hookform/resolvers/zod';
import { colors } from '@/constants/theme';
import { useExercises } from '../hooks/useExercises';
import { MUSCLE_GROUPS, MUSCLE_GROUP_COLORS } from '../constants/muscleGroups';
import { EQUIPMENT_TYPES } from '../constants/equipmentTypes';
import type { Exercise, MuscleGroup, Equipment } from '../types';

const exerciseSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  muscle_group: z.string().min(1, 'Muscle group is required'),
  equipment: z.string().min(1, 'Equipment is required'),
  notes: z.string().optional(),
});

type ExerciseFormData = z.infer<typeof exerciseSchema>;

interface ExerciseBottomSheetProps {
  exerciseToEdit: Exercise | null;
  onSave: () => void;
}

export const ExerciseBottomSheet = forwardRef<BottomSheetModal, ExerciseBottomSheetProps>(
  ({ exerciseToEdit, onSave }, ref) => {
    const { exercises, createExercise, updateExercise } = useExercises();
    const [duplicateWarning, setDuplicateWarning] = useState(false);
    const snapPoints = useMemo(() => ['70%'], []);

    const isEditMode = !!exerciseToEdit;

    const {
      control,
      handleSubmit,
      reset,
      watch,
      setValue,
      formState: { errors },
    } = useForm<ExerciseFormData>({
      resolver: zodResolver(exerciseSchema),
      defaultValues: {
        name: '',
        muscle_group: '',
        equipment: '',
        notes: '',
      },
    });

    const nameValue = watch('name');

    // Check for duplicate names
    useEffect(() => {
      if (!nameValue?.trim()) {
        setDuplicateWarning(false);
        return;
      }
      const trimmed = nameValue.trim().toLowerCase();
      const hasDuplicate = exercises.some(
        (e) =>
          e.name.toLowerCase() === trimmed &&
          (!exerciseToEdit || e.id !== exerciseToEdit.id)
      );
      setDuplicateWarning(hasDuplicate);
    }, [nameValue, exercises, exerciseToEdit]);

    // Pre-fill form when editing
    useEffect(() => {
      if (exerciseToEdit) {
        reset({
          name: exerciseToEdit.name,
          muscle_group: exerciseToEdit.muscle_group,
          equipment: exerciseToEdit.equipment,
          notes: exerciseToEdit.notes ?? '',
        });
      } else {
        reset({
          name: '',
          muscle_group: '',
          equipment: '',
          notes: '',
        });
      }
    }, [exerciseToEdit, reset]);

    const onSubmit = useCallback(
      async (data: ExerciseFormData) => {
        try {
          if (isEditMode && exerciseToEdit) {
            await updateExercise(exerciseToEdit.id, {
              name: data.name.trim(),
              muscle_group: data.muscle_group as MuscleGroup,
              equipment: data.equipment as Equipment,
              notes: data.notes?.trim() || null,
            });
          } else {
            await createExercise({
              name: data.name.trim(),
              muscle_group: data.muscle_group as MuscleGroup,
              equipment: data.equipment as Equipment,
              notes: data.notes?.trim() || null,
            });
          }
          onSave();
          (ref as React.RefObject<BottomSheetModal>)?.current?.dismiss();
        } catch (err) {
          Alert.alert('Error', 'Failed to save exercise. Please try again.');
        }
      },
      [isEditMode, exerciseToEdit, createExercise, updateExercise, onSave, ref]
    );

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={snapPoints}
        backgroundStyle={s.background}
        handleIndicatorStyle={s.handleIndicator}
        keyboardBehavior="interactive"
        android_keyboardInputMode="adjustResize"
      >
        <BottomSheetScrollView contentContainerStyle={s.content}>
          <Text style={s.title}>
            {isEditMode ? 'Edit Exercise' : 'New Exercise'}
          </Text>

          {/* Name field */}
          <Text style={s.label}>Name</Text>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <BottomSheetTextInput
                style={[s.input, errors.name && s.inputError]}
                placeholder="Exercise name"
                placeholderTextColor={colors.textMuted}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                autoCapitalize="words"
              />
            )}
          />
          {errors.name && (
            <Text style={s.errorText}>{errors.name.message}</Text>
          )}
          {duplicateWarning && (
            <Text style={s.warningText}>
              An exercise with this name already exists
            </Text>
          )}

          {/* Muscle Group picker */}
          <Text style={s.label}>Muscle Group</Text>
          <Controller
            control={control}
            name="muscle_group"
            render={({ field: { value } }) => (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.chipRow}
              >
                {MUSCLE_GROUPS.map((group) => {
                  const isActive = value === group;
                  const groupColor = MUSCLE_GROUP_COLORS[group];
                  return (
                    <Pressable
                      key={group}
                      onPress={() => setValue('muscle_group', group)}
                      style={[
                        s.chip,
                        isActive
                          ? { backgroundColor: groupColor + 'CC' }
                          : s.chipInactive,
                      ]}
                    >
                      <Text
                        style={[
                          s.chipText,
                          isActive
                            ? { color: '#ffffff', fontWeight: '700' }
                            : { color: colors.textSecondary },
                        ]}
                      >
                        {group}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
          />
          {errors.muscle_group && (
            <Text style={s.errorText}>{errors.muscle_group.message}</Text>
          )}

          {/* Equipment picker */}
          <Text style={s.label}>Equipment</Text>
          <Controller
            control={control}
            name="equipment"
            render={({ field: { value } }) => (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.chipRow}
              >
                {EQUIPMENT_TYPES.map((equip) => {
                  const isActive = value === equip;
                  return (
                    <Pressable
                      key={equip}
                      onPress={() => setValue('equipment', equip)}
                      style={[
                        s.chip,
                        isActive ? s.chipEquipmentActive : s.chipInactive,
                      ]}
                    >
                      <Text
                        style={[
                          s.chipText,
                          isActive
                            ? { color: '#ffffff', fontWeight: '700' }
                            : { color: colors.textSecondary },
                        ]}
                      >
                        {equip}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
          />
          {errors.equipment && (
            <Text style={s.errorText}>{errors.equipment.message}</Text>
          )}

          {/* Notes field */}
          <Text style={s.label}>Notes (optional)</Text>
          <Controller
            control={control}
            name="notes"
            render={({ field: { onChange, onBlur, value } }) => (
              <BottomSheetTextInput
                style={[s.input, s.inputMultiline]}
                placeholder="Additional notes..."
                placeholderTextColor={colors.textMuted}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            )}
          />

          {/* Submit button */}
          <Pressable
            onPress={handleSubmit(onSubmit)}
            style={({ pressed }) => [s.submitButton, pressed && s.submitPressed]}
          >
            <Text style={s.submitText}>
              {isEditMode ? 'Save Changes' : 'Add Exercise'}
            </Text>
          </Pressable>
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  }
);

ExerciseBottomSheet.displayName = 'ExerciseBottomSheet';

const s = StyleSheet.create({
  background: {
    backgroundColor: colors.surface,
  },
  handleIndicator: {
    backgroundColor: colors.textMuted,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.surfaceElevated,
    color: colors.textPrimary,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inputMultiline: {
    minHeight: 80,
    paddingTop: 12,
  },
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: 4,
  },
  warningText: {
    color: colors.warning,
    fontSize: 12,
    marginTop: 4,
  },
  chipRow: {
    gap: 8,
    paddingVertical: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  chipInactive: {
    backgroundColor: colors.surfaceElevated,
  },
  chipEquipmentActive: {
    backgroundColor: colors.accent,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  submitPressed: {
    opacity: 0.8,
  },
  submitText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
