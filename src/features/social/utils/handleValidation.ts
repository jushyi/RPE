/**
 * Handle validation utilities for user profile handles.
 * Handles must be 3-20 characters, lowercase alphanumeric + underscores,
 * and must start with a letter.
 */

/**
 * Regex for valid handles:
 * - Starts with a lowercase letter
 * - Followed by 2-19 lowercase letters, digits, or underscores
 * - Total length: 3-20 characters
 */
export const HANDLE_REGEX = /^[a-z][a-z0-9_]{2,19}$/;

/**
 * Validate a profile handle.
 * @returns null if the handle is valid; an error string if invalid.
 */
export function validateHandle(handle: string): string | null {
  if (!handle) return 'Handle is required';
  if (handle.length < 3) return 'Handle must be at least 3 characters';
  if (handle.length > 20) return 'Handle must be at most 20 characters';
  if (!HANDLE_REGEX.test(handle)) {
    return 'Letters, numbers, and underscores only. Must start with a letter.';
  }
  return null;
}
