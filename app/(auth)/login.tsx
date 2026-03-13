import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/constants/theme';
import { AuthForm } from '@/features/auth/components/AuthForm';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useAuthStore } from '@/stores/authStore';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, signUp } = useAuth();
  const { isConnected } = useNetworkStatus();
  const hasCompletedOnboarding = useAuthStore((s) => s.hasCompletedOnboarding);

  const handleSignIn = async (data: { email: string; password: string }) => {
    await signIn(data);
    // Existing users go to dashboard (onboarding already done)
    router.replace('/(app)/(tabs)/dashboard');
  };

  const handleSignUp = async (data: {
    email: string;
    password: string;
    displayName: string;
    photoUri?: string;
  }) => {
    const result = await signUp(data);
    if (result.session) {
      // Email confirmation disabled — session is immediate, let layout guard route
      router.replace('/(app)/onboarding' as any);
    } else {
      // Email confirmation required — wait for user to verify
      router.replace('/(auth)/confirm');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <AuthForm
        onSignIn={handleSignIn}
        onSignUp={handleSignUp}
        isOffline={!isConnected}
      />
    </SafeAreaView>
  );
}
