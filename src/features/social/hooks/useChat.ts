/**
 * useChat hook — manages real-time group chat messages.
 *
 * - Subscribes to postgres_changes INSERT/UPDATE on messages table (per group)
 * - Loads messages with cursor-based pagination (30 per page)
 * - Provides sendMessage, editMessage, deleteMessage
 * - Fire-and-forget push notification after send
 * - Deduplicates optimistic messages when Realtime confirms them
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useChatStore } from '@/stores/chatStore';
import type { Message } from '@/features/social/types/chat';

const PAGE_SIZE = 30;

/**
 * Returns true if the message can still be edited by the current user.
 * 15-minute edit window enforced both client-side and via RLS.
 */
export function canEditMessage(message: Message, currentUserId: string): boolean {
  if (message.sender_id !== currentUserId) return false;
  if (message.deleted_at) return false;
  const fifteenMinutes = 15 * 60 * 1000;
  const elapsed = Date.now() - new Date(message.created_at).getTime();
  return elapsed < fifteenMinutes;
}

export function useChat(groupId: string) {
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const { addMessage, updateMessage, prependMessages, setMessages } =
    useChatStore();
  const messages = useChatStore((s) => s.messagesByGroup[groupId] ?? []);

  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Load messages (optional cursor for pagination — cursor is created_at of oldest loaded)
  const loadMessages = useCallback(
    async (cursor?: string) => {
      setLoading(true);
      try {
        let query = (supabase.from as any)('messages')
          .select('*, profiles!sender_id(display_name, avatar_url)')
          .eq('group_id', groupId)
          .order('created_at', { ascending: false })
          .limit(PAGE_SIZE);

        if (cursor) {
          query = query.lt('created_at', cursor);
        }

        const { data, error } = await query;
        if (error) {
          console.warn('useChat: loadMessages error:', error.message);
          return;
        }

        if (!data) return;

        const reversed = [...data].reverse() as Message[];

        if (cursor) {
          // Prepend older messages
          prependMessages(groupId, reversed);
        } else {
          // Initial load — replace
          setMessages(groupId, reversed);
        }

        setHasMore(data.length === PAGE_SIZE);
      } finally {
        setLoading(false);
      }
    },
    [groupId, prependMessages, setMessages]
  );

  // Load older messages (pagination)
  const loadMore = useCallback(() => {
    const msgs = useChatStore.getState().messagesByGroup[groupId] ?? [];
    if (msgs.length === 0 || !hasMore) return;
    const oldest = msgs[0];
    loadMessages(oldest.created_at);
  }, [groupId, hasMore, loadMessages]);

  // Send a new message
  const sendMessage = useCallback(
    async (content: string, mediaUrl?: string, mediaType?: 'image' | 'video') => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await (supabase.from as any)('messages').insert({
        group_id: groupId,
        sender_id: user.id,
        content: content || null,
        media_url: mediaUrl || null,
        media_type: mediaType || null,
      });

      if (error) {
        console.warn('useChat: sendMessage error:', error.message);
        return;
      }

      // Fire-and-forget push notification for other group members
      void sendChatPushNotification(groupId, user.id, content || null);
    },
    [groupId]
  );

  // Edit own message (within 15 min, enforced by RLS too)
  const editMessage = useCallback(
    async (messageId: string, newContent: string) => {
      const { error } = await (supabase.from as any)('messages')
        .update({
          content: newContent,
          edited_at: new Date().toISOString(),
        })
        .eq('id', messageId);

      if (error) {
        console.warn('useChat: editMessage error:', error.message);
      }
    },
    []
  );

  // Soft-delete own message
  const deleteMessage = useCallback(async (messageId: string) => {
    const { error } = await (supabase.from as any)('messages')
      .update({
        deleted_at: new Date().toISOString(),
      })
      .eq('id', messageId);

    if (error) {
      console.warn('useChat: deleteMessage error:', error.message);
    }
  }, []);

  // Subscribe to Realtime for this group
  useEffect(() => {
    if (!groupId) return;

    const channel = supabase
      .channel(`group-chat:${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `group_id=eq.${groupId}`,
        },
        async (payload) => {
          const newMsg = payload.new as Message;
          // Fetch profile info for the new message sender
          const { data: profileData } = await supabase
            .from('profiles')
            .select('display_name, avatar_url')
            .eq('id', newMsg.sender_id)
            .single();
          addMessage(groupId, {
            ...newMsg,
            profiles: profileData ?? null,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          updateMessage(groupId, payload.new as Message);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [groupId, addMessage, updateMessage]);

  return {
    messages,
    loading,
    hasMore,
    loadMessages,
    loadMore,
    sendMessage,
    editMessage,
    deleteMessage,
  };
}

// ─── Push notification helper ─────────────────────────────────────────────────

/**
 * Fire-and-forget: send a chat_message push notification.
 * The Edge Function resolves non-muted recipients server-side.
 */
async function sendChatPushNotification(
  groupId: string,
  senderId: string,
  messageContent?: string | null
): Promise<void> {
  try {
    // Fetch sender profile for display name
    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', senderId)
      .single();

    const senderName = (senderProfile as any)?.display_name ?? 'Someone';

    // Fetch group name
    const { data: groupData } = await (supabase as any)
      .from('groups')
      .select('name')
      .eq('id', groupId)
      .single();

    const groupName: string = groupData?.name ?? 'Group Chat';
    const preview = messageContent
      ? messageContent.slice(0, 100)
      : 'sent a message';

    // The Edge Function handles member lookup and mute filtering server-side
    await supabase.functions.invoke('send-push', {
      body: {
        type: 'chat_message',
        group_id: groupId,
        sender_id: senderId,
        sender_name: senderName,
        group_name: groupName,
        message_preview: preview,
      },
    });
  } catch (err) {
    console.warn('sendChatPushNotification: unexpected error:', err);
  }
}
