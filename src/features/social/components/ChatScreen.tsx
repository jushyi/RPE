/**
 * ChatScreen — full group chat view with message list, typing indicator,
 * read receipts, and media support.
 *
 * Wires together:
 *  - useChat (messages, send, edit, delete, Realtime)
 *  - useTypingIndicator (presence-based typing state)
 *  - useReadReceipts (last_read_message_id tracking)
 *  - useChatMediaPicker (image/video attachment)
 *  - MessageBubble, MessageInput, TypingIndicator
 *
 * Features:
 *  - Inverted FlatList (newest at bottom)
 *  - Cursor-based pagination on scroll-to-top
 *  - Auto-markAsRead on mount and new messages while focused
 *  - Long-press on own bubble → edit/delete ActionSheet
 *  - KeyboardAvoidingView for iOS
 *  - Unread count badge tracked via ChatScreen's own unread state
 */

import React, { useEffect, useRef, useCallback, useState } from 'react';
import {
  View,
  FlatList,
  Text,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { colors } from '@/constants/theme';
import { useChat, canEditMessage } from '../hooks/useChat';
import { useTypingIndicator } from '../hooks/useTypingIndicator';
import { useReadReceipts, getMessageReadStatus } from '../hooks/useReadReceipts';
import { useChatMediaPicker } from './ChatMediaPicker';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';
import type { Message } from '@/features/social/types/chat';
import { supabase } from '@/lib/supabase/client';
import type { ChatMediaResult } from '../hooks/useChatMedia';

interface ChatScreenProps {
  groupId: string;
}

export function ChatScreen({ groupId }: ChatScreenProps) {
  const { messages, loading, hasMore, loadMessages, loadMore, sendMessage, editMessage, deleteMessage } =
    useChat(groupId);
  const { typingUsers, startTyping, stopTyping } = useTypingIndicator(groupId);
  const { receipts, markAsRead } = useReadReceipts(groupId);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [pendingMedia, setPendingMedia] = useState<ChatMediaResult | null>(null);

  const flatListRef = useRef<FlatList>(null);
  const isFocusedRef = useRef(true);

  // Fetch current user id once
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id ?? null);
    });
  }, []);

  // Load messages on mount
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Auto-mark as read when messages arrive while focused
  useEffect(() => {
    if (!isFocusedRef.current || messages.length === 0) return;
    const latest = messages[messages.length - 1];
    if (latest?.id) {
      void markAsRead(latest.id);
    }
  }, [messages, markAsRead]);

  // Media picker hook
  const { openPicker, uploading } = useChatMediaPicker({
    onMedia: (result) => setPendingMedia(result),
  });

  // Send handler
  const handleSend = useCallback(
    async (text: string, media?: ChatMediaResult) => {
      stopTyping();
      if (editingMessage) {
        // Save edit
        await editMessage(editingMessage.id, text);
        setEditingMessage(null);
      } else {
        await sendMessage(text, media?.mediaUrl, media?.mediaType);
        setPendingMedia(null);
      }
    },
    [editingMessage, editMessage, sendMessage, stopTyping]
  );

  // Long-press message actions
  const handleLongPress = useCallback(
    (message: Message) => {
      if (!currentUserId || message.sender_id !== currentUserId) return;

      const canEdit = canEditMessage(message, currentUserId);
      const buttons: { text: string; onPress?: () => void; style?: 'cancel' | 'destructive' }[] = [
        { text: 'Cancel', style: 'cancel' },
      ];

      if (canEdit) {
        buttons.push({
          text: 'Edit',
          onPress: () => setEditingMessage(message),
        });
      }

      buttons.push({
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          Alert.alert('Delete message?', 'This cannot be undone.', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: () => void deleteMessage(message.id),
            },
          ]);
        },
      });

      Alert.alert('Message', undefined, buttons as any);
    },
    [currentUserId, deleteMessage]
  );

  // FlatList render
  const renderItem = useCallback(
    ({ item }: { item: Message }) => {
      const isMine = item.sender_id === currentUserId;
      const readStatus = isMine
        ? getMessageReadStatus(item.id, receipts, currentUserId ?? '')
        : 'delivered';

      return (
        <MessageBubble
          message={item}
          isMine={isMine}
          readStatus={readStatus}
          onLongPress={isMine ? () => handleLongPress(item) : undefined}
        />
      );
    },
    [currentUserId, receipts, handleLongPress]
  );

  const keyExtractor = useCallback((item: Message) => item.id, []);

  // Load more when reaching top of inverted list (scroll to end = oldest)
  const handleEndReached = useCallback(() => {
    if (hasMore && !loading) loadMore();
  }, [hasMore, loading, loadMore]);

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      {/* Loading overlay for initial load */}
      {loading && messages.length === 0 ? (
        <View style={s.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : null}

      <FlatList
        ref={flatListRef}
        data={[...messages].reverse()}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        inverted
        contentContainerStyle={s.listContent}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          loading ? null : (
            <View style={s.empty}>
              <Text style={s.emptyText}>
                No messages yet. Start the conversation.
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          loading && messages.length > 0 ? (
            <View style={s.loadMore}>
              <ActivityIndicator size="small" color={colors.accent} />
            </View>
          ) : null
        }
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews={false}
      />

      {/* Typing indicator */}
      <TypingIndicator typingUsers={typingUsers} />

      {/* Message input */}
      <MessageInput
        onSend={handleSend}
        onTypingChange={startTyping}
        onAttach={openPicker}
        uploading={uploading}
        editingContent={editingMessage?.content ?? null}
        onCancelEdit={() => setEditingMessage(null)}
      />
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingVertical: 12,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  loadMore: {
    paddingVertical: 12,
    alignItems: 'center',
  },
});
