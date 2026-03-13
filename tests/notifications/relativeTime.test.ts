import { relativeTime } from '@/features/notifications/utils/relativeTime';

describe('relativeTime', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-03-13T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns "just now" for less than 1 minute ago', () => {
    const date = new Date('2026-03-13T11:59:30Z');
    expect(relativeTime(date)).toBe('just now');
  });

  it('returns "Xm ago" for minutes', () => {
    const date = new Date('2026-03-13T11:45:00Z');
    expect(relativeTime(date)).toBe('15m ago');
  });

  it('returns "1m ago" for exactly 1 minute', () => {
    const date = new Date('2026-03-13T11:59:00Z');
    expect(relativeTime(date)).toBe('1m ago');
  });

  it('returns "Xh ago" for hours', () => {
    const date = new Date('2026-03-13T09:00:00Z');
    expect(relativeTime(date)).toBe('3h ago');
  });

  it('returns "Xd ago" for days within a week', () => {
    const date = new Date('2026-03-11T12:00:00Z');
    expect(relativeTime(date)).toBe('2d ago');
  });

  it('returns locale date string for more than 7 days ago', () => {
    const date = new Date('2026-03-01T12:00:00Z');
    const result = relativeTime(date);
    // Should be a date string, not a relative format
    expect(result).not.toContain('ago');
    expect(result).not.toBe('just now');
  });

  it('accepts string dates', () => {
    expect(relativeTime('2026-03-13T11:59:30Z')).toBe('just now');
  });
});
