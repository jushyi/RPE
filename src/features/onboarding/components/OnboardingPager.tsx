import React, { useRef, useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import PagerView from 'react-native-pager-view';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { StepDots } from './StepDots';
import { UnitPreferencesStep } from './UnitPreferencesStep';
import { PRBaselineStep } from './PRBaselineStep';
import { BodyStatsStep } from './BodyStatsStep';
import { FirstPlanPromptStep } from './FirstPlanPromptStep';

const TOTAL_STEPS = 4;

interface OnboardingPagerProps {
  onComplete: () => void;
}

/**
 * Main onboarding flow wrapper.
 * 4-page PagerView: UnitPreferences, PRBaseline, BodyStats, FirstPlanPrompt.
 * Navigation via Next/Skip buttons and swipe gestures.
 */
export function OnboardingPager({ onComplete }: OnboardingPagerProps) {
  const pagerRef = useRef<PagerView>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();
  const setOnboardingComplete = useAuthStore((s) => s.setOnboardingComplete);

  const goToNext = useCallback(() => {
    if (currentStep < TOTAL_STEPS - 1) {
      pagerRef.current?.setPage(currentStep + 1);
    } else {
      onComplete();
    }
  }, [currentStep, onComplete]);

  const goToSkip = useCallback(() => {
    if (currentStep < TOTAL_STEPS - 1) {
      pagerRef.current?.setPage(currentStep + 1);
    } else {
      onComplete();
    }
  }, [currentStep, onComplete]);

  const handlePageSelected = useCallback(
    (e: { nativeEvent: { position: number } }) => {
      setCurrentStep(e.nativeEvent.position);
    },
    []
  );

  /** Step 4: "Create Your First Plan" — mark onboarding complete BEFORE navigating */
  const handleCreatePlan = useCallback(() => {
    setOnboardingComplete();
    router.push('/(app)/plans/create' as any);
  }, [setOnboardingComplete, router]);

  /** Step 4: "Skip for Now" — mark onboarding complete and go to dashboard */
  const handleSkipToComplete = useCallback(() => {
    onComplete();
  }, [onComplete]);

  return (
    <View style={s.container}>
      <StepDots total={TOTAL_STEPS} current={currentStep} />

      <PagerView
        ref={pagerRef}
        style={s.pager}
        initialPage={0}
        scrollEnabled={true}
        onPageSelected={handlePageSelected}
      >
        {/* Step 0: Unit Preferences */}
        <View key="0" style={s.page}>
          <UnitPreferencesStep onNext={goToNext} />
        </View>

        {/* Step 1: PR Baselines */}
        <View key="1" style={s.page}>
          <PRBaselineStep onNext={goToNext} onSkip={goToSkip} />
        </View>

        {/* Step 2: Body Stats */}
        <View key="2" style={s.page}>
          <BodyStatsStep onNext={goToNext} onSkip={goToSkip} />
        </View>

        {/* Step 3: First Plan Prompt */}
        <View key="3" style={s.page}>
          <FirstPlanPromptStep
            onCreatePlan={handleCreatePlan}
            onComplete={handleSkipToComplete}
          />
        </View>
      </PagerView>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
  },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
});
