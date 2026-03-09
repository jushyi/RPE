import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { usePRBaselines } from '@/features/auth/hooks/usePRBaselines';
import { colors } from '@/constants/theme';
import type { PRBaseline } from '@/lib/supabase/types/database';

function AvatarPlaceholder({ displayName }: { displayName: string }) {
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <View style={ds.avatar}>
      <Text style={ds.avatarText}>{initials || '?'}</Text>
    </View>
  );
}

function PRCard({ baselines }: { baselines: PRBaseline[] }) {
  const router = useRouter();

  if (baselines.length === 0) {
    return (
      <Card title="Personal Records">
        <Text style={ds.cardDesc}>Set your starting PRs to track progress</Text>
        <View style={{ marginTop: 12 }}>
          <Button
            title="Set PRs"
            onPress={() => router.push('/(app)/onboarding/pr-baseline')}
            variant="secondary"
          />
        </View>
      </Card>
    );
  }

  const liftLabels: Record<string, string> = {
    bench_press: 'Bench Press',
    squat: 'Squat',
    deadlift: 'Deadlift',
  };

  return (
    <Card title="Personal Records">
      {baselines.map((b) => (
        <View key={b.exercise_name} style={ds.prRow}>
          <Text style={ds.prLabel}>{liftLabels[b.exercise_name] ?? b.exercise_name}</Text>
          <Text style={ds.prValue}>{b.weight} {b.unit}</Text>
        </View>
      ))}
    </Card>
  );
}

export default function DashboardScreen() {
  const { signOut, user } = useAuth();
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
    <SafeAreaView style={ds.safe} edges={['top']}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={ds.header}>
          <View style={ds.headerLeft}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={ds.avatarImg} />
            ) : (
              <AvatarPlaceholder displayName={displayName} />
            )}
            <View style={{ flex: 1 }}>
              <Text style={ds.greeting}>Welcome back,</Text>
              <Text style={ds.name} numberOfLines={1}>{displayName}</Text>
            </View>
          </View>
        </View>

        <View style={ds.cardWrap}>
          <Card title="Today's Workout">
            <Text style={ds.cardDesc}>No plan set up yet -- coming soon!</Text>
          </Card>
        </View>

        <View style={ds.cardWrap}>
          <Card title="Recent Activity">
            <Text style={ds.cardDesc}>Start logging workouts to see your history here</Text>
          </Card>
        </View>

        <View style={ds.cardWrap}>
          <Card title="Progress">
            <Text style={ds.cardDesc}>Your progress charts will appear here</Text>
          </Card>
        </View>

        <View style={{ marginBottom: 32 }}>
          <PRCard baselines={baselines} />
        </View>

        <Button title="Sign Out" onPress={handleSignOut} variant="ghost" loading={signingOut} />
      </ScrollView>
    </SafeAreaView>
  );
}

const ds = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  avatarImg: { width: 48, height: 48, borderRadius: 24, marginRight: 12 },
  greeting: { color: colors.textSecondary, fontSize: 14 },
  name: { color: colors.textPrimary, fontSize: 20, fontWeight: 'bold' },
  cardWrap: { marginBottom: 16 },
  cardDesc: { color: colors.textSecondary, fontSize: 14 },
  prRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  prLabel: { color: colors.textPrimary, fontSize: 16 },
  prValue: { color: colors.accent, fontWeight: 'bold', fontSize: 16 },
});
