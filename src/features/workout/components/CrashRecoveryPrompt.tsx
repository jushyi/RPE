/**
 * Crash recovery prompt component.
 * Checks for unfinished workout sessions on app mount and prompts to resume or discard.
 */
import { useEffect } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useWorkoutStore } from '@/stores/workoutStore';

/**
 * Renders nothing visible -- uses Alert.alert for platform-consistent dialogs.
 * Mount this in the app layout to check for unfinished sessions on app start.
 */
export default function CrashRecoveryPrompt() {
  const activeSession = useWorkoutStore((s) => s.activeSession);
  const discardSession = useWorkoutStore((s) => s.discardSession);
  const router = useRouter();

  useEffect(() => {
    if (activeSession && activeSession.ended_at === null) {
      Alert.alert(
        'Unfinished Workout',
        'You have a workout in progress. Would you like to resume?',
        [
          {
            text: 'Start Fresh',
            style: 'destructive',
            onPress: () => discardSession(),
          },
          {
            text: 'Resume',
            onPress: () => router.push('/workout' as any),
          },
        ],
        { cancelable: false }
      );
    }
    // Only check on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
