import React from 'react';
import { View, TextInput, ScrollView, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import type { MuscleGroup, Equipment } from '../types';
import { MUSCLE_GROUPS, MUSCLE_GROUP_COLORS } from '../constants/muscleGroups';
import { EQUIPMENT_TYPES } from '../constants/equipmentTypes';

interface ExerciseFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedMuscleGroup: MuscleGroup | null;
  onMuscleGroupChange: (group: MuscleGroup | null) => void;
  selectedEquipment: Equipment | null;
  onEquipmentChange: (equipment: Equipment | null) => void;
  TextInputComponent?: React.ComponentType<any>;
}

export function ExerciseFilterBar({
  searchQuery,
  onSearchChange,
  selectedMuscleGroup,
  onMuscleGroupChange,
  selectedEquipment,
  onEquipmentChange,
  TextInputComponent,
}: ExerciseFilterBarProps) {
  const InputComponent = TextInputComponent ?? TextInput;
  return (
    <View style={s.container}>
      {/* Search bar */}
      <View style={s.searchContainer}>
        <Ionicons name="search" size={16} color={colors.textMuted} style={{ marginRight: 8 }} />
        <InputComponent
          style={s.searchInput}
          placeholder="Search exercises..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={onSearchChange}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* Muscle group filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.chipScroll}
        contentContainerStyle={s.chipRow}
      >
        {MUSCLE_GROUPS.map((group) => {
          const isActive = selectedMuscleGroup === group;
          const groupColor = MUSCLE_GROUP_COLORS[group];
          return (
            <Pressable
              key={group}
              onPress={() => onMuscleGroupChange(isActive ? null : group)}
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

      {/* Equipment filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.chipScroll}
        contentContainerStyle={s.chipRow}
      >
        {EQUIPMENT_TYPES.map((equip) => {
          const isActive = selectedEquipment === equip;
          return (
            <Pressable
              key={equip}
              onPress={() => onEquipmentChange(isActive ? null : equip)}
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
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    paddingBottom: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.surfaceElevated,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 16,
    paddingVertical: 12,
  },
  chipScroll: {
    marginHorizontal: 16,
  },
  chipRow: {
    paddingBottom: 8,
    gap: 8,
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
});
