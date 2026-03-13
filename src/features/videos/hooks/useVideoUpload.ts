/**
 * Hook for uploading and deleting set videos in Supabase Storage.
 * Uses File.arrayBuffer() for reliable React Native uploads (SDK 55 pattern).
 */

import { useCallback } from 'react';
import { File } from 'expo-file-system';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';

export function useVideoUpload() {
  const userId = useAuthStore((s) => s.userId);

  /** Upload a video to Supabase Storage and return the public URL */
  const uploadVideo = useCallback(
    async (setLogId: string, localUri: string): Promise<string> => {
      if (!userId) throw new Error('Not authenticated');

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
    },
    [userId],
  );

  /** Delete a video from Supabase Storage and null out video_url on set_logs */
  const deleteVideo = useCallback(
    async (setLogId: string): Promise<void> => {
      if (!userId) throw new Error('Not authenticated');

      // List files matching this setLogId (could be .mp4 or .mov)
      const { data: files } = await supabase.storage
        .from('set-videos')
        .list(userId, { search: setLogId });

      if (files && files.length > 0) {
        const paths = files.map((f) => `${userId}/${f.name}`);
        await supabase.storage.from('set-videos').remove(paths);
      }

      // Null out video_url on set_logs
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('set_logs') as any)
        .update({ video_url: null })
        .eq('id', setLogId);
    },
    [userId],
  );

  return { uploadVideo, deleteVideo };
}
