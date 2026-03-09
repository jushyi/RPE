import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { View, FlatList, Text, Pressable, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { colors } from '@/constants/theme';
import { useExercises } from '@/features/exercises/hooks/useExercises';
import { ExerciseFilterBar } from '@/features/exercises/components/ExerciseFilterBar';
import { ExerciseListItem } from '@/features/exercises/components/ExerciseListItem';
import { EmptyState } from '@/features/exercises/components/EmptyState';
import { ExerciseBottomSheet } from '@/features/exercises/components/ExerciseBottomSheet';
import { isCustomExercise } from '@/features/exercises/types';
import type { MuscleGroup, Equipment, Exercise } from '@/features/exercises/types';

export default function ExercisesScreen() {
  const { exercises, isLoading, fetchExercises, deleteExercise } = useExercises();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<MuscleGroup | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [exerciseToEdit, setExerciseToEdit] = useState<Exercise | null>(null);
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  useEffect(() => {
    fetchExercises();
  }, []);

  const filteredExercises = useMemo(() => {
    let result = exercises;

    if (selectedMuscleGroup) {
      result = result.filter((e) => e.muscle_group === selectedMuscleGroup);
    }
    if (selectedEquipment) {
      result = result.filter((e) => e.equipment === selectedEquipment);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((e) => e.name.toLowerCase().includes(q));
    }

    return result;
  }, [exercises, selectedMuscleGroup, selectedEquipment, searchQuery]);

  const hasFilters = !!(selectedMuscleGroup || selectedEquipment || searchQuery.trim());

  const handleAddExercise = useCallback(() => {
    setExerciseToEdit(null);
    bottomSheetRef.current?.present();
  }, []);

  const handleLongPress = useCallback(
    (exercise: Exercise) => {
      if (isCustomExercise(exercise)) {
        Alert.alert(exercise.name, undefined, [
          {
            text: 'Edit',
            onPress: () => {
              setExerciseToEdit(exercise);
              bottomSheetRef.current?.present();
            },
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              Alert.alert(
                'Delete Exercise',
                `Are you sure you want to delete "${exercise.name}"?`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => deleteExercise(exercise.id),
                  },
                ]
              );
            },
          },
          { text: 'Cancel', style: 'cancel' },
        ]);
      } else {
        Alert.alert(exercise.name, 'This is a built-in exercise and cannot be edited or deleted.');
      }
    },
    [deleteExercise]
  );

  const handleSave = useCallback(() => {
    setExerciseToEdit(null);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Exercise }) => (
      <ExerciseListItem
        exercise={item}
        onLongPress={() => handleLongPress(item)}
      />
    ),
    [handleLongPress]
  );

  return (
    <SafeAreaView style={s.safeArea} edges={['top']}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Exercises</Text>
      </View>

      <ExerciseFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedMuscleGroup={selectedMuscleGroup}
        onMuscleGroupChange={setSelectedMuscleGroup}
        selectedEquipment={selectedEquipment}
        onEquipmentChange={setSelectedEquipment}
      />

      {filteredExercises.length === 0 && !isLoading ? (
        <EmptyState hasFilters={hasFilters} onAddExercise={handleAddExercise} />
      ) : (
        <FlatList
          data={filteredExercises}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB */}
      <Pressable
        onPress={handleAddExercise}
        style={({ pressed }) => [s.fab, pressed && s.fabPressed]}
      >
        <Text style={s.fabText}>+</Text>
      </Pressable>

      <ExerciseBottomSheet
        ref={bottomSheetRef}
        exerciseToEdit={exerciseToEdit}
        onSave={handleSave}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: 'bold',
  },
  list: {
    paddingTop: 4,
    paddingBottom: 80,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
  fabText: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '600',
    lineHeight: 30,
  },
});
