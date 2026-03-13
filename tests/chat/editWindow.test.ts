import { canEditMessage } from '@/features/social/utils/chatUtils';
import type { Message } from '@/features/social/types/chat';

const NOW = new Date('2026-03-13T12:00:00Z');

function makeMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: 'msg-1',
    group_id: 'group-1',
    sender_id: 'user-1',
    content: 'Hello',
    media_url: null,
    media_type: null,
    created_at: NOW.toISOString(),
    edited_at: null,
    deleted_at: null,
    ...overrides,
  };
}

describe('canEditMessage', () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(NOW);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('returns true for own message within 15 minutes', () => {
    const message = makeMessage({
      sender_id: 'user-1',
      created_at: new Date(NOW.getTime() - 5 * 60 * 1000).toISOString(), // 5 min ago
    });
    expect(canEditMessage(message, 'user-1')).toBe(true);
  });

  it('returns false for own message older than 15 minutes', () => {
    const message = makeMessage({
      sender_id: 'user-1',
      created_at: new Date(NOW.getTime() - 20 * 60 * 1000).toISOString(), // 20 min ago
    });
    expect(canEditMessage(message, 'user-1')).toBe(false);
  });

  it('returns false for another user\'s message', () => {
    const message = makeMessage({
      sender_id: 'user-2',
      created_at: new Date(NOW.getTime() - 1 * 60 * 1000).toISOString(), // 1 min ago
    });
    expect(canEditMessage(message, 'user-1')).toBe(false);
  });

  it('returns false for a deleted message', () => {
    const message = makeMessage({
      sender_id: 'user-1',
      created_at: new Date(NOW.getTime() - 1 * 60 * 1000).toISOString(), // 1 min ago
      deleted_at: new Date(NOW.getTime() - 30 * 1000).toISOString(),
    });
    expect(canEditMessage(message, 'user-1')).toBe(false);
  });

  it('returns false exactly at the 15-minute boundary', () => {
    const message = makeMessage({
      sender_id: 'user-1',
      created_at: new Date(NOW.getTime() - 15 * 60 * 1000).toISOString(), // exactly 15 min ago
    });
    expect(canEditMessage(message, 'user-1')).toBe(false);
  });

  it('returns true just under 15 minutes', () => {
    const message = makeMessage({
      sender_id: 'user-1',
      created_at: new Date(NOW.getTime() - 14 * 60 * 1000 - 59 * 1000).toISOString(), // 14:59 ago
    });
    expect(canEditMessage(message, 'user-1')).toBe(true);
  });
});
