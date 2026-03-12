import { useState, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, Alert, Keyboard, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/stores/authStore';
import { usePRBaselines } from '@/features/auth/hooks/usePRBaselines';
import { colors } from '@/constants/theme';

type Unit = 'kg' | 'lbs';

interface PRBaselineStepProps {
  onNext: () => void;
  onSkip: () => void;
}

interface LiftEntry {
  exercise_name: string;
  label: string;
  weight: string;
  unit: Unit;
}

const LIFTS = [
  { exercise_name: 'bench_press', label: 'Bench Press' },
  { exercise_name: 'squat', label: 'Squat' },
  { exercise_name: 'deadlift', label: 'Deadlift' },
] as const;

function UnitToggle({
  value,
  onChange,
}: {
  value: Unit;
  onChange: (unit: Unit) => void;
}) {
  const isKg = value === 'kg';
  return (
    <View style={s.unitToggle}>
      <Pressable
        onPress={() => onChange('kg')}
        style={[s.unitButton, isKg && s.unitActive]}
      >
        <Text style={[s.unitText, { color: isKg ? colors.white : colors.textSecondary }]}>
          kg
        </Text>
      </Pressable>
      <Pressable
        onPress={() => onChange('lbs')}
        style={[s.unitButton, !isKg && s.unitActive]}
      >
        <Text style={[s.unitText, { color: !isKg ? colors.white : colors.textSecondary }]}>
          lbs
        </Text>
      </Pressable>
    </View>
  );
}

/**
 * Step 2: PR Baselines for Big 3 lifts (bench, squat, deadlift).
 * Defaults unit to the preference chosen in Step 1.
 * This step is skippable.
 */
export function PRBaselineStep({ onNext, onSkip }: PRBaselineStepProps) {
  const preferredUnit = useAuthStore((s) => s.preferredUnit);
  const { savePRBaselines, isLoading } = usePRBaselines();

  const [lifts, setLifts] = useState<LiftEntry[]>(() =>
    LIFTS.map((l) => ({
      exercise_name: l.exercise_name,
      label: l.label,
      weight: '',
      unit: preferredUnit,
    }))
  );

  const handleUnitChange = useCallback((index: number, unit: Unit) => {
    setLifts((prev) => prev.map((l, i) => (i === index ? { ...l, unit } : l)));
  }, []);

  const handleWeightChange = useCallback((index: number, weight: string) => {
    const cleaned = weight.replace(/[^0-9.]/g, '');
    setLifts((prev) => prev.map((l, i) => (i === index ? { ...l, weight: cleaned } : l)));
  }, []);

  const handleNext = useCallback(async () => {
    Keyboard.dismiss();
    const baselines = lifts.map((l) => ({
      exercise_name: l.exercise_name,
      weight: parseFloat(l.weight) || 0,
      unit: l.unit,
    }));

    const hasValues = baselines.some((b) => b.weight > 0);
    if (!hasValues) {
      // No values entered, just advance
      onNext();
      return;
    }

    const result = await savePRBaselines(baselines);
    if (result.success) {
      onNext();
    } else {
      Alert.alert('Error', result.error ?? 'Failed to save PR baselines');
    }
  }, [lifts, savePRBaselines, onNext]);

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={s.scrollView}
        contentContainerStyle={s.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Ionicons name="trophy-outline" size={48} color={colors.accent} style={s.icon} />
        <Text style={s.title}>Set Your PRs</Text>
        <Text style={s.subtitle}>
          Enter your current personal records (optional)
        </Text>

        {lifts.map((lift, index) => (
          <View key={lift.exercise_name} style={s.liftCard}>
            <View style={s.liftHeader}>
              <Text style={s.liftLabel}>{lift.label}</Text>
              <UnitToggle
                value={lift.unit}
                onChange={(unit) => handleUnitChange(index, unit)}
              />
            </View>
            <Input
              placeholder={`Weight (${lift.unit})`}
              value={lift.weight}
              onChangeText={(text) => handleWeightChange(index, text)}
              keyboardType="numeric"
            />
          </View>
        ))}
      </ScrollView>

      <View style={s.footer}>
        <Pressable style={s.nextButton} onPress={handleNext} disabled={isLoading}>
          <Text style={s.nextButtonText}>{isLoading ? 'Saving...' : 'Next'}</Text>
        </Pressable>
        <Pressable style={s.skipButton} onPress={onSkip} disabled={isLoading}>
          <Text style={s.skipButtonText}>Skip</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
  },
  icon: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 32,
    lineHeight: 22,
  },
  liftCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.surfaceElevated,
  },
  liftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  liftLabel: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  unitToggle: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.surfaceElevated,
  },
  unitButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  unitActive: {
    backgroundColor: colors.accent,
  },
  unitText: {
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  nextButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  skipButton: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '600',
  },
});
