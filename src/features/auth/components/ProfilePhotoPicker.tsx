import { useState } from 'react';
import { View, Text, Pressable, Alert, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

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
      {
        text: 'Take Photo',
        onPress: launchCamera,
      },
      {
        text: 'Choose from Gallery',
        onPress: launchGallery,
      },
      {
        text: 'Use Default',
        onPress: () => {
          setPhotoUri(null);
          onPhotoSelected(null);
        },
      },
      {
        text: 'Cancel',
        style: 'cancel',
      },
    ]);
  };

  const launchCamera = async () => {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) {
      Alert.alert(
        'Permission Required',
        'Camera access is needed to take a profile photo. Please enable it in Settings.'
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setPhotoUri(uri);
      onPhotoSelected(uri);
    }
  };

  const launchGallery = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      Alert.alert(
        'Permission Required',
        'Gallery access is needed to choose a profile photo. Please enable it in Settings.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setPhotoUri(uri);
      onPhotoSelected(uri);
    }
  };

  const initials = getInitials(displayName || 'User');

  return (
    <View className="items-center mb-6">
      <Pressable
        onPress={handlePickPhoto}
        className="w-24 h-24 rounded-full overflow-hidden items-center justify-center bg-surface-elevated border-2 border-accent active:opacity-80"
      >
        {photoUri ? (
          <Image
            source={{ uri: photoUri }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <Text className="text-accent text-3xl font-bold">{initials}</Text>
        )}
      </Pressable>
      <Text className="text-text-muted text-xs mt-2">Tap to change photo</Text>
    </View>
  );
}
