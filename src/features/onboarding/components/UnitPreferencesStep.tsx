import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';

interface UnitPreferencesStepProps {
  onNext: (weightUnit: 'kg' | 'lbs', measurementUnit: 'in' | 'cm') => void;
  initialWeightUnit: 'kg' | 'lbs';
  initialMeasurementUnit: 'in' | 'cm';
}

type WeightUnit = 'kg' | 'lbs';
type MeasurementUnit = 'in' | 'cm';

function SegmentedToggle<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={segStyles.container}>
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[segStyles.button, selected && segStyles.buttonSelected]}
          >
            <Text style={[segStyles.label, selected && segStyles.labelSelected]}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const segStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceElevated,
    borderRadius: 8,
    overflow: 'hidden',
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonSelected: {
    backgroundColor: colors.accent,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textMuted,
  },
  labelSelected: {
    color: colors.white,
  },
});

/**
 * Step 1: Unit preferences selection.
 * User picks weight unit (kg/lbs) and measurement unit (in/cm).
 * This step is NOT skippable -- only "Next" is available.
 */
export function UnitPreferencesStep({ onNext, initialWeightUnit, initialMeasurementUnit }: UnitPreferencesStepProps) {
  const [weightUnit, setWeightUnit] = useState<WeightUnit>(initialWeightUnit);
  const [measurementUnit, setMeasurementUnit] = useState<MeasurementUnit>(initialMeasurementUnit);

  const handleNext = () => {
    onNext(weightUnit, measurementUnit);
  };

  return (
    <View style={s.container}>
      <View style={s.content}>
        <Ionicons name="scale-outline" size={48} color={colors.accent} style={s.icon} />
        <Text style={s.title}>Choose Your Units</Text>
        <Text style={s.subtitle}>
          This affects how weights and measurements are displayed throughout the app.
        </Text>

        <View style={s.card}>
          <View style={s.row}>
            <Text style={s.rowLabel}>Weight Unit</Text>
            <SegmentedToggle
              options={[
                { label: 'lbs', value: 'lbs' as const },
                { label: 'kg', value: 'kg' as const },
              ]}
              value={weightUnit}
              onChange={setWeightUnit}
            />
          </View>
          <View style={s.divider} />
          <View style={s.row}>
            <Text style={s.rowLabel}>Measurement Unit</Text>
            <SegmentedToggle
              options={[
                { label: 'in', value: 'in' as const },
                { label: 'cm', value: 'cm' as const },
              ]}
              value={measurementUnit}
              onChange={setMeasurementUnit}
            />
          </View>
        </View>
      </View>

      <View style={s.footer}>
        <Pressable style={s.nextButton} onPress={handleNext}>
          <Text style={s.nextButtonText}>Next</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  rowLabel: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '500',
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: colors.surfaceElevated,
    marginHorizontal: 16,
  },
  footer: {
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
});
