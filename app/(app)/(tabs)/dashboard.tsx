import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Alert, Animated, RefreshControl } from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { File as ExpoFile } from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { usePRBaselines } from '@/features/auth/hooks/usePRBaselines';
import { usePlans } from '@/features/plans/hooks/usePlans';
import { useCompletedToday } from '@/features/workout/hooks/useCompletedToday';
import { computeSessionSummary } from '@/features/workout/components/SessionSummary';
import { supabase } from '@/lib/supabase/client';
import { colors } from '@/constants/theme';

import { TappableAvatar } from '@/features/dashboard/components/TappableAvatar';
import { TodaysWorkoutCard } from '@/features/dashboard/components/TodaysWorkoutCard';
import { ProgressSummaryCard } from '@/features/dashboard/components/ProgressSummaryCard';
import { BodyCard } from '@/features/body-metrics/components/BodyCard';
import { DeletionBanner } from '@/features/settings/components/DeletionBanner';

import type { PRBaseline } from '@/lib/supabase/types/database';
import type { WorkoutSession } from '@/features/workout/types';

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

function PRCardSkeleton() {
  return (
    <Card title="Personal Records">
      {[1, 2, 3].map((i) => (
        <View key={i} style={ds.prRow}>
          <SkeletonBlock width={100} height={16} />
          <SkeletonBlock width={60} height={16} />
        </View>
      ))}
    </Card>
  );
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const { getPRBaselines } = usePRBaselines();
  const { fetchPlans } = usePlans();
  const { sessions: completedToday, refreshing, refresh: refreshCompleted } = useCompletedToday();
  const navigation = useNavigation();
  const [baselines, setBaselines] = useState<PRBaseline[]>([]);
  const [refreshingPRs, setRefreshingPRs] = useState(false);

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
      const expoFile = new ExpoFile(uri);
      const arrayBuffer = await expoFile.arrayBuffer();

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

  // Load PR baselines and plans once on mount (no longer re-fetches on every focus)
  useEffect(() => {
    getPRBaselines().then(setBaselines).catch(() => {});
    fetchPlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshAll = useCallback(() => {
    refreshCompleted();
    setRefreshingPRs(true);
    getPRBaselines()
      .then(setBaselines)
      .catch(() => {})
      .finally(() => setRefreshingPRs(false));
    fetchPlans(true);  // Force re-fetch on pull-to-refresh
  }, [refreshCompleted, getPRBaselines, fetchPlans]);

  // Refresh only when re-tapping the home icon while already on dashboard
  useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress', (e) => {
      if (navigation.isFocused()) {
        refreshAll();
      }
    });
    return unsubscribe;
  }, [navigation, refreshAll]);

  const insets = useSafeAreaInsets();
  const HEADER_HEIGHT = 80;
  const lastScrollY = useRef(0);
  const headerTranslateY = useRef(new Animated.Value(0)).current;
  const headerVisible = useRef(true);
  const contentHeight = useRef(0);
  const scrollViewHeight = useRef(0);

  const handleScroll = (event: any) => {
    const currentY = event.nativeEvent.contentOffset.y;
    const diff = currentY - lastScrollY.current;
    const maxScroll = contentHeight.current - scrollViewHeight.current;
    lastScrollY.current = currentY;

    // Ignore overscroll at top and bottom (bounce)
    if (currentY <= 0 || currentY >= maxScroll) return;

    if (diff > 0 && headerVisible.current) {
      // Scrolling down — hide (slide behind status bar cover)
      headerVisible.current = false;
      Animated.timing(headerTranslateY, {
        toValue: -HEADER_HEIGHT,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else if (diff < 0 && !headerVisible.current) {
      // Any scroll up — fully show
      headerVisible.current = true;
      Animated.timing(headerTranslateY, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  };

  return (
    <View style={ds.safe}>
      <View style={[ds.statusBarCover, { height: insets.top }]} />
      <Animated.View style={[ds.header, { height: HEADER_HEIGHT, top: insets.top, transform: [{ translateY: headerTranslateY }] }]}>
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
      </Animated.View>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: insets.top + HEADER_HEIGHT, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        onContentSizeChange={(_, h) => { contentHeight.current = h; }}
        onLayout={(e) => { scrollViewHeight.current = e.nativeEvent.layout.height; }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshAll}
            tintColor={colors.textMuted}
            colors={[colors.accent]}
            progressViewOffset={insets.top + HEADER_HEIGHT}
          />
        }
      >

        {/* Grace period deletion banner */}
        <DeletionBanner />

        {/* Completed workouts for today (if any) */}
        {completedToday.length > 0 && (
          <View style={ds.completedSection}>
            <Text style={ds.completedSectionTitle}>Today's Workouts</Text>
            {completedToday.map((s, i) => (
              <CompletedWorkoutCard key={s.id} session={s} index={i} isOnly={completedToday.length === 1} />
            ))}
          </View>
        )}

        {/* Card 1: Today's Workout */}
        <TodaysWorkoutCard completedSessions={completedToday} />

        {/* Card 2: Progress Summary */}
        <View style={ds.cardWrap}>
          <ProgressSummaryCard />
        </View>

        {/* Card 3: Body (bodyweight + measurements) */}
        <View style={ds.cardWrap}>
          <BodyCard />
        </View>

        {/* Card 4: PR Baselines (last) */}
        <View style={{ marginBottom: 32 }}>
          {refreshingPRs ? <PRCardSkeleton /> : <PRCard baselines={baselines} />}
        </View>
      </ScrollView>
    </View>
  );
}

const ds = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  statusBarCover: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    backgroundColor: colors.background,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: colors.background,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
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
  completedSection: {
    marginTop: 8,
    marginBottom: 6,
  },
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
  completedSectionTitle: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 12,
  },
});
