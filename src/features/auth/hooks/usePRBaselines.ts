import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import type { PRBaseline } from '@/lib/supabase/types/database';

interface PRBaselineInput {
  exercise_name: string;
  weight: number;
  unit: 'kg' | 'lbs';
}

interface UsePRBaselinesReturn {
  savePRBaselines: (baselines: PRBaselineInput[]) => Promise<{ success: boolean; error?: string }>;
  getPRBaselines: () => Promise<PRBaseline[]>;
  isLoading: boolean;
}

export function usePRBaselines(): UsePRBaselinesReturn {
  const [isLoading, setIsLoading] = useState(false);
  const userId = useAuthStore((s) => s.userId);

  const savePRBaselines = useCallback(
    async (baselines: PRBaselineInput[]): Promise<{ success: boolean; error?: string }> => {
      if (!userId) {
        return { success: false, error: 'Not authenticated' };
      }

      // Filter to only non-zero weight entries
      const nonZero = baselines.filter((b) => b.weight > 0);
      if (nonZero.length === 0) {
        return { success: true }; // Nothing to save
      }

      setIsLoading(true);
      try {
        const rows = nonZero.map((b) => ({
          user_id: userId,
          exercise_name: b.exercise_name,
          weight: b.weight,
          unit: b.unit,
        }));

        // Upsert using UNIQUE(user_id, exercise_name) constraint
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
    [userId]
  );

  const getPRBaselines = useCallback(async (): Promise<PRBaseline[]> => {
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
  }, [userId]);

  return { savePRBaselines, getPRBaselines, isLoading };
}
