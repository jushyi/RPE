/**
 * MMKV-backed thumbnail cache for video thumbnails.
 * Stores thumbnail URIs keyed by setLogId for fast retrieval.
 */

import { createMMKV } from 'react-native-mmkv';
let VideoThumbnails: typeof import('expo-video-thumbnails') | null = null;
try {
  VideoThumbnails = require('expo-video-thumbnails');
} catch {
  // Native module not available (e.g., Expo Go)
}

const storage = createMMKV({ id: 'video-thumbnail-cache' });

/** Get a cached thumbnail URI for a set log */
export function getCachedThumbnail(setLogId: string): string | null {
  return storage.getString(setLogId) ?? null;
}

/** Cache a thumbnail URI for a set log */
export function cacheThumbnail(setLogId: string, uri: string): void {
  storage.set(setLogId, uri);
}

/** Remove a cached thumbnail (e.g., when video is replaced) */
export function invalidateThumbnail(setLogId: string): void {
  storage.remove(setLogId);
}

/** Generate a thumbnail from a video URI, cache it, and return the URI */
export async function generateAndCacheThumbnail(
  setLogId: string,
  videoUri: string,
): Promise<string> {
  if (!VideoThumbnails) {
    throw new Error('expo-video-thumbnails not available');
  }
  const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
    time: 500,
    quality: 0.5,
  });
  cacheThumbnail(setLogId, uri);
  return uri;
}
