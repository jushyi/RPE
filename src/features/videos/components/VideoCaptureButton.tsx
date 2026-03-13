/**
 * VideoCaptureButton - inline column button for attaching video to a set.
 * Styled to match Weight/Reps/RPE input field dimensions in the inputRow.
 * Shows a filled icon in accent color if video is already attached.
 */

import { View, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import { useVideoCapture } from '../hooks/useVideoCapture';

interface VideoCaptureButtonProps {
  onVideoAttached: (localUri: string, thumbnailUri: string, source: 'camera' | 'gallery') => void;
  setLogId?: string;
  hasVideo?: boolean;
}

export function VideoCaptureButton({
  onVideoAttached,
  setLogId,
  hasVideo = false,
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

  return (
    <Pressable onPress={handlePress} style={({ pressed }) => [s.container, pressed && { opacity: 0.7 }]}>
      <Ionicons
        name={hasVideo ? 'videocam' : 'videocam-outline'}
        size={24}
        color={hasVideo ? colors.accent : colors.textSecondary}
      />
    </Pressable>
  );
}

const s = StyleSheet.create({
  container: {
    minHeight: 60,
    minWidth: 56,
    borderRadius: 12,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
