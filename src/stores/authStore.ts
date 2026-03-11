import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';

const storage = createMMKV();

const mmkvStorage = {
  getItem: (name: string) => storage.getString(name) ?? null,
  setItem: (name: string, value: string) => storage.set(name, value),
  removeItem: (name: string) => { storage.remove(name); },
};

interface AuthState {
  hasCompletedOnboarding: boolean;
  preferredUnit: 'kg' | 'lbs';
  preferredMeasurementUnit: 'in' | 'cm';
  isAuthenticated: boolean;
  userId: string | null;
  deletionScheduledAt: string | null;
}

interface AuthActions {
  setOnboardingComplete: () => void;
  setPreferredUnit: (unit: 'kg' | 'lbs') => void;
  setPreferredMeasurementUnit: (unit: 'in' | 'cm') => void;
  setAuthenticated: (userId: string) => void;
  setDeletionScheduledAt: (date: string | null) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      // State
      hasCompletedOnboarding: false,
      preferredUnit: 'lbs',
      preferredMeasurementUnit: 'in',
      isAuthenticated: false,
      userId: null,
      deletionScheduledAt: null,

      // Actions
      setOnboardingComplete: () => set({ hasCompletedOnboarding: true }),
      setPreferredUnit: (unit) => set({ preferredUnit: unit }),
      setPreferredMeasurementUnit: (unit) => set({ preferredMeasurementUnit: unit }),
      setAuthenticated: (userId) => set({ isAuthenticated: true, userId }),
      setDeletionScheduledAt: (date) => set({ deletionScheduledAt: date }),
      clearAuth: () =>
        set({
          isAuthenticated: false,
          userId: null,
          hasCompletedOnboarding: false,
          deletionScheduledAt: null,
        }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
