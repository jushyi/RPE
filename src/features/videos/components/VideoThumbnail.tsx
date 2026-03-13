/**
 * VideoThumbnail - displays a video thumbnail with a play icon overlay.
 * Used in SetCard and gallery views.
 */

import { Image, Pressable, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';

interface VideoThumbnailProps {
  thumbnailUri: string;
  onPress: () => void;
  size?: number;
}

export function VideoThumbnail({ thumbnailUri, onPress, size = 48 }: VideoThumbnailProps) {
  return (
    <Pressable onPress={onPress} style={[s.container, { width: size, height: size }]}>
      <Image
        source={{ uri: thumbnailUri }}
        style={s.image}
        resizeMode="cover"
      />
      <View style={s.overlay}>
        <Ionicons name="play-circle" size={size * 0.5} color="rgba(255,255,255,0.9)" />
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  container: {
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: colors.surfaceElevated,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
});
