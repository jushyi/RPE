import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, FlatList, Text, TextInput, ScrollView, StyleSheet, Pressable, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import { useExercises } from '@/features/exercises/hooks/useExercises';
import { ExerciseFilterBar } from '@/features/exercises/components/ExerciseFilterBar';
import { ExerciseListItem } from '@/features/exercises/components/ExerciseListItem';
import { MUSCLE_GROUPS, MUSCLE_GROUP_COLORS } from '@/features/exercises/constants/muscleGroups';
import { EQUIPMENT_TYPES } from '@/features/exercises/constants/equipmentTypes';
import type { Exercise, MuscleGroup, Equipment } from '@/features/exercises/types';

interface FreestyleExercisePickerProps {
  visible: boolean;
  onSelect: (exercise: Exercise) => void;
  onClose: () => void;
}

export function FreestyleExercisePicker({ visible, onSelect, onClose }: FreestyleExercisePickerProps) {
  const { exercises, fetchExercises, createExercise } = useExercises();

  useEffect(() => { fetchExercises(); }, []);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<MuscleGroup | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);

  // Quick create form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newMuscleGroups, setNewMuscleGroups] = useState<MuscleGroup[]>([]);
  const [newEquipment, setNewEquipment] = useState<Equipment | ''>('');
  const [isSaving, setIsSaving] = useState(false);

  const resetCreateForm = useCallback(() => {
    setNewName('');
    setNewMuscleGroups([]);
    setNewEquipment('');
    setShowCreateForm(false);
  }, []);

  const handleCreateExercise = useCallback(async () => {
    if (!newName.trim()) {
      Alert.alert('Validation', 'Exercise name is required.');
      return;
    }
    if (newMuscleGroups.length === 0) {
      Alert.alert('Validation', 'Select at least one muscle group.');
      return;
    }
    if (!newEquipment) {
      Alert.alert('Validation', 'Select an equipment type.');
      return;
    }
    setIsSaving(true);
    try {
      await createExercise({
        name: newName.trim(),
        muscle_groups: newMuscleGroups,
        equipment: newEquipment as Equipment,
        notes: null,
      });
      await fetchExercises(true);
      resetCreateForm();
    } catch (err) {
      Alert.alert('Error', 'Failed to create exercise. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [newName, newMuscleGroups, newEquipment, createExercise, fetchExercises, resetCreateForm]);

  const filteredExercises = useMemo(() => {
    let result = exercises;

    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      result = result.filter((e) => e.name.toLowerCase().includes(query));
    }

    if (selectedMuscleGroup) {
      result = result.filter((e) =>
        e.muscle_groups.includes(selectedMuscleGroup)
      );
    }

    if (selectedEquipment) {
      result = result.filter((e) => e.equipment === selectedEquipment);
    }

    return result;
  }, [exercises, searchQuery, selectedMuscleGroup, selectedEquipment]);

  const handleSelect = useCallback(
    (exercise: Exercise) => {
      onSelect(exercise);
      onClose();
      setSearchQuery('');
      setSelectedMuscleGroup(null);
      setSelectedEquipment(null);
    },
    [onSelect, onClose]
  );

  const renderItem = useCallback(
    ({ item }: { item: Exercise }) => (
      <ExerciseListItem exercise={item} onPress={() => handleSelect(item)} />
    ),
    [handleSelect]
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={s.container}>
        <View style={s.header}>
          <Text style={s.title}>Add Exercise</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={24} color={colors.textMuted} />
          </Pressable>
        </View>
        <ExerciseFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedMuscleGroup={selectedMuscleGroup}
          onMuscleGroupChange={setSelectedMuscleGroup}
          selectedEquipment={selectedEquipment}
          onEquipmentChange={setSelectedEquipment}
        />
        <Pressable
          style={s.createButton}
          onPress={() => setShowCreateForm((v) => !v)}
        >
          <Ionicons
            name={showCreateForm ? 'close-circle-outline' : 'add-circle-outline'}
            size={22}
            color={colors.accent}
          />
          <Text style={s.createButtonText}>
            {showCreateForm ? 'Cancel' : 'Create New Exercise'}
          </Text>
        </Pressable>
        {showCreateForm && (
          <View style={s.createForm}>
            <TextInput
              style={s.formInput}
              placeholder="Exercise name"
              placeholderTextColor={colors.textMuted}
              value={newName}
              onChangeText={setNewName}
              autoCapitalize="words"
            />
            <Text style={s.formLabel}>Muscle Groups</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.chipRow}
            >
              {MUSCLE_GROUPS.map((group) => {
                const isActive = newMuscleGroups.includes(group);
                const groupColor = MUSCLE_GROUP_COLORS[group];
                return (
                  <Pressable
                    key={group}
                    onPress={() => {
                      setNewMuscleGroups((prev) =>
                        isActive
                          ? prev.filter((g) => g !== group)
                          : [...prev, group]
                      );
                    }}
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
                          ? { color: colors.white, fontWeight: '700' }
                          : { color: colors.textSecondary },
                      ]}
                    >
                      {group}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <Text style={s.formLabel}>Equipment</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.chipRow}
            >
              {EQUIPMENT_TYPES.map((equip) => {
                const isActive = newEquipment === equip;
                return (
                  <Pressable
                    key={equip}
                    onPress={() => setNewEquipment(equip)}
                    style={[
                      s.chip,
                      isActive ? s.chipEquipmentActive : s.chipInactive,
                    ]}
                  >
                    <Text
                      style={[
                        s.chipText,
                        isActive
                          ? { color: colors.white, fontWeight: '700' }
                          : { color: colors.textSecondary },
                      ]}
                    >
                      {equip}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <View style={s.formActions}>
              <Pressable
                style={[s.saveButton, isSaving && s.saveButtonDisabled]}
                onPress={handleCreateExercise}
                disabled={isSaving}
              >
                <Text style={s.saveButtonText}>
                  {isSaving ? 'Saving...' : 'Save'}
                </Text>
              </Pressable>
              <Pressable onPress={resetCreateForm}>
                <Text style={s.cancelText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        )}
        <FlatList
          data={filteredExercises}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.list}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <Text style={s.emptyText}>No exercises found</Text>
          }
        />
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceElevated,
    marginBottom: 12,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: 'bold',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceElevated,
  },
  createButtonText: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: '600',
  },
  createForm: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceElevated,
  },
  formInput: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.surfaceElevated,
    color: colors.textPrimary,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  formLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 6,
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
  formActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 14,
  },
  saveButton: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  cancelText: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '600',
  },
  list: {
    paddingBottom: 40,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    paddingTop: 24,
  },
});
