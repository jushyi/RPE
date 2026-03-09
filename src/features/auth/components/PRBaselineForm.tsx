import { useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert, Keyboard, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { usePRBaselines } from '../hooks/usePRBaselines';
import { colors } from '@/constants/theme';

type Unit = 'kg' | 'lbs';

interface LiftEntry {
  exercise_name: string;
  label: string;
  weight: string;
  unit: Unit;
}

interface PRBaselineFormProps {
  onComplete: () => void;
  initialValues?: Array<{ exercise_name: string; weight: number; unit: 'kg' | 'lbs' }>;
  mode?: 'onboarding' | 'edit';
}

const LIFTS = [
  { exercise_name: 'bench_press', label: 'Bench Press' },
  { exercise_name: 'squat', label: 'Squat' },
  { exercise_name: 'deadlift', label: 'Deadlift' },
] as const;

function UnitToggle({
  value,
  onChange,
  size = 'normal',
}: {
  value: Unit;
  onChange: (unit: Unit) => void;
  size?: 'normal' | 'small';
}) {
  const isKg = value === 'kg';
  const pad = size === 'small' ? { paddingHorizontal: 8, paddingVertical: 4 } : { paddingHorizontal: 16, paddingVertical: 8 };
  const fontSize = size === 'small' ? 12 : 14;

  return (
    <View style={s.unitToggle}>
      <Pressable onPress={() => onChange('kg')} style={[pad, isKg && s.unitActive]}>
        <Text style={[{ fontSize, fontWeight: '600' }, { color: isKg ? '#fff' : colors.textSecondary }]}>
          kg
        </Text>
      </Pressable>
      <Pressable onPress={() => onChange('lbs')} style={[pad, !isKg && s.unitActive]}>
        <Text style={[{ fontSize, fontWeight: '600' }, { color: !isKg ? '#fff' : colors.textSecondary }]}>
          lbs
        </Text>
      </Pressable>
    </View>
  );
}

export function PRBaselineForm({ onComplete, initialValues, mode = 'onboarding' }: PRBaselineFormProps) {
  const isEdit = mode === 'edit';
  const preferredUnit = useAuthStore((s) => s.preferredUnit);
  const setPreferredUnit = useAuthStore((s) => s.setPreferredUnit);
  const { savePRBaselines, isLoading } = usePRBaselines();

  const initialUnit = initialValues?.[0]?.unit ?? preferredUnit;
  const [globalUnit, setGlobalUnit] = useState<Unit>(initialUnit);
  const [lifts, setLifts] = useState<LiftEntry[]>(() => {
    const valueMap = new Map(initialValues?.map((v) => [v.exercise_name, v]));
    return LIFTS.map((l) => {
      const existing = valueMap.get(l.exercise_name);
      return {
        exercise_name: l.exercise_name,
        label: l.label,
        weight: existing ? String(existing.weight) : '',
        unit: existing?.unit ?? initialUnit,
      };
    });
  });

  const handleGlobalUnitChange = (unit: Unit) => {
    setGlobalUnit(unit);
    setLifts((prev) => prev.map((l) => ({ ...l, unit })));
  };

  const handleLiftUnitChange = (index: number, unit: Unit) => {
    setLifts((prev) => prev.map((l, i) => (i === index ? { ...l, unit } : l)));
  };

  const handleWeightChange = (index: number, weight: string) => {
    const cleaned = weight.replace(/[^0-9.]/g, '');
    setLifts((prev) => prev.map((l, i) => (i === index ? { ...l, weight: cleaned } : l)));
  };

  const handleSave = async () => {
    Keyboard.dismiss();
    const baselines = lifts.map((l) => ({
      exercise_name: l.exercise_name,
      weight: parseFloat(l.weight) || 0,
      unit: l.unit,
    }));

    const result = await savePRBaselines(baselines);
    if (result.success) {
      setPreferredUnit(globalUnit);
      onComplete();
    } else {
      Alert.alert('Error', result.error ?? 'Failed to save PR baselines');
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior="padding"
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 48, paddingBottom: 120 }}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={s.title}>{isEdit ? 'Edit Your PRs' : 'Set Your Starting PRs'}</Text>
      <Text style={s.subtitle}>{isEdit ? 'Update your personal records' : 'Enter your current 1RM for each lift (optional)'}</Text>

      <View style={s.globalUnitRow}>
        <Text style={s.globalUnitLabel}>Default Unit</Text>
        <UnitToggle value={globalUnit} onChange={handleGlobalUnitChange} />
      </View>

      {lifts.map((lift, index) => (
        <View key={lift.exercise_name} style={s.liftCard}>
          <View style={s.liftHeader}>
            <Text style={s.liftLabel}>{lift.label}</Text>
            <UnitToggle
              value={lift.unit}
              onChange={(unit) => handleLiftUnitChange(index, unit)}
              size="small"
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

      <View style={{ marginTop: 16 }}>
        <Button title={isEdit ? 'Save' : 'Save & Continue'} onPress={handleSave} loading={isLoading} />
        {!isEdit && (
          <View style={{ marginTop: 12 }}>
            <Button title="Skip" onPress={handleSkip} variant="ghost" disabled={isLoading} />
          </View>
        )}
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  title: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  globalUnitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  globalUnitLabel: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '500',
  },
  unitToggle: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.surfaceElevated,
  },
  unitActive: {
    backgroundColor: colors.accent,
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
});
