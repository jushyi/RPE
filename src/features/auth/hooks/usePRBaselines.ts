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
        const rows = nonZero.map((b) => ({
          user_id: userId,
          exercise_name: b.exercise_name,
          weight: b.weight,
          unit: b.unit,
        }));

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
