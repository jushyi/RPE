import { useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { usePRBaselines } from '../hooks/usePRBaselines';

type Unit = 'kg' | 'lbs';

interface LiftEntry {
  exercise_name: string;
  label: string;
  icon: string;
  weight: string;
  unit: Unit;
}

interface PRBaselineFormProps {
  onComplete: () => void;
}

const LIFTS = [
  { exercise_name: 'bench_press', label: 'Bench Press', icon: '🏋️' },
  { exercise_name: 'squat', label: 'Squat', icon: '🦵' },
  { exercise_name: 'deadlift', label: 'Deadlift', icon: '💪' },
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
  const paddingClass = size === 'small' ? 'px-2 py-1' : 'px-4 py-2';
  const textSize = size === 'small' ? 'text-xs' : 'text-sm';

  return (
    <View className="flex-row bg-surface rounded-lg overflow-hidden border border-surface-elevated">
      <Pressable
        onPress={() => onChange('kg')}
        className={`${paddingClass} ${isKg ? 'bg-accent' : ''}`}
      >
        <Text className={`${textSize} font-semibold ${isKg ? 'text-white' : 'text-text-secondary'}`}>
          kg
        </Text>
      </Pressable>
      <Pressable
        onPress={() => onChange('lbs')}
        className={`${paddingClass} ${!isKg ? 'bg-accent' : ''}`}
      >
        <Text className={`${textSize} font-semibold ${!isKg ? 'text-white' : 'text-text-secondary'}`}>
          lbs
        </Text>
      </Pressable>
    </View>
  );
}

export function PRBaselineForm({ onComplete }: PRBaselineFormProps) {
  const preferredUnit = useAuthStore((s) => s.preferredUnit);
  const setPreferredUnit = useAuthStore((s) => s.setPreferredUnit);
  const { savePRBaselines, isLoading } = usePRBaselines();

  const [globalUnit, setGlobalUnit] = useState<Unit>(preferredUnit);
  const [lifts, setLifts] = useState<LiftEntry[]>(
    LIFTS.map((l) => ({
      exercise_name: l.exercise_name,
      label: l.label,
      icon: l.icon,
      weight: '',
      unit: preferredUnit,
    }))
  );

  const handleGlobalUnitChange = (unit: Unit) => {
    setGlobalUnit(unit);
    // Update all lifts that haven't been independently overridden
    // For simplicity, update all lifts to the new global unit
    setLifts((prev) =>
      prev.map((l) => ({ ...l, unit }))
    );
  };

  const handleLiftUnitChange = (index: number, unit: Unit) => {
    setLifts((prev) =>
      prev.map((l, i) => (i === index ? { ...l, unit } : l))
    );
  };

  const handleWeightChange = (index: number, weight: string) => {
    // Allow only numeric input with optional decimal
    const cleaned = weight.replace(/[^0-9.]/g, '');
    setLifts((prev) =>
      prev.map((l, i) => (i === index ? { ...l, weight: cleaned } : l))
    );
  };

  const handleSave = async () => {
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
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      <View className="px-6 pt-12">
        {/* Header */}
        <Text className="text-text-primary text-2xl font-bold text-center">
          Set Your Starting PRs
        </Text>
        <Text className="text-text-secondary text-base text-center mt-2 mb-8">
          Enter your current 1RM for each lift (optional)
        </Text>

        {/* Global unit toggle */}
        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-text-primary text-base font-medium">Default Unit</Text>
          <UnitToggle value={globalUnit} onChange={handleGlobalUnitChange} />
        </View>

        {/* Lift entries */}
        {lifts.map((lift, index) => (
          <View
            key={lift.exercise_name}
            className="bg-surface rounded-2xl p-4 mb-4 border border-surface-elevated"
          >
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <Text className="text-2xl mr-3">{lift.icon}</Text>
                <Text className="text-text-primary text-lg font-semibold">
                  {lift.label}
                </Text>
              </View>
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

        {/* Actions */}
        <View className="mt-4">
          <Button
            title="Save & Continue"
            onPress={handleSave}
            loading={isLoading}
          />
          <View className="mt-3">
            <Button
              title="Skip"
              onPress={handleSkip}
              variant="ghost"
              disabled={isLoading}
            />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
