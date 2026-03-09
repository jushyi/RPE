import { useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useExerciseStore } from '@/stores/exerciseStore';
import { useAuthStore } from '@/stores/authStore';
import type { Exercise } from '../types';

export function useExercises() {
  const {
    exercises,
    isLoading,
    lastFetched,
    setExercises,
    addExercise: addToStore,
    updateExercise: updateInStore,
    removeExercise: removeFromStore,
    setLoading,
  } = useExerciseStore();
  const userId = useAuthStore((s) => s.userId);

  const fetchExercises = useCallback(async (force = false) => {
    // Skip if already loaded (unless forced)
    if (!force && lastFetched && exercises.length > 0) return;
    if (!supabase) return;

    setLoading(true);
    try {
      // RLS policies return global + user-owned exercises
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .order('name');

      if (error) throw error;
      setExercises((data ?? []) as Exercise[]);
    } catch (err) {
      console.warn('Failed to fetch exercises:', err);
    } finally {
      setLoading(false);
    }
  }, [lastFetched, exercises.length]);

  const createExercise = useCallback(
    async (
      exercise: Omit<Exercise, 'id' | 'user_id' | 'created_at' | 'updated_at'>
    ) => {
      if (!supabase || !userId) return;

      const { data, error } = await supabase
        .from('exercises')
        .insert({ ...exercise, user_id: userId })
        .select()
        .single();

      if (error) throw error;
      addToStore(data as Exercise);
      return data;
    },
    [userId]
  );

  const updateExercise = useCallback(
    async (id: string, updates: Partial<Pick<Exercise, 'name' | 'muscle_group' | 'equipment' | 'notes'>>) => {
      if (!supabase) return;

      const { data, error } = await supabase
        .from('exercises')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      updateInStore(id, data as Partial<Exercise>);
      return data;
    },
    []
  );

  const deleteExercise = useCallback(
    async (id: string) => {
      if (!supabase) return;

      const { error } = await supabase
        .from('exercises')
        .delete()
        .eq('id', id);

      if (error) throw error;
      removeFromStore(id);
    },
    []
  );

  return {
    exercises,
    isLoading,
    fetchExercises,
    createExercise,
    updateExercise,
    deleteExercise,
  };
}
