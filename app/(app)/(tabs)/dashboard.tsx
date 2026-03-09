import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useAuthStore } from '@/stores/authStore';
import { usePRBaselines } from '@/features/auth/hooks/usePRBaselines';
import type { PRBaseline } from '@/lib/supabase/types/database';

function AvatarPlaceholder({ displayName }: { displayName: string }) {
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <View className="w-12 h-12 rounded-full bg-accent items-center justify-center mr-3">
      <Text className="text-white font-bold text-lg">{initials || '?'}</Text>
    </View>
  );
}

function PRCard({ baselines }: { baselines: PRBaseline[] }) {
  const router = useRouter();

  if (baselines.length === 0) {
    return (
      <Card title="Personal Records">
        <Text className="text-text-secondary text-sm mb-3">
          Set your starting PRs to track progress
        </Text>
        <Button
          title="Set PRs"
          onPress={() => router.push('/(app)/onboarding/pr-baseline')}
          variant="secondary"
        />
      </Card>
    );
  }

  const liftLabels: Record<string, string> = {
    bench_press: 'Bench Press',
    squat: 'Squat',
    deadlift: 'Deadlift',
  };

  const liftIcons: Record<string, string> = {
    bench_press: '🏋️',
    squat: '🦵',
    deadlift: '💪',
  };

  return (
    <Card title="Personal Records">
      {baselines.map((b) => (
        <View key={b.exercise_name} className="flex-row items-center justify-between py-2">
          <View className="flex-row items-center">
            <Text className="text-xl mr-2">{liftIcons[b.exercise_name] ?? '🏋️'}</Text>
            <Text className="text-text-primary text-base">
              {liftLabels[b.exercise_name] ?? b.exercise_name}
            </Text>
          </View>
          <Text className="text-accent font-bold text-base">
            {b.weight} {b.unit}
          </Text>
        </View>
      ))}
    </Card>
  );
}

export default function DashboardScreen() {
  const { signOut, user, isLoading: authLoading } = useAuth();
  const { getPRBaselines } = usePRBaselines();
  const [baselines, setBaselines] = useState<PRBaseline[]>([]);
  const [signingOut, setSigningOut] = useState(false);

  const displayName =
    user?.user_metadata?.display_name ?? user?.email?.split('@')[0] ?? 'Athlete';

  const avatarUrl = user?.user_metadata?.avatar_url ?? null;

  useEffect(() => {
    getPRBaselines().then(setBaselines).catch(() => {});
  }, [getPRBaselines]);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } catch {
      setSigningOut(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-6 pt-6">
          {/* Header with avatar and greeting */}
          <View className="flex-row items-center justify-between mb-8">
            <View className="flex-row items-center flex-1">
              {avatarUrl ? (
                <Image
                  source={{ uri: avatarUrl }}
                  className="w-12 h-12 rounded-full mr-3"
                />
              ) : (
                <AvatarPlaceholder displayName={displayName} />
              )}
              <View className="flex-1">
                <Text className="text-text-secondary text-sm">Welcome back,</Text>
                <Text className="text-text-primary text-xl font-bold" numberOfLines={1}>
                  {displayName}
                </Text>
              </View>
            </View>
          </View>

          {/* Today's Workout placeholder */}
          <View className="mb-4">
            <Card title="Today's Workout">
              <View className="flex-row items-center">
                <Text className="text-3xl mr-3">📋</Text>
                <Text className="text-text-secondary text-sm flex-1">
                  No plan set up yet — coming soon!
                </Text>
              </View>
            </Card>
          </View>

          {/* Recent Activity placeholder */}
          <View className="mb-4">
            <Card title="Recent Activity">
              <View className="flex-row items-center">
                <Text className="text-3xl mr-3">📊</Text>
                <Text className="text-text-secondary text-sm flex-1">
                  Start logging workouts to see your history here
                </Text>
              </View>
            </Card>
          </View>

          {/* Progress placeholder */}
          <View className="mb-4">
            <Card title="Progress">
              <View className="flex-row items-center">
                <Text className="text-3xl mr-3">📈</Text>
                <Text className="text-text-secondary text-sm flex-1">
                  Your progress charts will appear here
                </Text>
              </View>
            </Card>
          </View>

          {/* Personal Records */}
          <View className="mb-8">
            <PRCard baselines={baselines} />
          </View>

          {/* Sign out */}
          <Button
            title="Sign Out"
            onPress={handleSignOut}
            variant="ghost"
            loading={signingOut}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
