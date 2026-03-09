/**
 * Theme constants for use in non-NativeWind contexts (StatusBar, navigation headers, etc.)
 * These values match the colors defined in tailwind.config.js.
 */

export const colors = {
  background: '#0a0a0a',
  surface: '#1a1a1a',
  surfaceElevated: '#252525',
  accent: '#3b82f6',
  accentBright: '#60a5fa',
  textPrimary: '#f5f5f5',
  textSecondary: '#a3a3a3',
  textMuted: '#737373',
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
} as const;

export type ColorName = keyof typeof colors;
