import { Redirect } from 'expo-router';

/**
 * Entry point redirect.
 * Plan 02 will add auth state check here.
 * For now, redirect to login screen.
 */
export default function Index() {
  return <Redirect href="/(auth)/login" />;
}
