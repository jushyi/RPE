import { useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useBodyweightStore } from '@/stores/bodyweightStore';
import type { BodyweightEntry, SparklineData } from '../types';

export function useBodyweightData() {
  const userId = useAuthStore((s) => s.userId);
  const { entries, isLoading, setEntries, addEntry: storeAdd, removeEntry: storeRemove, setLoading } =
    useBodyweightStore();

  const fetchEntries = useCallback(async () => {
    if (!supabase || !userId) return;

    setLoading(true);
    try {
      const { data, error } = await (supabase.from('bodyweight_logs') as any)
        .select('*')
        .eq('user_id', userId)
        .order('logged_at', { ascending: false });

      if (!error && data) {
        setEntries(
          data.map((row: any) => ({
            id: row.id,
            weight: Number(row.weight),
            unit: row.unit,
            logged_at: row.logged_at,
            created_at: row.created_at,
          })),
        );
      }
    } catch {
      // Keep existing cached entries
    } finally {
      setLoading(false);
    }
  }, [userId, setEntries, setLoading]);

  const addEntry = useCallback(
    async (weight: number, unit: 'kg' | 'lbs') => {
      if (!supabase || !userId) return;

      // Optimistic: create a temporary entry
      const tempId = `temp-${Date.now()}`;
      const today = new Date().toISOString().split('T')[0];
      const tempEntry: BodyweightEntry = {
        id: tempId,
        weight,
        unit,
        logged_at: today,
        created_at: new Date().toISOString(),
      };
      storeAdd(tempEntry);

      try {
        const { data, error } = await (supabase.from('bodyweight_logs') as any)
          .upsert(
            { user_id: userId, weight, unit, logged_at: today },
            { onConflict: 'user_id,logged_at' },
          )
          .select()
          .single();

        if (!error && data) {
          // Replace temp entry with real one
          storeRemove(tempId);
          storeAdd({
            id: data.id,
            weight: Number(data.weight),
            unit: data.unit,
            logged_at: data.logged_at,
            created_at: data.created_at,
          });
        }
      } catch {
        // Revert on failure
        storeRemove(tempId);
      }
    },
    [userId, storeAdd, storeRemove],
  );

  const deleteEntry = useCallback(
    async (id: string) => {
      if (!supabase) return;

      // Optimistic remove
      storeRemove(id);

      try {
        await (supabase.from('bodyweight_logs') as any)
          .delete()
          .eq('id', id);
      } catch {
        // If delete fails, re-fetch to get correct state
        fetchEntries();
      }
    },
    [storeRemove, fetchEntries],
  );

  const latest = useMemo(() => entries[0] ?? null, [entries]);

  const sparklineData: SparklineData[] = useMemo(() => {
    // Last 30 entries, sorted ascending by date for chart rendering
    return entries
      .slice(0, 30)
      .map((e) => ({
        date: new Date(e.logged_at).getTime(),
        value: e.weight,
      }))
      .reverse();
  }, [entries]);

  return {
    entries,
    isLoading,
    fetchEntries,
    addEntry,
    deleteEntry,
    latest,
    sparklineData,
  };
}
