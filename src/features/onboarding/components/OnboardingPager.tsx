import React, { useState, useCallback } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { StepDots } from './StepDots';
import { HandleStep } from './HandleStep';
import { UnitPreferencesStep } from './UnitPreferencesStep';
import { PRBaselineStep } from './PRBaselineStep';
import { BodyStatsStep } from './BodyStatsStep';
import { FirstPlanPromptStep } from './FirstPlanPromptStep';

const TOTAL_STEPS = 5;

interface OnboardingPagerProps {
  onComplete: () => void;
}

/**
 * Main onboarding flow wrapper.
 * 5 steps rendered one at a time:
 *   0 - HandleStep (new: optional handle / username setup)
 *   1 - UnitPreferences
 *   2 - PRBaseline
 *   3 - BodyStats
 *   4 - FirstPlanPrompt
 */
export function OnboardingPager({ onComplete }: OnboardingPagerProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();
  const setOnboardingComplete = useAuthStore((s) => s.setOnboardingComplete);
  const setPreferredUnit = useAuthStore((s) => s.setPreferredUnit);
  const setPreferredMeasurementUnit = useAuthStore((s) => s.setPreferredMeasurementUnit);

  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('lbs');
  const [measurementUnit, setMeasurementUnit] = useState<'in' | 'cm'>('in');

  const goBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  }, [currentStep]);

  const goToNext = useCallback(() => {
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      onComplete();
    }
  }, [currentStep, onComplete]);

  const handleUnitsNext = useCallback((wu: 'kg' | 'lbs', mu: 'in' | 'cm') => {
    setWeightUnit(wu);
    setMeasurementUnit(mu);
    setPreferredUnit(wu);
    setPreferredMeasurementUnit(mu);
    setCurrentStep(2); // step 1 (units) -> step 2 (PRBaseline)
  }, [setPreferredUnit, setPreferredMeasurementUnit]);

  const handleCreatePlan = useCallback(() => {
    setOnboardingComplete();
    router.push('/(app)/plans/create' as any);
  }, [setOnboardingComplete, router]);

  const handleSkipToComplete = useCallback(() => {
    onComplete();
  }, [onComplete]);

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        // Handle step: onNext and onSkip both advance to step 1
        return <HandleStep onNext={goToNext} onSkip={goToNext} />;
      case 1:
        return (
          <UnitPreferencesStep
            onNext={handleUnitsNext}
            initialWeightUnit={weightUnit}
            initialMeasurementUnit={measurementUnit}
          />
        );
      case 2:
        return (
          <PRBaselineStep onNext={goToNext} onSkip={goToNext} weightUnit={weightUnit} />
        );
      case 3:
        return (
          <BodyStatsStep
            onNext={goToNext}
            onSkip={goToNext}
            weightUnit={weightUnit}
            measurementUnit={measurementUnit}
          />
        );
      case 4:
        return (
          <FirstPlanPromptStep
            onCreatePlan={handleCreatePlan}
            onComplete={handleSkipToComplete}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={s.container}>
      <View style={s.header}>
        {currentStep > 0 ? (
          <Pressable onPress={goBack} style={s.backButton} hitSlop={12}>
            <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
          </Pressable>
        ) : (
          <View style={s.backPlaceholder} />
        )}
        <StepDots total={TOTAL_STEPS} current={currentStep} />
        <View style={s.backPlaceholder} />
      </View>
      <View style={s.page}>
        {renderStep()}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backButton: {
    width: 36,
    alignItems: 'center',
  },
  backPlaceholder: {
    width: 36,
  },
  page: {
    flex: 1,
  },
});
