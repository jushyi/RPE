import { useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OnboardingPager } from '@/features/onboarding/components/OnboardingPager';
import { useAuthStore } from '@/stores/authStore';
import { colors } from '@/constants/theme';

/**
 * Multi-step onboarding entry screen.
 * Renders the OnboardingPager (4 steps). On completion, marks onboarding
 * complete and navigates to the dashboard.
 */
export default function OnboardingScreen() {
  const router = useRouter();
  const setOnboardingComplete = useAuthStore((s) => s.setOnboardingComplete);

  const handleComplete = () => {
    setOnboardingComplete();
    router.replace('/(app)/(tabs)/dashboard');
  };

  return (
    <SafeAreaView style={s.container}>
      <OnboardingPager onComplete={handleComplete} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
