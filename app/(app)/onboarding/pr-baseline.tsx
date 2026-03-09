import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { PRBaselineForm } from '@/features/auth/components/PRBaselineForm';
import { useAuthStore } from '@/stores/authStore';

/**
 * PR baseline onboarding screen.
 * Shown after sign-up for Big 3 lift entry. Skippable.
 * After save or skip, marks onboarding complete and navigates to dashboard.
 */
export default function PRBaselineScreen() {
  const router = useRouter();
  const setOnboardingComplete = useAuthStore((s) => s.setOnboardingComplete);

  const handleComplete = () => {
    setOnboardingComplete();
    router.replace('/(app)/(tabs)/dashboard');
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />
      <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
        <PRBaselineForm onComplete={handleComplete} />
      </SafeAreaView>
    </>
  );
}
