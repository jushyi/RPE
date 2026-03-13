import { getMessageReadStatus } from '@/features/social/utils/chatUtils';
import type { GroupReadReceipt } from '@/features/social/types/chat';

// UUIDs ordered alphabetically so comparison works as expected
const MSG_ID_1 = 'aaaaaaaa-0000-0000-0000-000000000001';
const MSG_ID_2 = 'aaaaaaaa-0000-0000-0000-000000000002';
const MSG_ID_3 = 'aaaaaaaa-0000-0000-0000-000000000003';

function makeReceipt(userId: string, lastReadMessageId: string | null): GroupReadReceipt {
  return {
    group_id: 'group-1',
    user_id: userId,
    last_read_message_id: lastReadMessageId,
    updated_at: '2026-03-13T12:00:00Z',
  };
}

describe('getMessageReadStatus', () => {
  it('returns "read" when all member receipts are >= messageId', () => {
    const receipts: GroupReadReceipt[] = [
      makeReceipt('user-2', MSG_ID_2),
      makeReceipt('user-3', MSG_ID_3),
    ];
    expect(getMessageReadStatus(MSG_ID_1, receipts)).toBe('read');
  });

  it('returns "delivered" when some receipts are behind messageId', () => {
    const receipts: GroupReadReceipt[] = [
      makeReceipt('user-2', MSG_ID_2),
      makeReceipt('user-3', null), // user-3 has not read anything
    ];
    expect(getMessageReadStatus(MSG_ID_2, receipts)).toBe('delivered');
  });

  it('returns "delivered" when receipts array is empty', () => {
    expect(getMessageReadStatus(MSG_ID_1, [])).toBe('delivered');
  });

  it('returns "delivered" when a receipt has null last_read_message_id', () => {
    const receipts: GroupReadReceipt[] = [
      makeReceipt('user-2', null),
    ];
    expect(getMessageReadStatus(MSG_ID_1, receipts)).toBe('delivered');
  });

  it('returns "read" when all receipts have the same messageId', () => {
    const receipts: GroupReadReceipt[] = [
      makeReceipt('user-2', MSG_ID_1),
      makeReceipt('user-3', MSG_ID_1),
    ];
    expect(getMessageReadStatus(MSG_ID_1, receipts)).toBe('read');
  });
});
