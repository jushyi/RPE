/**
 * Centralized color constants for all app styling (StyleSheet.create).
 * Every color reference in the codebase must flow through these constants.
 */

export const colors = {
  background: '#0a0a0a',
  surface: '#1a1a1a',
  surfaceElevated: '#252525',
  accent: '#ec4899',
  accentBright: '#f472b6',
  textPrimary: '#f5f5f5',
  textSecondary: '#a3a3a3',
  textMuted: '#737373',
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  white: '#ffffff',
  black: '#000000',
} as const;

export type ColorName = keyof typeof colors;
