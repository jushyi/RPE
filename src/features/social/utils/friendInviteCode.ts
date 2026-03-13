/**
 * Friend invite code generation.
 * Reuses the same unambiguous character set as the coaching invite code system.
 */

/** Characters used for invite code generation (no I, O, 0, 1 to avoid ambiguity) */
const INVITE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Friend invite codes expire after this many hours */
export const FRIEND_INVITE_CODE_EXPIRY_HOURS = 24;

/**
 * Generate a 6-character alphanumeric friend invite code.
 * Uses only unambiguous characters for easy verbal/text sharing.
 */
export function generateFriendInviteCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += INVITE_CHARS.charAt(Math.floor(Math.random() * INVITE_CHARS.length));
  }
  return code;
}
