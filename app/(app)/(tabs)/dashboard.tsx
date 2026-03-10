import { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, ScrollView, Image, StyleSheet, Pressable, Alert, Animated } from 'react-native';
import { useRouter, useFocusEffect, useNavigation } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { usePRBaselines } from '@/features/auth/hooks/usePRBaselines';
import { usePlans } from '@/features/plans/hooks/usePlans';
import { useWorkoutSession } from '@/features/workout/hooks/useWorkoutSession';
import { useCompletedToday } from '@/features/workout/hooks/useCompletedToday';
import { computeSessionSummary } from '@/features/workout/components/SessionSummary';
import { supabase } from '@/lib/supabase/client';
import { colors } from '@/constants/theme';
import type { PRBaseline } from '@/lib/supabase/types/database';
import type { PlanDay } from '@/features/plans/types';
import type { WorkoutSession } from '@/features/workout/types';

function TappableAvatar({
  displayName,
  avatarUrl,
  onPhotoChanged,
}: {
  displayName: string;
  avatarUrl: string | null;
  onPhotoChanged: (uri: string) => void;
}) {
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handlePress = () => {
    Alert.alert('Profile Photo', 'Choose a photo source', [
      { text: 'Take Photo', onPress: () => pickPhoto('camera') },
      { text: 'Choose from Gallery', onPress: () => pickPhoto('gallery') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const pickPhoto = async (source: 'camera' | 'gallery') => {
    if (source === 'camera') {
      const { granted } = await ImagePicker.requestCameraPermissionsAsync();
      if (!granted) { Alert.alert('Permission Required', 'Camera access is needed.'); return; }
      const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 });
      if (!result.canceled && result.assets[0]) onPhotoChanged(result.assets[0].uri);
    } else {
      const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!granted) { Alert.alert('Permission Required', 'Gallery access is needed.'); return; }
      const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 });
      if (!result.canceled && result.assets[0]) onPhotoChanged(result.assets[0].uri);
    }
  };

  return (
    <Pressable onPress={handlePress} style={{ opacity: 1 }}>
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={ds.avatarImg} />
      ) : (
        <View style={ds.avatar}>
          <Text style={ds.avatarText}>{initials || '?'}</Text>
        </View>
      )}
    </Pressable>
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

  const handleEdit = () => {
    router.push({
      pathname: '/(app)/onboarding/pr-baseline',
      params: {
        mode: 'edit',
        baselines: JSON.stringify(baselines.map((b) => ({
          exercise_name: b.exercise_name,
          weight: b.weight,
          unit: b.unit,
        }))),
      },
    });
  };

  return (
    <Pressable
      onPress={handleEdit}
      style={({ pressed }) => [pressed && { opacity: 0.8 }]}
      android_ripple={{ color: colors.surfaceElevated }}
    >
      <Card title="Personal Records">
        {baselines.map((b) => (
          <View key={b.exercise_name} style={ds.prRow}>
            <Text style={ds.prLabel}>{liftLabels[b.exercise_name] ?? b.exercise_name}</Text>
            <Text style={ds.prValue}>{b.weight} {b.unit}</Text>
          </View>
        ))}
      </Card>
    </Pressable>
  );
}

/** Format volume with K suffix for large numbers */
function formatVolume(volume: number): string {
  if (volume >= 10000) return `${(volume / 1000).toFixed(1)}K`;
  return volume.toLocaleString();
}

