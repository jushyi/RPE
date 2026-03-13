/**
 * Push notification dispatch for group share events.
 * Fire-and-forget: errors are logged but never block the share flow.
 */

import { supabase } from '@/lib/supabase/client';

/**
 * Send push notifications to all non-muted group members (excluding the sharer).
 *
 * This is fire-and-forget — the returned Promise is intended to be called
 * without awaiting so a notification failure never blocks the user's share action.
 */
export async function notifyGroupOnShare(
  groupId: string,
  sharerId: string,
  sharerName: string,
  contentType: 'workout' | 'pr' | 'video'
): Promise<void> {
  try {
    // Fetch non-muted members of the group, excluding the sharer
    const { data: members, error: membersError } = await (supabase as any)
      .from('group_members')
      .select('user_id, muted')
      .eq('group_id', groupId)
      .neq('user_id', sharerId);

    if (membersError) {
      console.warn('notifyGroupOnShare: failed to fetch group members:', membersError.message);
      return;
    }

    if (!members?.length) {
      return;
    }

    // Only notify non-muted members
    const recipientIds: string[] = (members as { user_id: string; muted: boolean }[])
      .filter((m) => !m.muted)
      .map((m) => m.user_id);

    if (recipientIds.length === 0) {
      return;
    }

    // Build notification text per content type
    const title = `${sharerName} shared a ${contentType}`;
    const bodyMap: Record<typeof contentType, string> = {
      workout: 'Check out their session',
      pr: 'New personal record!',
      video: 'Watch their set',
    };
    const body = bodyMap[contentType];

    const { error: invokeError } = await supabase.functions.invoke('send-push', {
      body: {
        recipient_ids: recipientIds,
        title,
        body,
        data: {
          type: 'group_share',
          group_id: groupId,
        },
      },
    });

    if (invokeError) {
      console.warn('notifyGroupOnShare: failed to invoke send-push:', invokeError.message);
    }
  } catch (err) {
    console.warn('notifyGroupOnShare: unexpected error:', err);
  }
}
