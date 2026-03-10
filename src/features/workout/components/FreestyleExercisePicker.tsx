import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, FlatList, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import { useExercises } from '@/features/exercises/hooks/useExercises';
import { ExerciseFilterBar } from '@/features/exercises/components/ExerciseFilterBar';
import { ExerciseListItem } from '@/features/exercises/components/ExerciseListItem';
import type { Exercise, MuscleGroup, Equipment } from '@/features/exercises/types';

interface FreestyleExercisePickerProps {
  visible: boolean;
  onSelect: (exercise: Exercise) => void;
  onClose: () => void;
}

export function FreestyleExercisePicker({ visible, onSelect, onClose }: FreestyleExercisePickerProps) {
  const { exercises, fetchExercises } = useExercises();

  useEffect(() => { fetchExercises(); }, []);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<MuscleGroup | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);

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
