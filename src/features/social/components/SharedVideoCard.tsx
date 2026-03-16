import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Modal, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VideoView, useVideoPlayer } from 'expo-video';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/constants/theme';
import type { SharedItem, VideoSharePayload } from '@/features/social/types';

interface SharedVideoCardProps {
  item: SharedItem & { content_type: 'video'; payload: VideoSharePayload };
  authorName: string;
  authorAvatar: string | null;
  /** Relative timestamp string e.g. "2h ago" */
  timeLabel: string;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
// Card content width accounting for horizontal padding in feed
const THUMB_HEIGHT = 180;

export function SharedVideoCard({
  item,
  authorName,
  timeLabel,
}: SharedVideoCardProps) {
  const payload = item.payload as VideoSharePayload;
  const initial = (authorName ?? 'U').charAt(0).toUpperCase();
  const [modalVisible, setModalVisible] = useState(false);

  const player = useVideoPlayer(payload.video_url, (p) => {
    p.loop = false;
  });

  const handlePlayPress = useCallback(() => {
    setModalVisible(true);
    player.play();
  }, [player]);

  const handleCloseModal = useCallback(() => {
    player.pause();
    setModalVisible(false);
  }, [player]);

  return (
    <>
      <View style={s.card}>
        {/* Header */}
        <View style={s.header}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initial}</Text>
          </View>
          <View style={s.headerInfo}>
            <Text style={s.authorName} numberOfLines={1}>
              {authorName}
            </Text>
            <Text style={s.timestamp}>{timeLabel}</Text>
          </View>
          <Ionicons name="videocam-outline" size={18} color={colors.accent} />
        </View>

        {/* Thumbnail area - tap to play */}
        <Pressable style={s.thumbnailContainer} onPress={handlePlayPress}>
          <View style={s.thumbnailPlaceholder}>
            <Ionicons name="play-circle-outline" size={52} color={colors.white} />
          </View>
        </Pressable>

        {/* Exercise info */}
        <View style={s.footer}>
          <Text style={s.exerciseName}>{payload.exercise_name}</Text>
          <Text style={s.weightText}>
            {payload.weight} {payload.unit} x {payload.reps} reps
            {' '}
            <Text style={s.setLabel}>· Set {payload.set_number}</Text>
          </Text>
        </View>
      </View>

      {/* Fullscreen modal player */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseModal}
      >
        <SafeAreaView style={s.modalContainer} edges={['top', 'bottom']}>
          <View style={s.modalHeader}>
            <View style={s.modalTitleBlock}>
              <Text style={s.modalTitle} numberOfLines={1}>
                {payload.exercise_name}
              </Text>
              <Text style={s.modalSubtitle}>
                {payload.weight} {payload.unit} x {payload.reps} reps · Set {payload.set_number}
              </Text>
            </View>
            <Pressable style={s.closeBtn} onPress={handleCloseModal} hitSlop={12}>
              <Ionicons name="close" size={22} color={colors.textPrimary} />
            </Pressable>
          </View>

          <View style={s.videoWrapper}>
            <VideoView
              player={player}
              style={s.video}
              contentFit="contain"
              nativeControls
            />
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.surfaceElevated,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceElevated,
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
  headerInfo: {
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
  thumbnailContainer: {
    height: THUMB_HEIGHT,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.7,
  },
  footer: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  weightText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  setLabel: {
    color: colors.textMuted,
  },
  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceElevated,
  },
  modalTitleBlock: {
    flex: 1,
    marginRight: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoWrapper: {
    flex: 1,
    backgroundColor: colors.black,
  },
  video: {
    flex: 1,
    width: '100%',
  },
});
