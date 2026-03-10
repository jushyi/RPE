import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';
import type { BodyMeasurement } from '@/features/body-metrics/types';

const storage = createMMKV({ id: 'body-measurement-storage' });

const mmkvStorage = {
  getItem: (name: string) => storage.getString(name) ?? null,
  setItem: (name: string, value: string) => storage.set(name, value),
  removeItem: (name: string) => { storage.remove(name); },
};

interface BodyMeasurementState {
  measurements: BodyMeasurement[];
  isLoading: boolean;
  lastFetched: number | null;
}

interface BodyMeasurementActions {
  setMeasurements: (measurements: BodyMeasurement[]) => void;
  addMeasurement: (measurement: BodyMeasurement) => void;
  updateMeasurement: (id: string, updates: Partial<BodyMeasurement>) => void;
  removeMeasurement: (id: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useBodyMeasurementStore = create<BodyMeasurementState & BodyMeasurementActions>()(
  persist(
    (set) => ({
      // State
      measurements: [],
      isLoading: false,
      lastFetched: null,

      // Actions
      setMeasurements: (measurements) => set({ measurements, lastFetched: Date.now() }),
      addMeasurement: (measurement) =>
        set((s) => ({ measurements: [measurement, ...s.measurements] })),
      updateMeasurement: (id, updates) =>
        set((s) => ({
          measurements: s.measurements.map((m) =>
            m.id === id ? { ...m, ...updates } : m
          ),
        })),
      removeMeasurement: (id) =>
        set((s) => ({
          measurements: s.measurements.filter((m) => m.id !== id),
        })),
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'body-measurement-storage',
      version: 1,
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
