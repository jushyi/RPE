import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, Alert, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import { VideoThumbnail } from '@/features/videos/components/VideoThumbnail';
import { VideoPlayerModal } from '@/features/videos/components/VideoPlayerModal';
import { useVideoUpload } from '@/features/videos/hooks/useVideoUpload';
import {
  getCachedThumbnail,
  generateAndCacheThumbnail,
} from '@/features/videos/utils/thumbnailCache';
import type { HistorySetLog } from '../types';

interface SetRowProps {
  set: HistorySetLog;
  sessionExerciseId: string;
  onDeleteSet: (setId: string, sessionExerciseId: string) => void;
  onVideoDeleted?: (setId: string) => void;
}

export function SetRow({ set, sessionExerciseId, onDeleteSet, onVideoDeleted }: SetRowProps) {
  const [thumbnailUri, setThumbnailUri] = useState<string | null>(null);
  const [showPlayer, setShowPlayer] = useState(false);
  const { deleteVideo } = useVideoUpload();

  // Load or generate thumbnail when video_url exists
  useEffect(() => {
    if (!set.video_url) {
      setThumbnailUri(null);
      return;
    }

    const cached = getCachedThumbnail(set.id);
    if (cached) {
      setThumbnailUri(cached);
    } else {
      generateAndCacheThumbnail(set.id, set.video_url).then(setThumbnailUri).catch(() => {
        setThumbnailUri(null);
      });
    }
  }, [set.id, set.video_url]);

  const handleThumbnailPress = useCallback(() => {
    setShowPlayer(true);
  }, []);

  const handleLongPress = useCallback(() => {
    Alert.alert('Delete Video?', 'This will permanently remove the video from this set.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteVideo(set.id);
            onVideoDeleted?.(set.id);
          } catch (err) {
            console.warn('Failed to delete video:', err);
          }
        },
      },
    ]);
  }, [set.id, deleteVideo, onVideoDeleted]);

  const handleDelete = () => {
    Alert.alert(
      'Delete Set?',
      `Set ${set.set_number} will be permanently removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDeleteSet(set.id, sessionExerciseId),
        },
      ]
    );
  };

  return (
    <>
      <View style={s.row}>
        <Text style={s.setLabel}>Set {set.set_number}</Text>
        <Text style={s.weight}>
          {set.weight} {set.unit}
        </Text>
        <Text style={s.reps}>x {set.reps}</Text>
        {set.is_pr && (
          <Ionicons
            name="trophy"
            size={14}
            color={colors.warning}
            style={s.prIcon}
          />
        )}
        {set.video_url && thumbnailUri && (
          <Pressable onLongPress={handleLongPress} style={s.thumbnailWrapper}>
            <VideoThumbnail
              thumbnailUri={thumbnailUri}
              onPress={handleThumbnailPress}
              size={40}
            />
          </Pressable>
        )}
        <Pressable onPress={handleDelete} hitSlop={8} style={s.deleteButton}>
          <Ionicons name="close-circle-outline" size={18} color={colors.textMuted} />
        </Pressable>
      </View>

      <VideoPlayerModal
        videoUrl={set.video_url!}
        visible={showPlayer}
        onClose={() => setShowPlayer(false)}
      />
    </>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.surfaceElevated,
  },
  setLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    width: 50,
  },
  weight: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    width: 80,
  },
  reps: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  prIcon: {
    marginLeft: 8,
  },
  thumbnailWrapper: {
    marginLeft: 8,
  },
  deleteButton: {
    marginLeft: 8,
    padding: 4,
  },
});
