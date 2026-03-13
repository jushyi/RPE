import { formatBadgeCount } from '@/features/notifications/components/BellBadge';

describe('formatBadgeCount', () => {
  it('returns null for count 0 (hide badge)', () => {
    expect(formatBadgeCount(0)).toBeNull();
  });

  it('returns "1" for count 1', () => {
    expect(formatBadgeCount(1)).toBe('1');
  });

  it('returns "5" for count 5', () => {
    expect(formatBadgeCount(5)).toBe('5');
  });

  it('returns "9" for count 9', () => {
    expect(formatBadgeCount(9)).toBe('9');
  });

  it('returns "9+" for count 10', () => {
    expect(formatBadgeCount(10)).toBe('9+');
  });

  it('returns "9+" for count 99', () => {
    expect(formatBadgeCount(99)).toBe('9+');
  });
});
