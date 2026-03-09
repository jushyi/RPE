import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';

/**
 * Entry point redirect based on auth state.
 * - Authenticated users go to dashboard
 * - Unauthenticated users go to login
 */
export default function Index() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (isAuthenticated) {
    return <Redirect href="/(app)/(tabs)/dashboard" />;
  }

  return <Redirect href="/(auth)/login" />;
}
