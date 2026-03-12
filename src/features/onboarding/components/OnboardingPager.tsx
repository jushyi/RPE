import React, { useRef, useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import PagerView from 'react-native-pager-view';
import { colors } from '@/constants/theme';
import { StepDots } from './StepDots';
import { UnitPreferencesStep } from './UnitPreferencesStep';

const TOTAL_STEPS = 4;

interface OnboardingPagerProps {
  onComplete: () => void;
}

/**
 * Main onboarding flow wrapper.
 * 4-page PagerView: UnitPreferences, PRBaseline, BodyStats (placeholder), FirstPlanPrompt (placeholder).
 * Navigation via Next/Skip buttons and swipe gestures.
 */
export function OnboardingPager({ onComplete }: OnboardingPagerProps) {
  const pagerRef = useRef<PagerView>(null);
  const [currentStep, setCurrentStep] = useState(0);

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

        {/* Step 1: PR Baselines (placeholder until Task 2) */}
        <View key="1" style={s.page}>
          <PlaceholderStep
            title="Set Your PRs"
            subtitle="Coming soon"
            onNext={goToNext}
            onSkip={goToSkip}
            showSkip={true}
            buttonLabel="Next"
          />
        </View>

        {/* Step 2: Body Stats (placeholder for future plan) */}
        <View key="2" style={s.page}>
          <PlaceholderStep
            title="Body Stats"
            subtitle="Coming soon"
            onNext={goToNext}
            onSkip={goToSkip}
            showSkip={true}
            buttonLabel="Next"
          />
        </View>

        {/* Step 3: First Plan Prompt (placeholder for future plan) */}
        <View key="3" style={s.page}>
          <PlaceholderStep
            title="Create Your First Plan"
            subtitle="Coming soon"
            onNext={onComplete}
            onSkip={onComplete}
            showSkip={true}
            buttonLabel="Get Started"
          />
        </View>
      </PagerView>
    </View>
  );
}

/** Temporary placeholder for steps not yet implemented */
function PlaceholderStep({
  title,
  subtitle,
  onNext,
  onSkip,
  showSkip,
  buttonLabel,
}: {
  title: string;
  subtitle: string;
  onNext: () => void;
  onSkip: () => void;
  showSkip: boolean;
  buttonLabel: string;
}) {
  return (
    <View style={s.placeholderContainer}>
      <View style={s.placeholderContent}>
        <Text style={s.placeholderTitle}>{title}</Text>
        <Text style={s.placeholderSubtitle}>{subtitle}</Text>
      </View>
      <View style={s.placeholderFooter}>
        <Pressable style={s.nextButton} onPress={onNext}>
          <Text style={s.nextButtonText}>{buttonLabel}</Text>
        </Pressable>
        {showSkip && (
          <Pressable style={s.skipButton} onPress={onSkip}>
            <Text style={s.skipButtonText}>Skip</Text>
          </Pressable>
        )}
      </View>
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
  placeholderContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  placeholderContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderTitle: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  placeholderSubtitle: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
  },
  placeholderFooter: {
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
