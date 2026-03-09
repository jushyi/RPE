import { useState } from 'react';
import { View, Text, Pressable, Alert, Image, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '@/constants/theme';

interface ProfilePhotoPickerProps {
  onPhotoSelected: (uri: string | null) => void;
  displayName?: string;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';
}

export function ProfilePhotoPicker({
  onPhotoSelected,
  displayName = '',
}: ProfilePhotoPickerProps) {
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const handlePickPhoto = () => {
    Alert.alert('Profile Photo', 'Choose a photo source', [
      { text: 'Take Photo', onPress: launchCamera },
      { text: 'Choose from Gallery', onPress: launchGallery },
      {
        text: 'Use Default',
        onPress: () => {
          setPhotoUri(null);
          onPhotoSelected(null);
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const launchCamera = async () => {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) {
      Alert.alert('Permission Required', 'Camera access is needed to take a profile photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      onPhotoSelected(result.assets[0].uri);
    }
  };

  const launchGallery = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      Alert.alert('Permission Required', 'Gallery access is needed to choose a profile photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      onPhotoSelected(result.assets[0].uri);
    }
  };

  const initials = getInitials(displayName || 'User');

  return (
    <View style={s.container}>
      <Pressable onPress={handlePickPhoto} style={s.avatar}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={s.avatarImage} resizeMode="cover" />
        ) : (
          <Text style={s.initials}>{initials}</Text>
        )}
      </Pressable>
      <Text style={s.hint}>Tap to change photo</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { alignItems: 'center', marginBottom: 24 },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceElevated,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  avatarImage: { width: '100%', height: '100%' },
  initials: { color: colors.accent, fontSize: 30, fontWeight: 'bold' },
  hint: { color: colors.textMuted, fontSize: 12, marginTop: 8 },
});
