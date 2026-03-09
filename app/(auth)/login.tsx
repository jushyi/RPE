import { View } from 'react-native';
import { useRouter } from 'expo-router';
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
    await signUp(data);
    if (!hasCompletedOnboarding) {
      router.replace('/(app)/onboarding/pr-baseline');
    } else {
      router.replace('/(app)/(tabs)/dashboard');
    }
  };

  return (
    <View className="flex-1 bg-background">
      <AuthForm
        onSignIn={handleSignIn}
        onSignUp={handleSignUp}
        isOffline={!isConnected}
      />
    </View>
  );
}
