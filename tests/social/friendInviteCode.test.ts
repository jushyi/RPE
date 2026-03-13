import {
  generateFriendInviteCode,
  FRIEND_INVITE_CODE_EXPIRY_HOURS,
} from '@/features/social/utils/friendInviteCode';

describe('generateFriendInviteCode', () => {
  it('generates a 6-character code', () => {
    const code = generateFriendInviteCode();
    expect(code).toHaveLength(6);
  });

  it('uses only uppercase letters and digits (no ambiguous I/O/0/1)', () => {
    const allowed = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    for (let i = 0; i < 100; i++) {
      const code = generateFriendInviteCode();
      for (const char of code) {
        expect(allowed).toContain(char);
      }
    }
  });

  it('does not contain ambiguous characters I, O, 0, or 1', () => {
    const ambiguous = ['I', 'O', '0', '1'];
    for (let i = 0; i < 100; i++) {
      const code = generateFriendInviteCode();
      for (const char of ambiguous) {
        expect(code).not.toContain(char);
      }
    }
  });

  it('generates unique codes (probabilistic)', () => {
    const codes = new Set<string>();
    for (let i = 0; i < 50; i++) {
      codes.add(generateFriendInviteCode());
    }
    // With 30^6 = 729M possible codes, 50 codes should all be unique
    expect(codes.size).toBe(50);
  });

  it('returns a string', () => {
    expect(typeof generateFriendInviteCode()).toBe('string');
  });
});

describe('FRIEND_INVITE_CODE_EXPIRY_HOURS', () => {
  it('is 24 hours', () => {
    expect(FRIEND_INVITE_CODE_EXPIRY_HOURS).toBe(24);
  });
});
