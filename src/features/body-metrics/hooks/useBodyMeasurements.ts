import { useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useBodyMeasurementStore } from '@/stores/bodyMeasurementStore';
import type { BodyMeasurement } from '../types';

export function useBodyMeasurements() {
  const userId = useAuthStore((s) => s.userId);
  const {
    measurements,
    isLoading,
    setMeasurements,
    addMeasurement: storeAdd,
    updateMeasurement: storeUpdate,
    removeMeasurement: storeRemove,
    setLoading,
  } = useBodyMeasurementStore();

  const fetchMeasurements = useCallback(async () => {
    if (!supabase || !userId) return;

    setLoading(true);
    try {
      const { data, error } = await (supabase.from('body_measurements') as any)
        .select('*')
        .eq('user_id', userId)
        .order('measured_at', { ascending: false });

      if (!error && data) {
        setMeasurements(
          data.map((row: any): BodyMeasurement => ({
            id: row.id,
            user_id: row.user_id,
            chest: row.chest != null ? Number(row.chest) : null,
            chest_unit: row.chest_unit,
            waist: row.waist != null ? Number(row.waist) : null,
            waist_unit: row.waist_unit,
            hips: row.hips != null ? Number(row.hips) : null,
            hips_unit: row.hips_unit,
            body_fat_pct: row.body_fat_pct != null ? Number(row.body_fat_pct) : null,
            measured_at: row.measured_at,
            created_at: row.created_at,
          })),
        );
      }
    } catch {
      // Keep existing cached entries
    } finally {
      setLoading(false);
    }
  }, [userId, setMeasurements, setLoading]);

  const addMeasurement = useCallback(
    async (data: Omit<BodyMeasurement, 'id' | 'user_id' | 'created_at'>) => {
      if (!supabase || !userId) return;

      const tempId = `temp-${Date.now()}`;
      const tempEntry: BodyMeasurement = {
        ...data,
        id: tempId,
        user_id: userId,
        created_at: new Date().toISOString(),
      };
      storeAdd(tempEntry);

      try {
        const { data: inserted, error } = await (supabase.from('body_measurements') as any)
          .insert({
            user_id: userId,
            chest: data.chest,
            chest_unit: data.chest_unit,
            waist: data.waist,
            waist_unit: data.waist_unit,
            hips: data.hips,
            hips_unit: data.hips_unit,
            body_fat_pct: data.body_fat_pct,
            measured_at: data.measured_at,
          })
          .select()
          .single();

        if (!error && inserted) {
          storeRemove(tempId);
          storeAdd({
            id: inserted.id,
            user_id: inserted.user_id,
            chest: inserted.chest != null ? Number(inserted.chest) : null,
            chest_unit: inserted.chest_unit,
            waist: inserted.waist != null ? Number(inserted.waist) : null,
            waist_unit: inserted.waist_unit,
            hips: inserted.hips != null ? Number(inserted.hips) : null,
            hips_unit: inserted.hips_unit,
            body_fat_pct: inserted.body_fat_pct != null ? Number(inserted.body_fat_pct) : null,
            measured_at: inserted.measured_at,
            created_at: inserted.created_at,
          });
          return inserted;
        }
      } catch {
        storeRemove(tempId);
      }
    },
    [userId, storeAdd, storeRemove],
  );

  const updateMeasurement = useCallback(
    async (id: string, updates: Partial<BodyMeasurement>) => {
      if (!supabase) return;

      // Optimistic update
      storeUpdate(id, updates);

      try {
        const { error } = await (supabase.from('body_measurements') as any)
          .update(updates)
          .eq('id', id);

        if (error) {
          // Revert on failure by re-fetching
          fetchMeasurements();
        }
      } catch {
        fetchMeasurements();
      }
    },
    [storeUpdate, fetchMeasurements],
  );

  const deleteMeasurement = useCallback(
    async (id: string) => {
      if (!supabase) return;

      storeRemove(id);

      try {
        await (supabase.from('body_measurements') as any)
          .delete()
          .eq('id', id);
      } catch {
        fetchMeasurements();
      }
    },
    [storeRemove, fetchMeasurements],
  );

  const latest = measurements.length > 0 ? measurements[0] : null;

  return {
    measurements,
    isLoading,
    fetchMeasurements,
    addMeasurement,
    updateMeasurement,
    deleteMeasurement,
    latest,
  };
}