/** Format duration as Xh Ym or Xm */
function formatDuration(minutes: number): string {
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${minutes}m`;
}

function CompletedWorkoutCard({ session, index, isOnly }: { session: WorkoutSession; index: number; isOnly: boolean }) {
  const [expanded, setExpanded] = useState(isOnly);
  const summary = computeSessionSummary(session);

  const startTime = new Date(session.started_at);
  const timeLabel = startTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  const headerContent = (
    <View style={ds.completedHeaderLeft}>
      <Ionicons name="checkmark-circle" size={18} color={colors.success} />
      <View>
        <Text style={ds.completedTitle}>
          {session.title || `Workout ${index + 1}`}
        </Text>
        <Text style={ds.completedMeta}>
          {timeLabel}  {formatDuration(summary.duration_minutes)}  {formatVolume(summary.total_volume)} vol
        </Text>
      </View>
    </View>
  );

  return (
    <View style={ds.completedCard}>
      {isOnly ? (
        <View style={ds.completedHeader}>
          {headerContent}
        </View>
      ) : (
        <Pressable onPress={() => setExpanded((p) => !p)} style={ds.completedHeader}>
          {headerContent}
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={colors.textMuted}
          />
        </Pressable>
      )}

      {expanded && (
        <View style={ds.completedBody}>
          {session.exercises.map((exercise) => {
            if (exercise.logged_sets.length === 0) return null;
            return (
              <View key={exercise.id} style={ds.completedExCard}>
                <Text style={ds.completedExName}>{exercise.exercise_name}</Text>
                <View style={ds.completedSetsTable}>
                  <View style={ds.completedSetsHeaderRow}>
                    <Text style={[ds.completedSetsHeaderCell, ds.setNumCol]}>Set</Text>
                    <Text style={[ds.completedSetsHeaderCell, ds.setValCol]}>Weight</Text>
                    <Text style={[ds.completedSetsHeaderCell, ds.setValCol]}>Reps</Text>
                    <Text style={[ds.completedSetsHeaderCell, ds.setValCol]}>RPE</Text>
                  </View>
                  {exercise.logged_sets.map((set) => (
                    <View key={set.id} style={ds.completedSetsRow}>
                      <Text style={[ds.completedSetsCell, ds.setNumCol]}>{set.set_number}</Text>
                      <Text style={[ds.completedSetsCell, ds.setValCol]}>
                        {set.weight} {exercise.unit}
                      </Text>
                      <Text style={[ds.completedSetsCell, ds.setValCol]}>{set.reps}</Text>
                      <Text style={[ds.completedSetsCell, ds.setValCol]}>
                        {set.rpe ?? '--'}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

function SkeletonBlock({ width, height, style }: { width: number | string; height: number; style?: any }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 600, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 600, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        { width, height, borderRadius: 8, backgroundColor: colors.surfaceElevated, opacity },
        style,
      ]}
    />
  );
}

function DashboardSkeleton() {
  return (
    <View style={ds.todayCard}>
      <View style={ds.todayHeader}>
        <View>
          <SkeletonBlock width={100} height={13} />
          <SkeletonBlock width={140} height={18} style={{ marginTop: 6 }} />
        </View>
        <SkeletonBlock width={80} height={12} />
      </View>
      <SkeletonBlock width="100%" height={48} style={{ marginBottom: 8 }} />
      <SkeletonBlock width="100%" height={48} />
    </View>
  );
}

export default function DashboardScreen() {
  const { signOut, user } = useAuth();
  const { getPRBaselines } = usePRBaselines();
  const { plans, fetchPlans } = usePlans();
  const { startFreestyle, startFromPlan } = useWorkoutSession();
  const { sessions: completedToday, refreshing, refresh: refreshCompleted } = useCompletedToday();
  const navigation = useNavigation();
  const [baselines, setBaselines] = useState<PRBaseline[]>([]);
  const [signingOut, setSigningOut] = useState(false);

  const displayName =
    user?.user_metadata?.display_name ?? user?.email?.split('@')[0] ?? 'Athlete';

  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    user?.user_metadata?.avatar_url ?? null
  );

  // Sync avatar with auth user metadata on session refresh / reload
  useEffect(() => {
    const url = user?.user_metadata?.avatar_url ?? null;
    if (url) setAvatarUrl(url);
  }, [user?.user_metadata?.avatar_url]);

  const handlePhotoChanged = async (uri: string) => {
    const previousUrl = avatarUrl;
    setAvatarUrl(uri); // Show immediately (optimistic)
    if (!supabase || !user) return;
    try {
      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();

      const filePath = `${user.id}/avatar.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, arrayBuffer, { contentType: 'image/jpeg', upsert: true });

      if (uploadError) {
        setAvatarUrl(previousUrl);
        Alert.alert('Upload Failed', 'Could not update your profile photo. Please try again.');
        return;
      }

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      if (urlData?.publicUrl) {
        const cacheBustedUrl = `${urlData.publicUrl}?t=${Date.now()}`;
        await supabase.auth.updateUser({ data: { avatar_url: cacheBustedUrl } });
        setAvatarUrl(cacheBustedUrl);
      }
    } catch (err) {
      console.warn('Avatar upload failed:', err);
      setAvatarUrl(previousUrl);
      Alert.alert('Upload Failed', 'Could not update your profile photo. Please try again.');
    }
  };

  useFocusEffect(
    useCallback(() => {
      getPRBaselines().then(setBaselines).catch(() => {});
      fetchPlans();
    }, [getPRBaselines, fetchPlans])
  );

  // Refresh all data when tapping the home icon while already on dashboard
  useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress', () => {
      refreshCompleted();
      getPRBaselines().then(setBaselines).catch(() => {});
      fetchPlans();
    });
    return unsubscribe;
  }, [navigation, refreshCompleted, getPRBaselines, fetchPlans]);

  // Find active plan and today's matching day
  const activePlan = plans.find((p) => p.is_active);
  const todayWeekday = new Date().getDay(); // 0=Sun, 1=Mon, ...
  const todayDay: PlanDay | undefined = activePlan?.plan_days.find(
    (d) => d.weekday === todayWeekday
  );

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
            <TappableAvatar
              displayName={displayName}
              avatarUrl={avatarUrl}
              onPhotoChanged={handlePhotoChanged}
            />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={ds.greeting}>Welcome back,</Text>
              <Text style={ds.name} numberOfLines={1}>{displayName}</Text>
            </View>
          </View>
        </View>

        {refreshing ? (
          <DashboardSkeleton />
        ) : todayDay ? (
          <View style={ds.todayCard}>
            <View style={ds.todayHeader}>
              <View>
                <Text style={ds.todayLabel}>Today's Workout</Text>
                <Text style={ds.todayDayName}>{todayDay.day_name}</Text>
              </View>
              <Text style={ds.todayPlanName}>{activePlan?.name}</Text>
            </View>

            {completedToday.length > 0 ? (
              <View>
                {completedToday.map((s, i) => (
                  <CompletedWorkoutCard key={s.id} session={s} index={i} isOnly={completedToday.length === 1} />
                ))}
              </View>
            ) : (
              <>
                {todayDay.plan_day_exercises.length > 0 && (
                  <View style={ds.todayExercises}>
                    {todayDay.plan_day_exercises.map((ex, idx) => (
                      <View key={ex.id || `ex-${idx}`} style={ds.todayExRow}>
                        <Text style={ds.todayExName}>{ex.exercise?.name ?? 'Exercise'}</Text>
                        <Text style={ds.todayExSets}>{ex.target_sets.length} sets</Text>
                      </View>
                    ))}
                  </View>
                )}
                <Pressable
                  onPress={() => startFromPlan(todayDay)}
                  style={({ pressed }) => [ds.startTodayBtn, pressed && { opacity: 0.8 }]}
                >
                  <Ionicons name="play" size={18} color="#fff" />
                  <Text style={ds.startTodayText}>Start Workout</Text>
                </Pressable>
              </>
            )}
          </View>
        ) : (
          <Pressable
            onPress={startFreestyle}
            style={({ pressed }) => [ds.quickWorkoutBtn, pressed && { opacity: 0.8 }]}
          >
            <Ionicons name="barbell-outline" size={22} color="#fff" />
            <Text style={ds.quickWorkoutText}>Quick Workout</Text>
          </Pressable>
        )}

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
  avatarImg: { width: 48, height: 48, borderRadius: 24 },
  greeting: { color: colors.textSecondary, fontSize: 14 },
  name: { color: colors.textPrimary, fontSize: 20, fontWeight: 'bold' },
  todayCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.surfaceElevated,
  },
  todayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  todayLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  todayDayName: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 2,
  },
  todayPlanName: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  todayExercises: {
    marginBottom: 12,
  },
  todayExRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceElevated,
  },
  todayExName: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  todayExSets: {
    color: colors.textMuted,
    fontSize: 13,
  },
  startTodayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 12,
  },
  startTodayText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  quickWorkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 16,
    marginBottom: 16,
  },
  quickWorkoutText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
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
  completedCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.surfaceElevated,
    marginBottom: 10,
  },
  completedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  completedHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  completedTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  completedMeta: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 1,
  },
  completedBody: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  completedExCard: {
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  completedExName: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  completedSetsTable: {
    marginTop: 2,
  },
  completedSetsHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceElevated,
    paddingBottom: 4,
    marginBottom: 2,
  },
  completedSetsHeaderCell: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  completedSetsRow: {
    flexDirection: 'row',
    paddingVertical: 3,
  },
  completedSetsCell: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  setNumCol: {
    width: 36,
  },
  setValCol: {
    flex: 1,
    textAlign: 'center',
  },
});
