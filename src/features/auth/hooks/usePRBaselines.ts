import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useExerciseStore } from '@/stores/exerciseStore';
import type { PRBaseline } from '@/lib/supabase/types/database';

interface PRBaselineInput {
  exercise_name: string;
  weight: number;
  unit: 'kg' | 'lbs';
}

/**
 * Slug-to-display-name mapping for Big 3 exercises.
 * The PR baseline form uses slugs (e.g., 'squat'),
 * while the exercises table uses display names (e.g., 'Squat').
 */
const EXERCISE_SLUG_TO_NAME: Record<string, string> = {
  bench_press: 'Bench Press',
  squat: 'Squat',
  deadlift: 'Deadlift',
};

interface UsePRBaselinesReturn {
  savePRBaselines: (baselines: PRBaselineInput[]) => Promise<{ success: boolean; error?: string }>;
  getPRBaselines: () => Promise<PRBaseline[]>;
  isLoading: boolean;
}

async function resolveUserId(storeUserId: string | null): Promise<string | null> {
  if (storeUserId) return storeUserId;
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id ?? null;
}

export function usePRBaselines(): UsePRBaselinesReturn {
  const [isLoading, setIsLoading] = useState(false);
  const storeUserId = useAuthStore((s) => s.userId);

  const savePRBaselines = useCallback(
    async (baselines: PRBaselineInput[]): Promise<{ success: boolean; error?: string }> => {
      const userId = await resolveUserId(storeUserId);
      if (!userId) {
        return { success: false, error: 'Not authenticated' };
      }

      const nonZero = baselines.filter((b) => b.weight > 0);
      if (nonZero.length === 0) {
        return { success: true };
      }

      setIsLoading(true);
      try {
        // Resolve exercise_id from exercise store so PR detection can match by ID
        const currentExercises = useExerciseStore.getState().exercises;
        const rows = nonZero.map((b) => {
          const displayName =
            EXERCISE_SLUG_TO_NAME[b.exercise_name] ?? b.exercise_name;
          const match = currentExercises.find(
            (e) => e.name.toLowerCase() === displayName.toLowerCase()
          );
          return {
            user_id: userId,
            exercise_name: b.exercise_name,
            exercise_id: match?.id ?? null,
            weight: b.weight,
            unit: b.unit,
          };
        });

        const { error } = await (supabase.from('pr_baselines') as any).upsert(rows, {
          onConflict: 'user_id,exercise_name',
        });

        if (error) {
          console.warn('PR baseline save error:', error);
          return { success: false, error: error.message };
        }

        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.warn('PR baseline save failed:', message);
        return { success: false, error: message };
      } finally {
        setIsLoading(false);
      }
    },
    [storeUserId]
  );

  const getPRBaselines = useCallback(async (): Promise<PRBaseline[]> => {
    const userId = await resolveUserId(storeUserId);
    if (!userId) return [];

    try {
      const { data, error } = await (supabase.from('pr_baselines') as any)
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.warn('PR baseline fetch error:', error);
        return [];
      }

      return (data as PRBaseline[]) ?? [];
    } catch (err) {
      console.warn('PR baseline fetch failed:', err);
      return [];
    }
  }, [storeUserId]);

  return { savePRBaselines, getPRBaselines, isLoading };
}
