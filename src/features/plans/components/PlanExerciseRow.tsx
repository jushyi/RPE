import React from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import { MuscleGroupBadge } from '@/features/exercises/components/MuscleGroupBadge';
import { DEFAULT_TARGET_SET, WEIGHT_PROGRESSION_OPTIONS } from '../constants';
import type { TargetSet, PlanDayExercise } from '../types';
import { SetRow } from './SetRow';

interface PlanExerciseRowProps {
  exercise: PlanDayExercise;
  isEditing: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onSetsChange: (sets: TargetSet[]) => void;
  onNotesChange: (notes: string | null) => void;
  onUnitChange: (unit: 'kg' | 'lbs' | null) => void;
  onWeightProgressionChange: (mode: 'manual' | 'carry_previous') => void;
  onRemove: () => void;
}

const UNIT_OPTIONS: { value: 'kg' | 'lbs' | null; label: string }[] = [
  { value: null, label: 'Default' },
  { value: 'kg', label: 'kg' },
  { value: 'lbs', label: 'lbs' },
];

export const PlanExerciseRow = React.memo(function PlanExerciseRow({
  exercise,
  isEditing,
  collapsed = false,
  onToggleCollapse,
  onSetsChange,
  onNotesChange,
  onUnitChange,
  onWeightProgressionChange,
  onRemove,
}: PlanExerciseRowProps) {
  const exerciseInfo = exercise.exercise;
  const muscleGroups: string[] = (exerciseInfo as any)?.muscle_groups ?? ((exerciseInfo as any)?.muscle_group ? [(exerciseInfo as any).muscle_group] : []);

  const handleSetChange = (index: number, updated: TargetSet) => {
    const newSets = [...exercise.target_sets];
    newSets[index] = updated;
    onSetsChange(newSets);
  };

  const handleRemoveSet = (index: number) => {
    const newSets = exercise.target_sets.filter((_, i) => i !== index);
    onSetsChange(newSets);
  };

  const handleAddSet = () => {
    onSetsChange([...exercise.target_sets, { ...DEFAULT_TARGET_SET }]);
  };

  // Collapsed summary view (editing mode, but collapsed)
  if (isEditing && collapsed) {
    return (
      <View style={s.container}>
        {/* Header: exercise name + badges + edit button */}
        <View style={s.header}>
          <View style={s.headerInfo}>
            <Text style={s.name}>{exerciseInfo?.name ?? 'Unknown Exercise'}</Text>
            <View style={s.badges}>
              {muscleGroups.map((group: string) => (
                <MuscleGroupBadge key={group} muscleGroup={group as any} />
              ))}
            </View>
          </View>
          {onToggleCollapse && (
            <Pressable onPress={onToggleCollapse} hitSlop={8} style={s.editBtn}>
              <Ionicons name="create-outline" size={18} color={colors.accent} />
            </Pressable>
          )}
        </View>

        {/* Sets summary table */}
        {exercise.target_sets.length > 0 && (
          <View style={s.summaryTable}>
            <View style={s.summaryHeaderRow}>
              <Text style={[s.summaryHeaderCell, s.summarySetNumCol]}>Set</Text>
              <Text style={[s.summaryHeaderCell, s.summarySetValueCol]}>Weight</Text>
              <Text style={[s.summaryHeaderCell, s.summarySetValueCol]}>Reps</Text>
              <Text style={[s.summaryHeaderCell, s.summarySetValueCol]}>RPE</Text>
            </View>
            {exercise.target_sets.map((set, i) => (
              <View key={i} style={s.summaryRow}>
                <Text style={[s.summaryCell, s.summarySetNumCol]}>{i + 1}</Text>
                <Text style={[s.summaryCell, s.summarySetValueCol]}>{set.weight || '--'}</Text>
                <Text style={[s.summaryCell, s.summarySetValueCol]}>{set.reps || '--'}</Text>
                <Text style={[s.summaryCell, s.summarySetValueCol]}>{set.rpe ?? '--'}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Notes */}
        {exercise.notes && (
          <Text style={s.summaryNotes}>{exercise.notes}</Text>
        )}
      </View>
    );
  }

  return (
    <View style={s.container}>
      {/* Header: exercise name + badges + remove */}
      <View style={s.header}>
        <View style={s.headerInfo}>
          <Text style={s.name}>{exerciseInfo?.name ?? 'Unknown Exercise'}</Text>
          <View style={s.badges}>
            {muscleGroups.map((group: string) => (
              <MuscleGroupBadge key={group} muscleGroup={group as any} />
            ))}
          </View>
        </View>
        {isEditing && (
          <Pressable onPress={onRemove} hitSlop={8} style={s.removeBtn}>
            <Ionicons name="trash-outline" size={20} color={colors.error} />
          </Pressable>
        )}
      </View>

      {/* Sets */}
      {exercise.target_sets.map((set, i) => (
        <SetRow
          key={i}
          index={i}
          set={set}
          onChange={(updated) => handleSetChange(i, updated)}
          onRemove={() => handleRemoveSet(i)}
        />
      ))}

      {isEditing && (
        <Pressable onPress={handleAddSet} style={s.addSetBtn}>
          <Ionicons name="add-circle-outline" size={16} color={colors.accent} />
          <Text style={s.addSetText}>Add Set</Text>
        </Pressable>
      )}

      {/* Notes */}
      {isEditing && (
        <TextInput
          style={s.notesInput}
          placeholder="Notes (optional)"
          placeholderTextColor={colors.textMuted}
          value={exercise.notes ?? ''}
          onChangeText={(v) => onNotesChange(v || null)}
        />
      )}

      {/* Unit override */}
      {isEditing && (
        <View style={s.segmentSection}>
          <Text style={s.segmentLabel}>Unit</Text>
          <View style={s.segmentRow}>
            {UNIT_OPTIONS.map((opt) => {
              const active = exercise.unit_override === opt.value;
              return (
                <Pressable
                  key={opt.label}
                  onPress={() => onUnitChange(opt.value)}
                  style={[s.segment, active && s.segmentActive]}
                >
                  <Text style={[s.segmentText, active && s.segmentTextActive]}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {/* Weight progression */}
      {isEditing && (
        <View style={s.segmentSection}>
          <Text style={s.segmentLabel}>Weight Progression</Text>
          <View style={s.segmentRow}>
            {WEIGHT_PROGRESSION_OPTIONS.map((opt) => {
              const active = exercise.weight_progression === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => onWeightProgressionChange(opt.value)}
                  style={[s.segment, active && s.segmentActive]}
                >
                  <Text style={[s.segmentText, active && s.segmentTextActive]}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={s.segmentDesc}>
            {WEIGHT_PROGRESSION_OPTIONS.find((o) => o.value === exercise.weight_progression)?.description}
          </Text>
        </View>
      )}

      {/* Done button */}
      {isEditing && onToggleCollapse && (
        <Pressable onPress={onToggleCollapse} style={s.doneBtn}>
          <Ionicons name="checkmark-circle-outline" size={16} color={colors.success} />
          <Text style={s.doneBtnText}>Done</Text>
        </Pressable>
      )}
    </View>
  );
});

const s = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.surfaceElevated,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerInfo: {
    flex: 1,
  },
  name: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  removeBtn: {
    padding: 4,
  },
  addSetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
  },
  addSetText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '600',
  },
  notesInput: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: colors.textPrimary,
    fontSize: 13,
    marginTop: 8,
  },
  segmentSection: {
    marginTop: 10,
  },
  segmentLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: colors.accent,
  },
  segmentText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: colors.white,
  },
  segmentDesc: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 4,
    fontStyle: 'italic',
  },
  // Done button
  doneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 8,
    paddingVertical: 10,
  },
  doneBtnText: {
    color: colors.success,
    fontSize: 14,
    fontWeight: '600',
  },
  // Edit button (collapsed mode)
  editBtn: {
    padding: 4,
  },
  // Summary table (collapsed mode)
  summaryTable: {
    marginTop: 4,
  },
  summaryHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceElevated,
    paddingBottom: 4,
    marginBottom: 2,
  },
  summaryHeaderCell: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    paddingVertical: 3,
  },
  summaryCell: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  summarySetNumCol: {
    width: 36,
  },
  summarySetValueCol: {
    flex: 1,
    textAlign: 'center',
  },
  summaryNotes: {
    color: colors.textMuted,
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 6,
  },
});
