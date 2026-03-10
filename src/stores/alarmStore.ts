import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';

// Named MMKV instance for alarm state
const storage = createMMKV({ id: 'alarm-storage' });

const mmkvStorage = {
  getItem: (name: string) => storage.getString(name) ?? null,
  setItem: (name: string, value: string) => storage.set(name, value),
  removeItem: (name: string) => { storage.remove(name); },
};

interface AlarmStoreState {
  isPaused: boolean;
}

interface AlarmStoreActions {
  setPaused: (paused: boolean) => void;
}

export const useAlarmStore = create<AlarmStoreState & AlarmStoreActions>()(
  persist(
    (set) => ({
      isPaused: false,
      setPaused: (paused: boolean) => set({ isPaused: paused }),
    }),
    {
      name: 'alarm-store',
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);
