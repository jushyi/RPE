/**
 * Hook for capturing or selecting videos from camera/gallery.
 * Follows the ProfilePhotoPicker pattern with Alert-based source selection.
 */

import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { generateAndCacheThumbnail } from '../utils/thumbnailCache';

interface VideoCaptureResult {
  localUri: string;
  thumbnailUri: string;
}

export function useVideoCapture() {
  const [isCapturing, setIsCapturing] = useState(false);

  const launchCamera = useCallback(async (): Promise<VideoCaptureResult | null> => {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) {
      Alert.alert('Permission Required', 'Camera access is needed to record set videos.');
      return null;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['videos'],
      videoMaxDuration: 120,
      videoQuality: ImagePicker.UIImagePickerControllerQualityType.Medium,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      return { localUri: result.assets[0].uri, thumbnailUri: '' };
    }
    return null;
  }, []);

  const launchGallery = useCallback(async (): Promise<VideoCaptureResult | null> => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      Alert.alert('Permission Required', 'Gallery access is needed to select videos.');
      return null;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      videoMaxDuration: 120,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      return { localUri: result.assets[0].uri, thumbnailUri: '' };
    }
    return null;
  }, []);

  const captureOrPickVideo = useCallback(
    (setLogId: string): Promise<VideoCaptureResult | null> => {
      return new Promise((resolve) => {
        Alert.alert('Attach Video', 'Choose a video source', [
          {
            text: 'Record Video',
            onPress: async () => {
              setIsCapturing(true);
              try {
                const result = await launchCamera();
                if (result) {
                  const thumbnailUri = await generateAndCacheThumbnail(
                    setLogId,
                    result.localUri,
                  );
                  resolve({ localUri: result.localUri, thumbnailUri });
                } else {
                  resolve(null);
                }
              } catch {
                resolve(null);
              } finally {
                setIsCapturing(false);
              }
            },
          },
          {
            text: 'Choose from Gallery',
            onPress: async () => {
              setIsCapturing(true);
              try {
                const result = await launchGallery();
                if (result) {
                  const thumbnailUri = await generateAndCacheThumbnail(
                    setLogId,
                    result.localUri,
                  );
                  resolve({ localUri: result.localUri, thumbnailUri });
                } else {
                  resolve(null);
                }
              } catch {
                resolve(null);
              } finally {
                setIsCapturing(false);
              }
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve(null),
          },
        ]);
      });
    },
    [launchCamera, launchGallery],
  );

  return { captureOrPickVideo, isCapturing };
}
