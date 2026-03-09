import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, AppState } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/theme';

export default function ConfirmScreen() {
  const router = useRouter();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Poll for session when app comes to foreground (user confirmed email in browser)
    const checkSession = async () => {
      if (!supabase) return;
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        router.replace('/(app)/onboarding/pr-baseline');
      }
    };

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        checkSession();
      }
    });

    // Also poll every 3 seconds in case they confirm on the same device
    intervalRef.current = setInterval(checkSession, 3000);

    return () => {
      subscription.remove();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [router]);

  const handleResend = async () => {
    // Supabase doesn't have a direct resend for signup, but user can try signing up again
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        <Text style={s.title}>Check Your Email</Text>
        <Text style={s.body}>
          We sent a confirmation link to your email address. Tap the link to verify your account, then come back here.
        </Text>
        <Text style={s.hint}>
          This screen will automatically continue once your email is confirmed.
        </Text>
        <View style={s.actions}>
          <Button title="Back to Sign In" onPress={handleResend} variant="ghost" />
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  body: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 12,
  },
  hint: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  actions: {
    marginTop: 32,
  },
});
