import { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Keyboard,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '@/components/ui/Input';
import { useBodyweightData } from '@/features/progress/hooks/useBodyweightData';
import { useBodyMeasurements } from '@/features/body-metrics/hooks/useBodyMeasurements';
import { colors } from '@/constants/theme';

type WeightUnit = 'kg' | 'lbs';
type MeasurementUnit = 'in' | 'cm';

interface BodyStatsStepProps {
  onNext: () => void;
  onSkip: () => void;
  weightUnit: WeightUnit;
  measurementUnit: MeasurementUnit;
}

interface MeasurementField {
  key: 'chest' | 'waist' | 'biceps' | 'quad';
  label: string;
  value: string;
  unitOverride: MeasurementUnit | null;
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
export function BodyStatsStep({ onNext, onSkip, weightUnit: preferredUnit, measurementUnit: preferredMeasurementUnit }: BodyStatsStepProps) {
  const { addEntry: addBodyweight } = useBodyweightData();
  const { addMeasurement } = useBodyMeasurements();

  const [bodyweight, setBodyweight] = useState('');
  const [bodyweightUnitOverride, setBodyweightUnitOverride] = useState<WeightUnit | null>(null);

  const [measurements, setMeasurements] = useState<MeasurementField[]>([
    { key: 'chest', label: 'Chest', value: '', unitOverride: null },
    { key: 'waist', label: 'Waist', value: '', unitOverride: null },
    { key: 'biceps', label: 'Biceps', value: '', unitOverride: null },
    { key: 'quad', label: 'Quad', value: '', unitOverride: null },
  ]);

  // Derive display units: override if manually set, otherwise store preference
  const bodyweightUnit = bodyweightUnitOverride ?? preferredUnit;
  const getMeasUnit = useCallback((m: { unitOverride: MeasurementUnit | null }) =>
    m.unitOverride ?? preferredMeasurementUnit, [preferredMeasurementUnit]);

  const [isSaving, setIsSaving] = useState(false);

  const handleMeasurementChange = useCallback((index: number, text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    setMeasurements((prev) =>
      prev.map((m, i) => (i === index ? { ...m, value: cleaned } : m))
    );
  }, []);

  const handleMeasurementUnitChange = useCallback((index: number, unit: MeasurementUnit) => {
    setMeasurements((prev) =>
      prev.map((m, i) => (i === index ? { ...m, unitOverride: unit } : m))
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
            data[`${m.key}_unit`] = getMeasUnit(m);
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
    <View style={s.container}>
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
              onChange={setBodyweightUnitOverride}
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
        {measurements.map((m, index) => {
          const unit = getMeasUnit(m);
          return (
            <View key={m.key} style={s.fieldCard}>
              <View style={s.fieldHeader}>
                <Text style={s.fieldLabel}>{m.label}</Text>
                <UnitToggle
                  value={unit}
                  onChange={(u) => handleMeasurementUnitChange(index, u)}
                  options={[
                    { label: 'in', value: 'in' as const },
                    { label: 'cm', value: 'cm' as const },
                  ]}
                />
              </View>
              <Input
                placeholder={`${m.label} (${unit})`}
                value={m.value}
                onChangeText={(text) => handleMeasurementChange(index, text)}
                keyboardType="numeric"
              />
            </View>
          );
        })}

        <View style={s.footer}>
          <Pressable style={s.nextButton} onPress={handleNext} disabled={isSaving}>
            <Text style={s.nextButtonText}>{isSaving ? 'Saving...' : 'Next'}</Text>
          </Pressable>
          <Pressable style={s.skipButton} onPress={onSkip} disabled={isSaving}>
            <Text style={s.skipButtonText}>Skip</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
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
    paddingBottom: 300,
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
