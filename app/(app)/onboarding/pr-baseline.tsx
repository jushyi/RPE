import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { PRBaselineForm } from '@/features/auth/components/PRBaselineForm';
import { useAuthStore } from '@/stores/authStore';
import { colors } from '@/constants/theme';

export default function PRBaselineScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string; baselines?: string }>();
  const setOnboardingComplete = useAuthStore((s) => s.setOnboardingComplete);

  const isEdit = params.mode === 'edit';

  let initialValues: Array<{ exercise_name: string; weight: number; unit: 'kg' | 'lbs' }> | undefined;
  if (isEdit && params.baselines) {
    try {
      initialValues = JSON.parse(params.baselines);
    } catch {
      initialValues = undefined;
    }
  }

  const handleComplete = () => {
    if (isEdit) {
      router.back();
    } else {
      setOnboardingComplete();
      router.replace('/(app)/(tabs)/dashboard');
    }
  };

  return (
    <>
      <Stack.Screen
        options={
          isEdit
            ? {
                headerShown: true,
                title: 'Edit PRs',
                headerStyle: { backgroundColor: colors.background },
                headerTintColor: colors.textPrimary,
              }
            : { headerShown: false, gestureEnabled: false }
        }
      />
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.background }}
        edges={isEdit ? ['bottom'] : ['top', 'bottom']}
      >
        <PRBaselineForm
          onComplete={handleComplete}
          initialValues={initialValues}
          mode={isEdit ? 'edit' : 'onboarding'}
        />
      </SafeAreaView>
    </>
  );
}
