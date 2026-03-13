import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase/client';
import { useSocialStore } from '@/stores/socialStore';
import { ReactionBar } from '@/features/social/components/ReactionBar';
import { SharedPRCard } from '@/features/social/components/SharedPRCard';
import { SharedVideoCard } from '@/features/social/components/SharedVideoCard';
import { getTimeLabel } from '@/features/social/utils/timeLabel';
import type { SharedItem, FriendProfile, WorkoutSharePayload } from '@/features/social/types';

export default function SharedItemDetailScreen() {
  const { itemId, groupId } = useLocalSearchParams<{
    itemId: string;
    groupId: string;
  }>();

  const feedItems = useSocialStore((s) => s.feedItems);
  const allItems = feedItems[groupId ?? ''] ?? [];
  const item: SharedItem | undefined = allItems.find((i) => i.id === itemId);

  const [author, setAuthor] = useState<FriendProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!item?.user_id) return;
    setLoading(true);
    supabase
      .from('profiles')
      .select('id, display_name, avatar_url, handle')
      .eq('id', item.user_id)
      .single()
      .then(({ data, error }) => {
        setLoading(false);
        if (error || !data) return;
        const p = data as any;
        setAuthor({
          id: p.id,
          display_name: p.display_name ?? '',
          avatar_url: p.avatar_url ?? null,
          handle: p.handle ?? '',
        });
      });
  }, [item?.user_id]);

  if (!item) {
    return (
      <SafeAreaView style={s.safeArea} edges={['bottom']}>
        <Stack.Screen
          options={{
            title: 'Detail',
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.textPrimary,
            headerTitleStyle: { color: colors.textPrimary, fontWeight: '700' },
          }}
        />
        <View style={s.centered}>
          <ActivityIndicator color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  const authorName = author?.display_name ?? 'Someone';
  const authorAvatar = author?.avatar_url ?? null;
  const timeLabel = getTimeLabel(item.created_at);

  const renderContent = () => {
    if (item.content_type === 'workout') {
      const payload = item.payload as WorkoutSharePayload;
      return (
        <View>
          {/* Workout header */}
          <View style={s.authorRow}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{(authorName).charAt(0).toUpperCase()}</Text>
            </View>
            <View style={s.authorInfo}>
              <Text style={s.authorName}>{authorName}</Text>
              <Text style={s.timestamp}>{timeLabel}</Text>
            </View>
            <Ionicons name="barbell-outline" size={18} color={colors.accent} />
          </View>

          <Text style={s.sectionTitle}>Workout Summary</Text>

          {/* Stats grid */}
          <View style={s.statsGrid}>
            <View style={s.statCard}>
              <Ionicons name="layers-outline" size={20} color={colors.accent} />
              <Text style={s.statValue}>{payload.total_sets}</Text>
              <Text style={s.statLabel}>Sets</Text>
            </View>
            <View style={s.statCard}>
              <Ionicons name="fitness-outline" size={20} color={colors.accent} />
              <Text style={s.statValue}>{payload.total_volume.toFixed(0)}</Text>
              <Text style={s.statLabel}>Volume</Text>
            </View>
            <View style={s.statCard}>
              <Ionicons name="time-outline" size={20} color={colors.accent} />
              <Text style={s.statValue}>{payload.duration_minutes}</Text>
              <Text style={s.statLabel}>Minutes</Text>
            </View>
          </View>

          {/* Exercise list */}
          <Text style={s.sectionTitle}>Exercises</Text>
          {payload.exercise_names.map((name, idx) => (
            <View key={idx} style={s.exerciseRow}>
              <Ionicons name="checkmark-circle-outline" size={16} color={colors.success} />
              <Text style={s.exerciseName}>{name}</Text>
            </View>
          ))}
        </View>
      );
    }

    if (item.content_type === 'pr') {
      return (
        <SharedPRCard
          item={item as any}
          authorName={authorName}
          authorAvatar={authorAvatar}
          timeLabel={timeLabel}
        />
      );
    }

    if (item.content_type === 'video') {
      return (
        <SharedVideoCard
          item={item as any}
          authorName={authorName}
          authorAvatar={authorAvatar}
          timeLabel={timeLabel}
        />
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={s.safeArea} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: item.content_type === 'workout'
            ? 'Workout'
            : item.content_type === 'pr'
            ? 'Personal Record'
            : 'Video',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.textPrimary,
          headerTitleStyle: { color: colors.textPrimary, fontWeight: '700' },
        }}
      />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
      >
        {loading ? (
          <ActivityIndicator color={colors.accent} style={s.loader} />
        ) : (
          <View style={s.card}>{renderContent()}</View>
        )}
      </ScrollView>

      {/* Reaction bar pinned at bottom */}
      <View style={s.reactionContainer}>
        <ReactionBar sharedItemId={item.id} />
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 8,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.surfaceElevated,
    overflow: 'hidden',
    padding: 16,
  },
  loader: {
    marginTop: 32,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accent + '33',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.accent,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  timestamp: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 1,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textMuted,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceElevated,
  },
  exerciseName: {
    fontSize: 15,
    color: colors.textPrimary,
  },
  reactionContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.surfaceElevated,
    backgroundColor: colors.surface,
  },
});
