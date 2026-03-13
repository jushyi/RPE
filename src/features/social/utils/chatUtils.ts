/**
 * Pure utility functions for group chat messaging.
 * These functions contain no side effects and can be unit-tested in isolation.
 */

import type { Message, GroupReadReceipt } from '@/features/social/types/chat';

/** 15-minute edit window in milliseconds */
const EDIT_WINDOW_MS = 15 * 60 * 1000;

/**
 * Returns true if the current user can edit the given message.
 *
 * Conditions for editability:
 * 1. The message was sent by currentUserId
 * 2. The message has not been soft-deleted
 * 3. The message was created less than 15 minutes ago
 */
export function canEditMessage(message: Message, currentUserId: string): boolean {
  if (message.sender_id !== currentUserId) return false;
  if (message.deleted_at !== null) return false;
  const elapsed = Date.now() - new Date(message.created_at).getTime();
  return elapsed < EDIT_WINDOW_MS;
}

/**
 * Returns the read status of a message based on member read receipts.
 *
 * - 'read': all receipts have last_read_message_id >= messageId
 * - 'delivered': at least one receipt is behind or receipts array is empty
 *
 * Uses lexicographic UUID comparison which preserves chronological order
 * when UUIDs are generated with gen_random_uuid() — compare by string works
 * because we compare message IDs by >= (same UUID = read).
 */
export function getMessageReadStatus(
  messageId: string,
  memberReceipts: GroupReadReceipt[]
): 'read' | 'delivered' {
  if (memberReceipts.length === 0) return 'delivered';

  const allRead = memberReceipts.every(
    (r) => r.last_read_message_id !== null && r.last_read_message_id >= messageId
  );

  return allRead ? 'read' : 'delivered';
}

/**
 * Creates a debounced typing indicator controller.
 *
 * - `trigger()`: calls onStart immediately, then schedules onStop after `delayMs` of inactivity.
 *   Each call to trigger() resets the timer (debounce behavior).
 * - `cancel()`: clears the pending timer so onStop is never called.
 *
 * This is a pure function with no side effects on the returned functions,
 * making it straightforward to unit-test with jest fake timers.
 *
 * @param onStart - Called each time typing begins (or continues)
 * @param onStop - Called once after `delayMs` ms of inactivity
 * @param delayMs - Idle timeout before onStop fires (default: 2000)
 */
export function createTypingDebounce(
  onStart: () => void,
  onStop: () => void,
  delayMs: number = 2000
): { trigger: () => void; cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | null = null;

  const trigger = () => {
    onStart();

    if (timer !== null) {
      clearTimeout(timer);
    }

    timer = setTimeout(() => {
      timer = null;
      onStop();
    }, delayMs);
  };

  const cancel = () => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  };

  return { trigger, cancel };
}

/**
 * Formats a message timestamp for display in the chat UI.
 *
 * - Today: "HH:MM" (e.g., "14:30")
 * - Yesterday: "Yesterday HH:MM" (e.g., "Yesterday 09:15")
 * - Older: "MMM D HH:MM" (e.g., "Mar 5 08:00")
 */
export function formatMessageTime(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  const now = new Date();

  const pad = (n: number) => n.toString().padStart(2, '0');
  const timeStr = `${pad(date.getHours())}:${pad(date.getMinutes())}`;

  // Compare dates by stripping time components
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (msgDate.getTime() === today.getTime()) {
    return timeStr;
  }

  if (msgDate.getTime() === yesterday.getTime()) {
    return `Yesterday ${timeStr}`;
  }

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()} ${timeStr}`;
}
