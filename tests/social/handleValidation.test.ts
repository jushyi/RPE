import { validateHandle, HANDLE_REGEX } from '@/features/social/utils/handleValidation';

describe('HANDLE_REGEX', () => {
  it('matches valid handles', () => {
    expect(HANDLE_REGEX.test('abc')).toBe(true);
    expect(HANDLE_REGEX.test('john_doe')).toBe(true);
    expect(HANDLE_REGEX.test('user123')).toBe(true);
    expect(HANDLE_REGEX.test('a12345678901234567890')).toBe(false); // 21 chars, too long
    expect(HANDLE_REGEX.test('abcdefghijklmnopqrst')).toBe(true); // exactly 20 chars
  });

  it('does not match handles starting with underscore or digit', () => {
    expect(HANDLE_REGEX.test('_abc')).toBe(false);
    expect(HANDLE_REGEX.test('1abc')).toBe(false);
  });

  it('does not match handles with uppercase letters', () => {
    expect(HANDLE_REGEX.test('AbcDef')).toBe(false);
  });

  it('does not match handles with special characters', () => {
    expect(HANDLE_REGEX.test('abc!')).toBe(false);
    expect(HANDLE_REGEX.test('abc-def')).toBe(false);
    expect(HANDLE_REGEX.test('abc.def')).toBe(false);
  });
});

describe('validateHandle', () => {
  it('returns null for a valid handle', () => {
    expect(validateHandle('john')).toBeNull();
    expect(validateHandle('user_name')).toBeNull();
    expect(validateHandle('abc')).toBeNull();
    expect(validateHandle('user123')).toBeNull();
  });

  it('returns error for empty string', () => {
    expect(validateHandle('')).toBe('Handle is required');
  });

  it('returns error for handle shorter than 3 characters', () => {
    expect(validateHandle('ab')).toBe('Handle must be at least 3 characters');
    expect(validateHandle('a')).toBe('Handle must be at least 3 characters');
  });

  it('returns error for handle longer than 20 characters', () => {
    expect(validateHandle('abcdefghijklmnopqrstu')).toBe('Handle must be at most 20 characters');
  });

  it('returns error for handle starting with a digit', () => {
    const result = validateHandle('1abc');
    expect(result).toBeTruthy();
    expect(result).toContain('Must start with a letter');
  });

  it('returns error for handle starting with underscore', () => {
    const result = validateHandle('_abc');
    expect(result).toBeTruthy();
  });

  it('returns error for handle with uppercase letters', () => {
    const result = validateHandle('JohnDoe');
    expect(result).toBeTruthy();
  });

  it('returns error for handle with special characters', () => {
    const result = validateHandle('john.doe');
    expect(result).toBeTruthy();
    const result2 = validateHandle('john-doe');
    expect(result2).toBeTruthy();
  });

  it('returns error for handle that is exactly 20 chars starting with letter (valid)', () => {
    expect(validateHandle('abcdefghijklmnopqrst')).toBeNull();
  });
});
