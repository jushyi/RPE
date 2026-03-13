import React, { useCallback, useRef, useState } from 'react';
import { View, Text, Pressable, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';

let ExpoVideo: typeof import('expo-video') | null = null;
try {
  ExpoVideo = require('expo-video');
} catch {
  // Native module not available (e.g., Expo Go)
}

interface VideoPlayerModalProps {
  videoUrl: string;
  visible: boolean;
  onClose: () => void;
}

/** Shared swipe-dismissable video player modal using pageSheet presentation */
export function VideoPlayerModal({ videoUrl, visible, onClose }: VideoPlayerModalProps) {
  if (!ExpoVideo) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <View style={s.playerContainer}>
          <Text style={s.unavailableText}>Video playback not available</Text>
          <Pressable style={s.closeButton} onPress={onClose} hitSlop={12}>
            <Ionicons name="close-circle" size={32} color={colors.white} />
          </Pressable>
        </View>
      </Modal>
    );
  }

  return <VideoPlayerInner videoUrl={videoUrl} visible={visible} onClose={onClose} />;
}

/** Inner component that uses useVideoPlayer hook (only rendered when ExpoVideo is available) */
function VideoPlayerInner({ videoUrl, visible, onClose }: VideoPlayerModalProps) {
  const videoViewRef = useRef<any>(null);
  const { useVideoPlayer, VideoView } = ExpoVideo!;
  const [isPlaying, setIsPlaying] = useState(true);
  const player = useVideoPlayer(visible ? videoUrl : null, (p) => {
    p.play();
  });

  const togglePlayPause = useCallback(() => {
    if (!player) return;
    if (isPlaying) {
      player.pause();
      setIsPlaying(false);
    } else {
      player.play();
      setIsPlaying(true);
    }
  }, [player, isPlaying]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      supportedOrientations={['portrait', 'landscape']}
      onRequestClose={onClose}
    >
      <View style={s.playerContainer}>
        <Pressable style={s.videoTapArea} onPress={togglePlayPause}>
          <VideoView
            ref={videoViewRef}
            player={player}
            style={s.videoView}
            nativeControls={false}
            contentFit="contain"
            allowsVideoFrameAnalysis={false}
          />
        </Pressable>
        <Pressable style={s.closeButton} onPress={onClose} hitSlop={12}>
          <Ionicons name="close-circle" size={32} color={colors.white} />
        </Pressable>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  playerContainer: {
    flex: 1,
    backgroundColor: colors.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoView: {
    width: '100%',
    height: '100%',
  },
  videoTapArea: {
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
  },
  unavailableText: {
    color: colors.white,
    fontSize: 16,
  },
});
