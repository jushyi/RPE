import {
  generateInviteCode,
  INVITE_CODE_EXPIRY_HOURS,
} from '@/features/coaching/utils/inviteCode';

describe('generateInviteCode', () => {
  it('generates a 6-character code', () => {
    const code = generateInviteCode();
    expect(code).toHaveLength(6);
  });

  it('uses only uppercase letters and digits (no ambiguous I/O/0/1)', () => {
    const allowed = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    for (let i = 0; i < 100; i++) {
      const code = generateInviteCode();
      for (const char of code) {
        expect(allowed).toContain(char);
      }
    }
  });

  it('does not contain ambiguous characters I, O, 0, or 1', () => {
    const ambiguous = ['I', 'O', '0', '1'];
    for (let i = 0; i < 100; i++) {
      const code = generateInviteCode();
      for (const char of ambiguous) {
        expect(code).not.toContain(char);
      }
    }
  });

  it('generates unique codes (probabilistic)', () => {
    const codes = new Set<string>();
    for (let i = 0; i < 50; i++) {
      codes.add(generateInviteCode());
    }
    // With 30^6 = 729M possible codes, 50 codes should all be unique
    expect(codes.size).toBe(50);
  });
});

describe('INVITE_CODE_EXPIRY_HOURS', () => {
  it('is 24 hours', () => {
    expect(INVITE_CODE_EXPIRY_HOURS).toBe(24);
  });
});
