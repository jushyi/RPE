import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, Alert, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import { Input } from '@/components/ui/Input';
import { useCoachPlans } from '@/features/coaching/hooks/useCoachPlans';
import { useTraineePerformance } from '@/features/coaching/hooks/useTraineePerformance';
import { InlinePerformance } from '@/features/coaching/components/InlinePerformance';
import { CoachNoteInput } from '@/features/coaching/components/CoachNoteInput';
import {
  DaySlotEditor,
  makeTempId,
  type DaySlot,
} from '@/features/plans/components/DaySlotEditor';

export default function CoachCreateScreen() {
  const router = useRouter();
  const { traineeId, traineeName } = useLocalSearchParams<{
    traineeId: string;
    traineeName: string;
  }>();
  const { createPlanForTrainee } = useCoachPlans(traineeId ?? '');

  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [days, setDays] = useState<DaySlot[]>([
    {
      tempId: makeTempId(),
      day_name: 'Day A',
      weekday: null,
      alarmEnabled: false,
      alarmTime: null,
      exercises: [],
    },
  ]);

  // Collect all exercise IDs across all days for performance lookup
  const exerciseIds = useMemo(() => {
    const ids = new Set<string>();
    days.forEach((d) => d.exercises.forEach((e) => ids.add(e.exercise_id)));
    return Array.from(ids);
  }, [days]);

  const { performanceMap } = useTraineePerformance(traineeId ?? '', exerciseIds);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError('Plan name is required');
      return;
    }
    setNameError('');
    setIsSaving(true);
    try {
      await createPlanForTrainee(
        trimmed,
        days.map((d) => ({
          day_name: d.day_name,
          weekday: d.weekday,
          exercises: d.exercises.map((ex) => ({
            exercise_id: ex.exercise_id,
            target_sets: ex.target_sets,
            notes: ex.notes,
            unit_override: ex.unit_override,
            weight_progression: ex.weight_progression,
          })),
        })),
        note || undefined
      );
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

      <KeyboardAvoidingView style={s.keyboardAvoid} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Coach banner */}
        <View style={s.banner}>
          <Ionicons name="person-outline" size={18} color={colors.accent} />
          <Text style={s.bannerText}>
            Creating plan for {traineeName ?? 'trainee'}
          </Text>
        </View>

        <Input
          label="Plan Name"
          placeholder="e.g. Push Pull Legs"
          value={name}
          onChangeText={(v) => {
            setName(v);
            setNameError('');
          }}
          error={nameError}
          autoCapitalize="words"
        />

        <Text style={s.sectionTitle}>Days</Text>
        <DaySlotEditor days={days} onChange={setDays} />

        {/* Inline performance display for each exercise */}
        {days.some((d) => d.exercises.length > 0) && (
          <View style={s.perfSection}>
            <Text style={s.sectionTitle}>Trainee Performance (Last 7 Days)</Text>
            {days.map((day) =>
              day.exercises.map((ex) => (
                <View key={ex.tempId} style={s.perfRow}>
                  <Text style={s.perfExName} numberOfLines={1}>
                    {ex.exercise.name}
                  </Text>
                  <InlinePerformance
                    data={performanceMap.get(ex.exercise_id)}
                  />
                </View>
              ))
            )}
          </View>
        )}

        {/* Coach note */}
        <CoachNoteInput value={note} onChangeText={setNote} />
      </ScrollView>
      </KeyboardAvoidingView>
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
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  saveTextDisabled: {
    opacity: 0.5,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.accent + '15',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  bannerText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 8,
  },
  perfSection: {
    marginBottom: 16,
  },
  perfRow: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
  },
  perfExName: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
});
