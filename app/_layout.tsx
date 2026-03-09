import '../global.css';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { colors } from '@/constants/theme';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useAuthStore } from '@/stores/authStore';
import { ConnectivityBanner } from '@/components/layout/ConnectivityBanner';

export default function RootLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const hasCompletedOnboarding = useAuthStore((s) => s.hasCompletedOnboarding);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      // After email confirmation, route to onboarding or dashboard
      if (!hasCompletedOnboarding) {
        router.replace('/(app)/onboarding/pr-baseline');
      } else {
        router.replace('/(app)/(tabs)/dashboard');
      }
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={colors.accent} />
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <BottomSheetModalProvider>
        <StatusBar style="light" />
        <ConnectivityBanner />
        <Slot />
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
