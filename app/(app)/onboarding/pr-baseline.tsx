import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { PRBaselineForm } from '@/features/auth/components/PRBaselineForm';
import { useAuthStore } from '@/stores/authStore';
import { colors } from '@/constants/theme';

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
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
        <PRBaselineForm onComplete={handleComplete} />
      </SafeAreaView>
    </>
  );
}
