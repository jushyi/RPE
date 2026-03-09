import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import { Input } from '@/components/ui/Input';
import { usePlans } from '@/features/plans/hooks/usePlans';
import {
  DaySlotEditor,
  makeTempId,
  type DaySlot,
} from '@/features/plans/components/DaySlotEditor';

export default function CreatePlanScreen() {
  const router = useRouter();
  const { createPlan } = usePlans();
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [days, setDays] = useState<DaySlot[]>([
    { tempId: makeTempId(), day_name: 'Day A', weekday: null, exercises: [] },
  ]);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError('Plan name is required');
      return;
    }
    setNameError('');
    setIsSaving(true);
    try {
      await createPlan(trimmed, days.map((d) => ({
        day_name: d.day_name,
        weekday: d.weekday,
        exercises: d.exercises.map((ex) => ({
          exercise_id: ex.exercise_id,
          target_sets: ex.target_sets,
          notes: ex.notes,
          unit_override: ex.unit_override,
          weight_progression: ex.weight_progression,
        })),
      })));
      router.back();
    } catch (err) {
      Alert.alert('Error', 'Failed to create plan. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={s.headerTitle}>Create Plan</Text>
        <Pressable onPress={handleSave} disabled={isSaving} style={s.saveBtn}>
          <Text style={[s.saveText, isSaving && s.saveTextDisabled]}>
            {isSaving ? 'Saving...' : 'Save'}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Input
          label="Plan Name"
          placeholder="e.g. Push Pull Legs"
          value={name}
          onChangeText={(v) => { setName(v); setNameError(''); }}
          error={nameError}
          autoCapitalize="words"
        />

        <Text style={s.sectionTitle}>Days</Text>
        <DaySlotEditor days={days} onChange={setDays} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceElevated,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  saveBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.accent,
  },
  saveText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  saveTextDisabled: {
    opacity: 0.5,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 60,
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 8,
  },
});
