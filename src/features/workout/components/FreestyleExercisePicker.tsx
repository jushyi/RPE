import React, { forwardRef, useCallback, useEffect, useMemo, useState } from 'react';
import { View, FlatList, Text, StyleSheet } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import { colors } from '@/constants/theme';
import { useExercises } from '@/features/exercises/hooks/useExercises';
import { ExerciseFilterBar } from '@/features/exercises/components/ExerciseFilterBar';
import { ExerciseListItem } from '@/features/exercises/components/ExerciseListItem';
import type { Exercise, MuscleGroup, Equipment } from '@/features/exercises/types';

interface FreestyleExercisePickerProps {
  onSelect: (exercise: Exercise) => void;
}

export const FreestyleExercisePicker = forwardRef<BottomSheetModal, FreestyleExercisePickerProps>(
  ({ onSelect }, ref) => {
    const { exercises, fetchExercises } = useExercises();
    const snapPoints = useMemo(() => ['75%'], []);

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
        (ref as React.RefObject<BottomSheetModal>)?.current?.dismiss();
        setSearchQuery('');
        setSelectedMuscleGroup(null);
        setSelectedEquipment(null);
      },
      [onSelect, ref]
    );

    const renderItem = useCallback(
      ({ item }: { item: Exercise }) => (
        <ExerciseListItem exercise={item} onPress={() => handleSelect(item)} />
      ),
      [handleSelect]
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
        <View style={s.header}>
          <Text style={s.title}>Add Exercise</Text>
        </View>
        <ExerciseFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedMuscleGroup={selectedMuscleGroup}
          onMuscleGroupChange={setSelectedMuscleGroup}
          selectedEquipment={selectedEquipment}
          onEquipmentChange={setSelectedEquipment}
          TextInputComponent={BottomSheetTextInput}
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
      </BottomSheetModal>
    );
  }
);

FreestyleExercisePicker.displayName = 'FreestyleExercisePicker';

const s = StyleSheet.create({
  background: {
    backgroundColor: colors.surface,
  },
  handleIndicator: {
    backgroundColor: colors.textMuted,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
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
