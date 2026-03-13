/**
 * Hook for fetching all user videos with exercise context for the gallery screen.
 * Returns videos in reverse-chronological order with storage usage info.
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import type { VideoGalleryItem } from '../types';

interface StorageUsage {
  count: number;
  totalMB: number;
}

export function useVideoGallery() {
  const userId = useAuthStore((s) => s.userId);
  const [videos, setVideos] = useState<VideoGalleryItem[]>([]);
  const [storageUsage, setStorageUsage] = useState<StorageUsage>({ count: 0, totalMB: 0 });
  const [isLoading, setIsLoading] = useState(false);

  const fetchVideos = useCallback(async () => {
    if (!supabase || !userId) return;

    setIsLoading(true);
    try {
      const { data, error } = await (supabase.from('set_logs') as any)
        .select(`
          id, video_url, set_number, weight, reps, unit, logged_at,
          session_exercises!inner(
            exercises!inner(name),
            workout_sessions!inner(started_at, ended_at)
          )
        `)
        .not('video_url', 'is', null)
        .order('logged_at', { ascending: false });

      if (error) throw error;

      const mapped: VideoGalleryItem[] = (data ?? []).map((row: any) => ({
        id: row.id,
        videoUrl: row.video_url,
        setNumber: row.set_number,
        weight: row.weight,
        reps: row.reps,
        unit: row.unit,
        loggedAt: row.logged_at,
        exerciseName: row.session_exercises?.exercises?.name ?? 'Unknown',
        sessionDate: row.session_exercises?.workout_sessions?.started_at ?? row.logged_at,
      }));

      setVideos(mapped);
    } catch (err) {
      console.warn('Failed to fetch video gallery:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const fetchStorageUsage = useCallback(async () => {
    if (!supabase || !userId) return;

    try {
      const { data: files } = await supabase.storage
        .from('set-videos')
        .list(userId);

      if (files && files.length > 0) {
        const totalBytes = files.reduce((sum, f) => sum + (f.metadata?.size ?? 0), 0);
        setStorageUsage({
          count: files.length,
          totalMB: Math.round((totalBytes / (1024 * 1024)) * 10) / 10,
        });
      } else {
        setStorageUsage({ count: 0, totalMB: 0 });
      }
    } catch (err) {
      console.warn('Failed to fetch storage usage:', err);
    }
  }, [userId]);

  const refresh = useCallback(async () => {
    await Promise.all([fetchVideos(), fetchStorageUsage()]);
  }, [fetchVideos, fetchStorageUsage]);

  const deleteVideo = useCallback(
    async (item: VideoGalleryItem) => {
      if (!supabase || !userId) return;

      try {
        // List and remove files matching this set log ID
        const { data: files } = await supabase.storage
          .from('set-videos')
          .list(userId, { search: item.id });

        if (files && files.length > 0) {
          const paths = files.map((f) => `${userId}/${f.name}`);
          await supabase.storage.from('set-videos').remove(paths);
        }

        // Null out video_url on set_logs
        await (supabase.from('set_logs') as any)
          .update({ video_url: null })
          .eq('id', item.id);

        // Update local state
        setVideos((prev) => prev.filter((v) => v.id !== item.id));
        setStorageUsage((prev) => ({
          count: Math.max(0, prev.count - 1),
          totalMB: prev.totalMB, // Will be recalculated on next refresh
        }));
      } catch (err) {
        console.warn('Failed to delete video:', err);
        throw err;
      }
    },
    [userId],
  );

  return { videos, storageUsage, isLoading, refresh, deleteVideo };
}
