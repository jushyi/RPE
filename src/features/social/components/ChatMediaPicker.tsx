/**
 * ChatMediaPicker — ActionSheet for choosing image/video attachments in chat.
 * Shows "Take Photo", "Choose from Library", "Send Video" options.
 */

import React from 'react';
import { Alert, ActionSheetIOS, Platform } from 'react-native';
import { useChatMedia, type ChatMediaResult } from '../hooks/useChatMedia';

interface ChatMediaPickerProps {
  onMedia: (result: ChatMediaResult) => void;
}

export function useChatMediaPicker({ onMedia }: ChatMediaPickerProps) {
  const { pickImage, pickVideo, takePhoto, uploading } = useChatMedia();

  const openPicker = () => {
    const options = ['Cancel', 'Take Photo', 'Choose from Library', 'Send Video'];

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: 0,
        },
        async (buttonIndex) => {
          let result: ChatMediaResult | null = null;
          if (buttonIndex === 1) {
            result = await takePhoto();
          } else if (buttonIndex === 2) {
            result = await pickImage();
          } else if (buttonIndex === 3) {
            result = await pickVideo();
          }
          if (result) onMedia(result);
        }
      );
    } else {
      // Android: use Alert with buttons as ActionSheet substitute
      Alert.alert('Attach Media', 'Choose an option', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Take Photo',
          onPress: async () => {
            const result = await takePhoto();
            if (result) onMedia(result);
          },
        },
        {
          text: 'Choose from Library',
          onPress: async () => {
            const result = await pickImage();
            if (result) onMedia(result);
          },
        },
        {
          text: 'Send Video',
          onPress: async () => {
            const result = await pickVideo();
            if (result) onMedia(result);
          },
        },
      ]);
    }
  };

  return { openPicker, uploading };
}
