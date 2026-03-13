/**
 * MMKV-backed video upload queue for offline-first uploads.
 * Videos are copied to documents directory on enqueue to prevent stale cache URIs.
 * Queue is flushed when network connectivity is restored.
 */

import { createMMKV } from 'react-native-mmkv';
import { File, Paths } from 'expo-file-system';
import NetInfo from '@react-native-community/netinfo';
import { supabase } from '@/lib/supabase/client';
import type { VideoUploadItem } from '../types';

const storage = createMMKV({ id: 'video-upload-queue' });
const QUEUE_KEY = 'pending';

/** Read the current queue from MMKV */
export function getVideoQueue(): VideoUploadItem[] {
  const raw = storage.getString(QUEUE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as VideoUploadItem[];
  } catch {
    return [];
  }
}

/** Add a video upload item to the queue, copying to persistent storage */
export async function enqueueVideoUpload(item: VideoUploadItem): Promise<void> {
  // Copy video from cache to document directory to survive app restarts
  const ext = item.localUri.split('.').pop() || 'mp4';
  const persistentUri = `${Paths.document.uri}set-video-${item.setLogId}.${ext}`;

  try {
    const sourceFile = new File(item.localUri);
    const destFile = new File(persistentUri);
    sourceFile.copy(destFile);
  } catch {
    // If copy fails (e.g., already in documents dir), keep original URI
  }

  const queueItem: VideoUploadItem = {
    ...item,
    originalUri: item.localUri,
    localUri: persistentUri,
  };

  const queue = getVideoQueue();
  queue.push(queueItem);
  storage.set(QUEUE_KEY, JSON.stringify(queue));
}

/** Remove a successfully uploaded item from the queue */
export function removeFromQueue(setLogId: string): void {
  const queue = getVideoQueue();
  const filtered = queue.filter((item) => item.setLogId !== setLogId);
  storage.set(QUEUE_KEY, JSON.stringify(filtered));
}

/** Upload a single video to Supabase Storage */
async function uploadSetVideo(
  userId: string,
  setLogId: string,
  localUri: string,
): Promise<string> {
  const file = new File(localUri);
  const arrayBuffer = await file.arrayBuffer();

  const ext = localUri.split('.').pop()?.toLowerCase() || 'mp4';
  const contentType = ext === 'mov' ? 'video/quicktime' : 'video/mp4';
  const filePath = `${userId}/${setLogId}.${ext}`;

  const { error } = await supabase.storage
    .from('set-videos')
    .upload(filePath, arrayBuffer, {
      contentType,
      upsert: true,
    });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from('set-videos')
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

/** Flush the queue: upload all pending items and update set_logs.video_url */
export async function flushVideoQueue(): Promise<void> {
  const netState = await NetInfo.fetch();
  if (!netState.isConnected) return;

  const queue = getVideoQueue();
  const failed: VideoUploadItem[] = [];

  for (const item of queue) {
    try {
      const publicUrl = await uploadSetVideo(item.userId, item.setLogId, item.localUri);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('set_logs') as any)
        .update({ video_url: publicUrl })
        .eq('id', item.setLogId);
      removeFromQueue(item.setLogId);

      // Clean up local files after successful upload
      // Always delete the documents-dir queue copy
      try {
        const queueFile = new File(item.localUri);
        await queueFile.delete();
      } catch { /* ignore if already deleted */ }

      // Delete original camera file (NOT gallery files - those belong to the user's photo library)
      if (item.source === 'camera' && item.originalUri) {
        try {
          const originalFile = new File(item.originalUri);
          await originalFile.delete();
        } catch { /* ignore - may already be cleaned by OS */ }
      }
    } catch {
      failed.push(item);
    }
  }

  // Keep only failed items in the queue
  if (failed.length > 0) {
    storage.set(QUEUE_KEY, JSON.stringify(failed));
  }
}
