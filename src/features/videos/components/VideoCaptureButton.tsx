/**
 * VideoCaptureButton - compact button for attaching video to a set.
 * Shows a thumbnail when a video is already attached, otherwise shows a camera icon.
 */

import { Image, Pressable, View, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import { useVideoCapture } from '../hooks/useVideoCapture';

interface VideoCaptureButtonProps {
  onVideoAttached: (localUri: string, thumbnailUri: string, source: 'camera' | 'gallery') => void;
  setLogId?: string;
  hasVideo?: boolean;
  thumbnailUri?: string | null;
}

export function VideoCaptureButton({
  onVideoAttached,
  setLogId,
  hasVideo = false,
  thumbnailUri,
}: VideoCaptureButtonProps) {
  const { captureOrPickVideo, isCapturing } = useVideoCapture();

  const handlePress = async () => {
    const result = await captureOrPickVideo(setLogId);
    if (result) {
      onVideoAttached(result.localUri, result.thumbnailUri, result.source);
    }
  };

  if (isCapturing) {
    return (
      <View style={s.container}>
        <ActivityIndicator size="small" color={colors.accent} />
      </View>
    );
  }

  // Show thumbnail if video is attached
  if (hasVideo && thumbnailUri) {
    return (
      <Pressable onPress={handlePress} style={({ pressed }) => [s.thumbnailContainer, pressed && { opacity: 0.7 }]}>
        <Image source={{ uri: thumbnailUri }} style={s.thumbnailImage} resizeMode="cover" />
        <View style={s.thumbnailOverlay}>
          <Ionicons name="videocam" size={14} color="rgba(255,255,255,0.9)" />
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={handlePress} style={({ pressed }) => [s.container, pressed && { opacity: 0.7 }]}>
      <Ionicons
        name="videocam-outline"
        size={22}
        color={colors.textMuted}
      />
    </Pressable>
  );
}

const s = StyleSheet.create({
  container: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: colors.surfaceElevated,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
});
