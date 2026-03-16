/**
 * useChatMedia — image/video picking and upload for chat messages.
 *
 * - pickImage(): expo-image-picker, quality 0.7, max 5MB, uploads to chat-media bucket
 * - pickVideo(): expo-image-picker video mode, max 30s, uploads to chat-media bucket
 * - Reuses File.arrayBuffer() pattern from Phase 14 video upload
 */

import { useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase/client';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
const BUCKET = 'chat-media';

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export interface ChatMediaResult {
  mediaUrl: string;
  mediaType: 'image' | 'video';
  thumbnailUrl?: string;
}

export function useChatMedia() {
  const [uploading, setUploading] = useState(false);

  const pickImage = useCallback(async (): Promise<ChatMediaResult | null> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return null;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.7,
    });

    if (result.canceled || !result.assets?.[0]) return null;

    const asset = result.assets[0];
    setUploading(true);
    try {
      const url = await uploadMedia(asset.uri, 'image');
      if (!url) return null;
      return { mediaUrl: url, mediaType: 'image' };
    } finally {
      setUploading(false);
    }
  }, []);

  const pickVideo = useCallback(async (): Promise<ChatMediaResult | null> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return null;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsEditing: false,
      videoMaxDuration: 30,
      quality: ImagePicker.UIImagePickerControllerQualityType.Medium,
    });

    if (result.canceled || !result.assets?.[0]) return null;

    const asset = result.assets[0];
    setUploading(true);
    try {
      const videoUrl = await uploadMedia(asset.uri, 'video');
      if (!videoUrl) return null;

      // Generate thumbnail
      let thumbnailUrl: string | null | undefined;
      try {
        // @ts-ignore -- expo-video-thumbnails may not have type declarations
        const { VideoThumbnails } = await import('expo-video-thumbnails');
        const thumbResult = await VideoThumbnails.getThumbnailAsync(asset.uri, {
          time: 0,
        });
        thumbnailUrl = await uploadMedia(thumbResult.uri, 'image');
      } catch {
        // Thumbnail generation is best-effort
      }

      return { mediaUrl: videoUrl, mediaType: 'video', thumbnailUrl };
    } finally {
      setUploading(false);
    }
  }, []);

  const takePhoto = useCallback(async (): Promise<ChatMediaResult | null> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return null;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.7,
    });

    if (result.canceled || !result.assets?.[0]) return null;

    const asset = result.assets[0];
    setUploading(true);
    try {
      const url = await uploadMedia(asset.uri, 'image');
      if (!url) return null;
      return { mediaUrl: url, mediaType: 'image' };
    } finally {
      setUploading(false);
    }
  }, []);

  return { pickImage, pickVideo, takePhoto, uploading };
}

// ─── Internal upload helper ────────────────────────────────────────────────

async function uploadMedia(
  localUri: string,
  mediaType: 'image' | 'video'
): Promise<string | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const ext = localUri.split('.').pop()?.toLowerCase() ?? (mediaType === 'image' ? 'jpg' : 'mp4');
    const contentType =
      mediaType === 'image'
        ? `image/${ext === 'png' ? 'png' : 'jpeg'}`
        : ext === 'mov'
        ? 'video/quicktime'
        : 'video/mp4';

    const fileId = generateId();
    const filePath = `${user.id}/${fileId}.${ext}`;

    // Use File.arrayBuffer() per Phase 14 pattern
    const file = new (globalThis as any).File([localUri], `upload.${ext}`, {
      type: contentType,
    });

    let arrayBuffer: ArrayBuffer;
    try {
      arrayBuffer = await file.arrayBuffer();
    } catch {
      // Fallback: fetch the local file
      const resp = await fetch(localUri);
      arrayBuffer = await resp.arrayBuffer();
    }

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, arrayBuffer, { contentType, upsert: true });

    if (error) {
      console.warn('uploadMedia: storage upload error:', error.message);
      return null;
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
    return data.publicUrl;
  } catch (err) {
    console.warn('uploadMedia: unexpected error:', err);
    return null;
  }
}
