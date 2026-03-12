import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';
import type { Plan } from '@/features/plans/types';

// Named MMKV instance to avoid colliding with other stores
const storage = createMMKV({ id: 'plan-storage' });

const mmkvStorage = {
  getItem: (name: string) => storage.getString(name) ?? null,
  setItem: (name: string, value: string) => storage.set(name, value),
  removeItem: (name: string) => { storage.remove(name); },
};

interface PlanState {
  plans: Plan[];
  isLoading: boolean;
  lastFetched: number | null;
}

interface PlanActions {
  setPlans: (plans: Plan[]) => void;
  addPlan: (plan: Plan) => void;
  updatePlan: (id: string, updates: Partial<Plan>) => void;
  removePlan: (id: string) => void;
  setActivePlan: (id: string) => void;
  setLoading: (loading: boolean) => void;
}

export const usePlanStore = create<PlanState & PlanActions>()(
  persist(
    (set) => ({
      // State
      plans: [],
      isLoading: false,
      lastFetched: null,

      // Actions
      setPlans: (plans) => set({ plans, lastFetched: Date.now() }),
      addPlan: (plan) =>
        set((s) => ({ plans: [...s.plans, plan] })),
      updatePlan: (id, updates) =>
        set((s) => ({
          plans: s.plans.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),
      removePlan: (id) =>
        set((s) => ({
          plans: s.plans.filter((p) => p.id !== id),
        })),
      setActivePlan: (id) =>
        set((s) => ({
          plans: s.plans.map((p) => ({
            ...p,
            is_active: p.id === id,
          })),
        })),
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'plan-storage',
      version: 1,
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
