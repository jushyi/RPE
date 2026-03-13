/**
 * Nuclear cache clear — wipes ALL user-specific MMKV stores on sign-out.
 * Prevents stale data from a previous account bleeding into the next session.
 *
 * Auth store is intentionally excluded (cleared separately by clearAuth()).
 */
import { createMMKV } from 'react-native-mmkv';

const MMKV_STORE_IDS = [
  'plan-storage',
  'history-storage',
  'workout-storage',
  'exercise-storage',
  'bodyweight-storage',
  'body-measurement-storage',
  'coaching-storage',
  'alarm-storage',
  'previous-performance-cache',
  'workout-bridge',
  'completed-today',
  'sync-queue',
  'video-upload-queue',
  'video-thumbnail-cache',
];

export function clearAllUserData(): void {
  for (const id of MMKV_STORE_IDS) {
    try {
      const store = createMMKV({ id });
      store.clearAll();
    } catch {
      // Store may not exist yet — safe to ignore
    }
  }
}
