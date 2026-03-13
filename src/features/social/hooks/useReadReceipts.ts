/**
 * useReadReceipts — track and display read receipts for a group chat.
 *
 * - markAsRead(messageId): upserts last_read_message_id into group_read_receipts
 * - fetchReceipts(): loads all read receipts for the group
 * - getMessageReadStatus(messageId): returns 'sent' | 'delivered' | 'read'
 * - Subscribes to Realtime changes on group_read_receipts for live updates
 */

import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useChatStore } from '@/stores/chatStore';
import type { GroupReadReceipt } from '@/features/social/types/chat';

/**
 * Compute the read status for a message sent by the current user.
 * - 'read': every other member has last_read_message_id >= messageId
 * - 'delivered': message exists in DB (always true after insert)
 * - 'sent': only returned as fallback
 *
 * Uses UUID string comparison which is lexicographically valid for
 * time-ordered UUIDs (v7 / gen_random_uuid ordered by insertion order).
 */
export function getMessageReadStatus(
  messageId: string,
  memberReceipts: GroupReadReceipt[],
  currentUserId: string
): 'sent' | 'delivered' | 'read' {
  const otherReceipts = memberReceipts.filter(
    (r) => r.user_id !== currentUserId
  );
  if (otherReceipts.length === 0) return 'delivered';

  // For each other member, check if they have read up to or past this message
  const allRead = otherReceipts.every(
    (r) =>
      r.last_read_message_id !== null &&
      r.last_read_message_id >= messageId
  );

  return allRead ? 'read' : 'delivered';
}

export function useReadReceipts(groupId: string) {
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const { setReceipts, updateReceipt } = useChatStore();
  const receipts = useChatStore((s) => s.receiptsByGroup[groupId] ?? []);

  const fetchReceipts = useCallback(async () => {
    const { data, error } = await (supabase as any)
      .from('group_read_receipts')
      .select('*')
      .eq('group_id', groupId);

    if (error) {
      console.warn('useReadReceipts: fetchReceipts error:', error.message);
      return;
    }
    if (data) {
      setReceipts(groupId, data as GroupReadReceipt[]);
    }
  }, [groupId, setReceipts]);

  const markAsRead = useCallback(
    async (messageId: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const receipt: GroupReadReceipt = {
        group_id: groupId,
        user_id: user.id,
        last_read_message_id: messageId,
        updated_at: new Date().toISOString(),
      };

      const { error } = await (supabase as any)
        .from('group_read_receipts')
        .upsert(receipt, { onConflict: 'group_id,user_id' });

      if (error) {
        console.warn('useReadReceipts: markAsRead error:', error.message);
        return;
      }

      // Optimistic local update
      updateReceipt(groupId, receipt);
    },
    [groupId, updateReceipt]
  );

  // Subscribe to Realtime changes on group_read_receipts for this group
  useEffect(() => {
    if (!groupId) return;

    void fetchReceipts();

    const channel = supabase
      .channel(`group-receipts:${groupId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_read_receipts',
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          if (
            payload.eventType === 'INSERT' ||
            payload.eventType === 'UPDATE'
          ) {
            updateReceipt(groupId, payload.new as GroupReadReceipt);
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [groupId, fetchReceipts, updateReceipt]);

  return { receipts, markAsRead, fetchReceipts, getMessageReadStatus };
}
