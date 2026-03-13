/**
 * My Videos gallery screen - accessible from Settings.
 * Shows all videos in reverse-chronological order with storage usage info.
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Animated,
  StyleSheet,
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import { colors } from '@/constants/theme';
import { VideoThumbnail } from '@/features/videos/components/VideoThumbnail';
import { VideoPlayerModal } from '@/features/videos/components/VideoPlayerModal';
import { useVideoGallery } from '@/features/videos/hooks/useVideoGallery';
import {
  getCachedThumbnail,
  generateAndCacheThumbnail,
} from '@/features/videos/utils/thumbnailCache';
import type { VideoGalleryItem } from '@/features/videos/types';

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function renderRightActions(
  _progress: Animated.AnimatedInterpolation<number>,
  dragX: Animated.AnimatedInterpolation<number>,
) {
  const scale = dragX.interpolate({
    inputRange: [-80, 0],
    outputRange: [1, 0.5],
    extrapolate: 'clamp',
  });
  return (
    <Animated.View style={[s.deleteAction, { transform: [{ scale }] }]}>
      <Ionicons name="trash-outline" size={22} color={colors.white} />
      <Text style={s.deleteText}>Delete</Text>
    </Animated.View>
  );
}

function GalleryItem({
  item,
  onPlay,
  onDelete,
}: {
  item: VideoGalleryItem;
  onPlay: (item: VideoGalleryItem) => void;
  onDelete: (item: VideoGalleryItem) => void;
}) {
  const [thumbnailUri, setThumbnailUri] = useState<string | null>(null);
  const swipeableRef = useRef<Swipeable>(null);

  useEffect(() => {
    const cached = getCachedThumbnail(item.id);
    if (cached) {
      setThumbnailUri(cached);
    } else {
      generateAndCacheThumbnail(item.id, item.videoUrl)
        .then(setThumbnailUri)
        .catch(() => setThumbnailUri(null));
    }
  }, [item.id, item.videoUrl]);

  const handleSwipeOpen = useCallback(() => {
    Alert.alert('Delete Video?', 'This will permanently remove this video.', [
      {
        text: 'Cancel',
        style: 'cancel',
        onPress: () => swipeableRef.current?.close(),
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => onDelete(item),
      },
    ]);
  }, [item, onDelete]);

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      onSwipeableOpen={handleSwipeOpen}
      overshootRight={false}
    >
      <Pressable
        style={s.galleryItem}
        onPress={() => onPlay(item)}
      >
        <View style={s.thumbnailCol}>
          {thumbnailUri ? (
            <VideoThumbnail
              thumbnailUri={thumbnailUri}
              onPress={() => onPlay(item)}
              size={60}
            />
          ) : (
            <View style={[s.thumbnailPlaceholder, { width: 60, height: 60 }]}>
              <Ionicons name="videocam" size={24} color={colors.textMuted} />
            </View>
          )}
        </View>
        <View style={s.infoCol}>
          <Text style={s.dateText}>{formatDate(item.sessionDate)}</Text>
          <Text style={s.exerciseText} numberOfLines={1}>
            {item.exerciseName}
          </Text>
          <Text style={s.setInfoText}>
            Set {item.setNumber}: {item.weight}{item.unit} x {item.reps}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Pressable>
    </Swipeable>
  );
}

export default function VideosScreen() {
  const { videos, storageUsage, isLoading, refresh, deleteVideo } = useVideoGallery();
  const [refreshing, setRefreshing] = useState(false);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);

  useEffect(() => {
    refresh();
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const handlePlay = useCallback((item: VideoGalleryItem) => {
    setPlayingVideo(item.videoUrl);
  }, []);

  const handleDelete = useCallback(
    async (item: VideoGalleryItem) => {
      try {
        await deleteVideo(item);
      } catch {
        Alert.alert('Error', 'Failed to delete video.');
      }
    },
    [deleteVideo],
  );

  const renderItem = useCallback(
    ({ item }: { item: VideoGalleryItem }) => (
      <GalleryItem item={item} onPlay={handlePlay} onDelete={handleDelete} />
    ),
    [handlePlay, handleDelete],
  );

  const renderHeader = useCallback(
    () => (
      <View style={s.storageHeader}>
        <Ionicons name="cloud-outline" size={16} color={colors.textSecondary} />
        <Text style={s.storageText}>
          {storageUsage.count} video{storageUsage.count !== 1 ? 's' : ''} -- {storageUsage.totalMB} MB used
        </Text>
      </View>
    ),
    [storageUsage],
  );

  const renderEmpty = useCallback(
    () =>
      !isLoading ? (
        <View style={s.emptyContainer}>
          <Ionicons name="videocam-off-outline" size={48} color={colors.textMuted} />
          <Text style={s.emptyText}>No videos recorded yet</Text>
        </View>
      ) : null,
    [isLoading],
  );

  return (
    <>
      <Stack.Screen options={{ title: 'My Videos' }} />
      <View style={s.container}>
        {isLoading && videos.length === 0 ? (
          <View style={s.loadingContainer}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : (
          <FlatList
            data={videos}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            ListHeaderComponent={renderHeader}
            ListEmptyComponent={renderEmpty}
            contentContainerStyle={s.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={colors.accent}
                colors={[colors.accent]}
              />
            }
          />
        )}
      </View>

      <VideoPlayerModal
        videoUrl={playingVideo!}
        visible={!!playingVideo}
        onClose={() => setPlayingVideo(null)}
      />
    </>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  storageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    marginBottom: 4,
  },
  storageText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  galleryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  thumbnailCol: {
    marginRight: 12,
  },
  thumbnailPlaceholder: {
    borderRadius: 6,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCol: {
    flex: 1,
  },
  dateText: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: 2,
  },
  exerciseText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  setInfoText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 16,
    marginTop: 12,
  },
  deleteAction: {
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRadius: 12,
    marginBottom: 10,
  },
  deleteText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
});
