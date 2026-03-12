import { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Keyboard,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/stores/authStore';
import { useBodyweightData } from '@/features/progress/hooks/useBodyweightData';
import { useBodyMeasurements } from '@/features/body-metrics/hooks/useBodyMeasurements';
import { colors } from '@/constants/theme';

type WeightUnit = 'kg' | 'lbs';
type MeasurementUnit = 'in' | 'cm';

interface BodyStatsStepProps {
  onNext: () => void;
  onSkip: () => void;
}

interface MeasurementField {
  key: 'chest' | 'waist' | 'biceps' | 'quad';
  label: string;
  value: string;
  unit: MeasurementUnit;
}

function UnitToggle<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { label: string; value: T }[];
}) {
  return (
    <View style={s.unitToggle}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[s.unitButton, active && s.unitActive]}
          >
            <Text
              style={[s.unitText, { color: active ? colors.white : colors.textSecondary }]}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/**
 * Step 3: Body Stats Baseline.
 * Collects optional bodyweight + 4 circumference measurements (chest, waist, biceps, quad).
 * Units default to the preferences selected in Step 1.
 */
export function BodyStatsStep({ onNext, onSkip }: BodyStatsStepProps) {
  const preferredUnit = useAuthStore((s) => s.preferredUnit);
  const preferredMeasurementUnit = useAuthStore((s) => s.preferredMeasurementUnit);
  const { addEntry: addBodyweight } = useBodyweightData();
  const { addMeasurement } = useBodyMeasurements();

  const [bodyweight, setBodyweight] = useState('');
  const [bodyweightUnit, setBodyweightUnit] = useState<WeightUnit>(preferredUnit);

  const [measurements, setMeasurements] = useState<MeasurementField[]>([
    { key: 'chest', label: 'Chest', value: '', unit: preferredMeasurementUnit },
    { key: 'waist', label: 'Waist', value: '', unit: preferredMeasurementUnit },
    { key: 'biceps', label: 'Biceps', value: '', unit: preferredMeasurementUnit },
    { key: 'quad', label: 'Quad', value: '', unit: preferredMeasurementUnit },
  ]);

  const [isSaving, setIsSaving] = useState(false);

  const handleMeasurementChange = useCallback((index: number, text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    setMeasurements((prev) =>
      prev.map((m, i) => (i === index ? { ...m, value: cleaned } : m))
    );
  }, []);

  const handleMeasurementUnitChange = useCallback((index: number, unit: MeasurementUnit) => {
    setMeasurements((prev) =>
      prev.map((m, i) => (i === index ? { ...m, unit } : m))
    );
  }, []);

  const handleNext = useCallback(async () => {
    Keyboard.dismiss();
    setIsSaving(true);

    try {
      // Save bodyweight if entered
      const bwValue = parseFloat(bodyweight);
      if (bwValue > 0) {
        await addBodyweight(bwValue, bodyweightUnit);
      }

      // Save circumference measurements if any filled
      const hasAnyMeasurement = measurements.some((m) => parseFloat(m.value) > 0);
      if (hasAnyMeasurement) {
        const data: Record<string, number | string | null> = {
          chest: null,
          chest_unit: null,
          waist: null,
          waist_unit: null,
          biceps: null,
          biceps_unit: null,
          quad: null,
          quad_unit: null,
          body_fat_pct: null,
          measured_at: new Date().toISOString().split('T')[0],
        };

        for (const m of measurements) {
          const val = parseFloat(m.value);
          if (val > 0) {
            data[m.key] = val;
            data[`${m.key}_unit`] = m.unit;
          }
        }

        await addMeasurement(data as any);
      }

      onNext();
    } catch {
      // Best-effort save, still advance
      onNext();
    } finally {
      setIsSaving(false);
    }
  }, [bodyweight, bodyweightUnit, measurements, addBodyweight, addMeasurement, onNext]);

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
        <Ionicons name="body-outline" size={48} color={colors.accent} style={s.icon} />
        <Text style={s.title}>Body Stats Baseline</Text>
        <Text style={s.subtitle}>
          Track your starting point (optional)
        </Text>

        {/* Bodyweight */}
        <View style={s.fieldCard}>
          <View style={s.fieldHeader}>
            <Text style={s.fieldLabel}>Bodyweight</Text>
            <UnitToggle
              value={bodyweightUnit}
              onChange={setBodyweightUnit}
              options={[
                { label: 'kg', value: 'kg' as const },
                { label: 'lbs', value: 'lbs' as const },
              ]}
            />
          </View>
          <Input
            placeholder={`Weight (${bodyweightUnit})`}
            value={bodyweight}
            onChangeText={(text) => setBodyweight(text.replace(/[^0-9.]/g, ''))}
            keyboardType="numeric"
          />
        </View>

        {/* Circumference measurements */}
        {measurements.map((m, index) => (
          <View key={m.key} style={s.fieldCard}>
            <View style={s.fieldHeader}>
              <Text style={s.fieldLabel}>{m.label}</Text>
              <UnitToggle
                value={m.unit}
                onChange={(unit) => handleMeasurementUnitChange(index, unit)}
                options={[
                  { label: 'in', value: 'in' as const },
                  { label: 'cm', value: 'cm' as const },
                ]}
              />
            </View>
            <Input
              placeholder={`${m.label} (${m.unit})`}
              value={m.value}
              onChangeText={(text) => handleMeasurementChange(index, text)}
              keyboardType="numeric"
            />
          </View>
        ))}
      </ScrollView>

      <View style={s.footer}>
        <Pressable style={s.nextButton} onPress={handleNext} disabled={isSaving}>
          <Text style={s.nextButtonText}>{isSaving ? 'Saving...' : 'Next'}</Text>
        </Pressable>
        <Pressable style={s.skipButton} onPress={onSkip} disabled={isSaving}>
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
  fieldCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.surfaceElevated,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  fieldLabel: {
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
