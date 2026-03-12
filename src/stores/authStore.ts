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
  avatarUrl: string | null;
  displayName: string;
}

interface AuthActions {
  setOnboardingComplete: () => void;
  setPreferredUnit: (unit: 'kg' | 'lbs') => void;
  setPreferredMeasurementUnit: (unit: 'in' | 'cm') => void;
  setAuthenticated: (userId: string) => void;
  setDeletionScheduledAt: (date: string | null) => void;
  setAvatarUrl: (url: string | null) => void;
  setDisplayName: (name: string) => void;
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
      avatarUrl: null,
      displayName: 'User',

      // Actions
      setOnboardingComplete: () => set({ hasCompletedOnboarding: true }),
      setPreferredUnit: (unit) => set({ preferredUnit: unit }),
      setPreferredMeasurementUnit: (unit) => set({ preferredMeasurementUnit: unit }),
      setAuthenticated: (userId) => set({ isAuthenticated: true, userId }),
      setDeletionScheduledAt: (date) => set({ deletionScheduledAt: date }),
      setAvatarUrl: (url) => set({ avatarUrl: url }),
      setDisplayName: (name) => set({ displayName: name }),
      clearAuth: () =>
        set({
          isAuthenticated: false,
          userId: null,
          hasCompletedOnboarding: false,
          deletionScheduledAt: null,
          avatarUrl: null,
          displayName: 'User',
        }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
