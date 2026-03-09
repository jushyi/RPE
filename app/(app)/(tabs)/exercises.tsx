import { useEffect, useState, useMemo } from 'react';
import { View, FlatList, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/constants/theme';
import { useExercises } from '@/features/exercises/hooks/useExercises';
import { ExerciseFilterBar } from '@/features/exercises/components/ExerciseFilterBar';
import { ExerciseListItem } from '@/features/exercises/components/ExerciseListItem';
import { EmptyState } from '@/features/exercises/components/EmptyState';
import type { MuscleGroup, Equipment, Exercise } from '@/features/exercises/types';

export default function ExercisesScreen() {
  const { exercises, isLoading, fetchExercises } = useExercises();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<MuscleGroup | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);

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

  const handleAddExercise = () => {
    // Placeholder: Plan 02-02 wires this to bottom sheet
  };

  const renderItem = ({ item }: { item: Exercise }) => (
    <ExerciseListItem exercise={item} />
  );

  return (
    <SafeAreaView style={s.safeArea} edges={['top']}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Exercises</Text>
        <Pressable onPress={handleAddExercise} style={s.addButton}>
          <Text style={s.addButtonText}>+</Text>
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 26,
  },
  list: {
    paddingTop: 4,
    paddingBottom: 24,
  },
});
