import { View, Text, Image, Pressable, Alert, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '@/constants/theme';

interface TappableAvatarProps {
  displayName: string;
  avatarUrl: string | null;
  onPhotoChanged: (uri: string) => void;
}

export function TappableAvatar({
  displayName,
  avatarUrl,
  onPhotoChanged,
}: TappableAvatarProps) {
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handlePress = () => {
    Alert.alert('Profile Photo', 'Choose a photo source', [
      { text: 'Take Photo', onPress: () => pickPhoto('camera') },
      { text: 'Choose from Gallery', onPress: () => pickPhoto('gallery') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const pickPhoto = async (source: 'camera' | 'gallery') => {
    if (source === 'camera') {
      const { granted } = await ImagePicker.requestCameraPermissionsAsync();
      if (!granted) {
        Alert.alert('Permission Required', 'Camera access is needed.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (!result.canceled && result.assets[0]) onPhotoChanged(result.assets[0].uri);
    } else {
      const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!granted) {
        Alert.alert('Permission Required', 'Gallery access is needed.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (!result.canceled && result.assets[0]) onPhotoChanged(result.assets[0].uri);
    }
  };

  return (
    <Pressable onPress={handlePress} style={{ opacity: 1 }}>
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={s.avatarImg} />
      ) : (
        <View style={s.avatar}>
          <Text style={s.avatarText}>{initials || '?'}</Text>
        </View>
      )}
    </Pressable>
  );
}

const s = StyleSheet.create({
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  avatarImg: { width: 48, height: 48, borderRadius: 24 },
});
