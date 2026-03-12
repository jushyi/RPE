/**
 * Invite code generation for coach-trainee connections.
 * Uses a reduced character set to avoid ambiguous characters (I/O/0/1).
 */

/** Characters used for invite code generation (no I, O, 0, 1) */
const INVITE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Invite codes expire after this many hours */
export const INVITE_CODE_EXPIRY_HOURS = 24;

/**
 * Generate a 6-character alphanumeric invite code.
 * Uses only unambiguous characters for easy verbal/text sharing.
 */
export function generateInviteCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += INVITE_CHARS.charAt(Math.floor(Math.random() * INVITE_CHARS.length));
  }
  return code;
}
