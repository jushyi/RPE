/**
 * VideoCaptureButton - camera icon button for attaching video to a set.
 * Shows a filled icon if video is already attached.
 */

import { Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import { useVideoCapture } from '../hooks/useVideoCapture';

interface VideoCaptureButtonProps {
  onVideoAttached: (localUri: string, thumbnailUri: string) => void;
  setLogId: string;
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
      onVideoAttached(result.localUri, result.thumbnailUri);
    }
  };

  if (isCapturing) {
    return (
      <Pressable style={s.button} disabled>
        <ActivityIndicator size="small" color={colors.accent} />
      </Pressable>
    );
  }

  return (
    <Pressable onPress={handlePress} style={s.button}>
      <Ionicons
        name={hasVideo ? 'videocam' : 'videocam-outline'}
        size={20}
        color={hasVideo ? colors.accent : colors.textSecondary}
      />
    </Pressable>
  );
}

const s = StyleSheet.create({
  button: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
