/**
 * MMKV-backed video upload queue for offline-first uploads.
 * Videos are copied to documents directory on enqueue to prevent stale cache URIs.
 * Queue is flushed when network connectivity is restored.
 */

import { createMMKV } from 'react-native-mmkv';
import { File, Paths } from 'expo-file-system';
import NetInfo from '@react-native-community/netinfo';
import { supabase } from '@/lib/supabase/client';
import { useHistoryStore } from '@/stores/historyStore';
import type { VideoUploadItem } from '../types';

const storage = createMMKV({ id: 'video-upload-queue' });
const QUEUE_KEY = 'pending';

/** Max upload size in bytes (50 MB — Supabase free-tier limit) */
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;

// --- Upload status observable ---
type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';
interface UploadState {
  status: UploadStatus;
  error?: string;
  pending: number;
}

let _uploadState: UploadState = { status: 'idle', pending: 0 };
const _listeners = new Set<(state: UploadState) => void>();

function setUploadState(state: UploadState) {
  _uploadState = state;
  _listeners.forEach((fn) => fn(state));
}

export function getUploadState(): UploadState {
  return _uploadState;
}

export function subscribeUploadState(fn: (state: UploadState) => void): () => void {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}

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

/** Check file size. Returns size in bytes, or -1 if unreadable. */
function getFileSize(uri: string): number {
  try {
    const file = new File(uri);
    return file.size ?? -1;
  } catch {
    return -1;
  }
}

/** Add a video upload item to the queue, copying to persistent storage */
export async function enqueueVideoUpload(item: VideoUploadItem): Promise<void> {
  // Check file size before enqueuing
  const size = getFileSize(item.localUri);
  if (size > MAX_VIDEO_SIZE) {
    const sizeMB = Math.round(size / 1024 / 1024);
    throw new Error(`Video is too large (${sizeMB} MB). Maximum size is ${MAX_VIDEO_SIZE / 1024 / 1024} MB. Try a shorter clip.`);
  }

  // Copy video from cache to document directory to survive app restarts
  const ext = item.localUri.split('.').pop() || 'mp4';
  const persistentUri = `${Paths.document.uri}set-video-${item.setLogId}.${ext}`;

  let finalUri = persistentUri;
  try {
    const sourceFile = new File(item.localUri);
    const destFile = new File(persistentUri);
    sourceFile.copy(destFile);
    console.log('[VideoQueue] Copied to documents:', persistentUri);
  } catch (err) {
    console.warn('[VideoQueue] Copy failed, using original URI:', item.localUri, err);
    finalUri = item.localUri;
  }

  const queueItem: VideoUploadItem = {
    ...item,
    originalUri: item.localUri,
    localUri: finalUri,
  };

  const queue = getVideoQueue();
  queue.push(queueItem);
  storage.set(QUEUE_KEY, JSON.stringify(queue));
  console.log('[VideoQueue] Enqueued video for set:', item.setLogId, 'uri:', finalUri, 'size:', size);
}

/** Remove a successfully uploaded item from the queue */
export function removeFromQueue(setLogId: string): void {
  const queue = getVideoQueue();
  const filtered = queue.filter((item) => item.setLogId !== setLogId);
  storage.set(QUEUE_KEY, JSON.stringify(filtered));
}

/** Upload a single video to Supabase Storage using Blob (no ArrayBuffer in memory) */
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

  console.log('[VideoQueue] Uploading', (arrayBuffer.byteLength / 1024 / 1024).toFixed(1), 'MB to', filePath);

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
  if (queue.length === 0) {
    setUploadState({ status: 'idle', pending: 0 });
    return;
  }

  const failed: VideoUploadItem[] = [];
  setUploadState({ status: 'uploading', pending: queue.length });
  console.log('[VideoQueue] Flushing', queue.length, 'items');

  for (const item of queue) {
    try {
      console.log('[VideoQueue] Uploading:', item.setLogId, 'from:', item.localUri);
      const publicUrl = await uploadSetVideo(item.userId, item.setLogId, item.localUri);
      console.log('[VideoQueue] Upload success:', item.setLogId, '->', publicUrl);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('set_logs') as any)
        .update({ video_url: publicUrl })
        .eq('id', item.setLogId);
      removeFromQueue(item.setLogId);

      // Clean up local files after successful upload
      try {
        const queueFile = new File(item.localUri);
        queueFile.delete();
      } catch { /* ignore if already deleted */ }

      // Delete original camera file (NOT gallery files - those belong to the user's photo library)
      if (item.source === 'camera' && item.originalUri) {
        try {
          const originalFile = new File(item.originalUri);
          originalFile.delete();
        } catch { /* ignore - may already be cleaned by OS */ }
      }
    } catch (err) {
      console.warn('[VideoQueue] Upload failed for:', item.setLogId, err);
      failed.push(item);
    }
  }

  // Keep only failed items in the queue
  if (failed.length > 0) {
    storage.set(QUEUE_KEY, JSON.stringify(failed));
    const errMsg = failed.length === queue.length
      ? 'Video upload failed. The video may be too large.'
      : `${failed.length} of ${queue.length} videos failed to upload.`;
    setUploadState({ status: 'error', error: errMsg, pending: failed.length });
  } else {
    // Invalidate history cache so next fetch picks up video_url
    useHistoryStore.setState({ lastFetched: null });
    setUploadState({ status: 'success', pending: 0 });
  }
}
