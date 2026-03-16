import React, { forwardRef, useCallback, useEffect, useMemo, useState } from 'react';
import { View, Keyboard, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BottomSheetModal,
  BottomSheetFlatList,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import { colors } from '@/constants/theme';
import { useExercises } from '@/features/exercises/hooks/useExercises';
import { ExerciseFilterBar } from '@/features/exercises/components/ExerciseFilterBar';
import { ExerciseListItem } from '@/features/exercises/components/ExerciseListItem';
import type { Exercise, MuscleGroup, Equipment } from '@/features/exercises/types';

interface ExercisePickerProps {
  onSelect: (exercise: Exercise) => void;
}

export const ExercisePicker = forwardRef<BottomSheetModal, ExercisePickerProps>(
  ({ onSelect }, ref) => {
    const { exercises, fetchExercises } = useExercises();
    const insets = useSafeAreaInsets();
    const snapPoints = useMemo(() => ['75%'], []);

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<MuscleGroup | null>(null);
    const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);

    useEffect(() => {
      fetchExercises();
    }, []);

    const filtered = useMemo(() => {
      let result = exercises;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        result = result.filter((e) => e.name.toLowerCase().includes(q));
      }
      if (selectedMuscleGroup) {
        result = result.filter((e) => {
          const groups = e.muscle_groups ?? ((e as any).muscle_group ? [(e as any).muscle_group] : []);
          return groups.includes(selectedMuscleGroup);
        });
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
      },
      [onSelect, ref]
    );

    const handleDismiss = useCallback(() => {
      Keyboard.dismiss();
      setSearchQuery('');
      setSelectedMuscleGroup(null);
      setSelectedEquipment(null);
    }, []);

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
        onDismiss={handleDismiss}
        topInset={insets.top}
        android_keyboardInputMode="adjustResize"
        keyboardBehavior="interactive"
        keyboardBlurBehavior="none"
      >
        <View style={s.filterContainer}>
          <ExerciseFilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedMuscleGroup={selectedMuscleGroup}
            onMuscleGroupChange={setSelectedMuscleGroup}
            selectedEquipment={selectedEquipment}
            onEquipmentChange={setSelectedEquipment}
            TextInputComponent={BottomSheetTextInput}
          />
        </View>
        <BottomSheetFlatList
          data={filtered}
          keyExtractor={(item: Exercise) => item.id}
          renderItem={renderItem}
          contentContainerStyle={s.list}
        />
      </BottomSheetModal>
    );
  }
);

ExercisePicker.displayName = 'ExercisePicker';

const s = StyleSheet.create({
  background: {
    backgroundColor: colors.surface,
  },
  handleIndicator: {
    backgroundColor: colors.textMuted,
  },
  filterContainer: {
    paddingTop: 8,
  },
  list: {
    paddingBottom: 40,
  },
});
