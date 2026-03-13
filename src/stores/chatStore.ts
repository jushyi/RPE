/**
 * Chat message store using Zustand + MMKV.
 * Stores messages per group, unread counts, and read receipts.
 * Types are imported from the canonical chat types module.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';
import type { Message, GroupReadReceipt } from '@/features/social/types/chat';

export type { Message, GroupReadReceipt };

// Named MMKV instance to avoid colliding with other stores
const storage = createMMKV({ id: 'chat-store' });

const mmkvStorage = {
  getItem: (name: string) => storage.getString(name) ?? null,
  setItem: (name: string, value: string) => storage.set(name, value),
  removeItem: (name: string) => {
    storage.remove(name);
  },
};

interface ChatState {
  messagesByGroup: Record<string, Message[]>;
  unreadCounts: Record<string, number>;
  receiptsByGroup: Record<string, GroupReadReceipt[]>;

  addMessage: (groupId: string, message: Message) => void;
  updateMessage: (groupId: string, message: Message) => void;
  prependMessages: (groupId: string, messages: Message[]) => void;
  setMessages: (groupId: string, messages: Message[]) => void;
  setUnreadCount: (groupId: string, count: number) => void;
  setReceipts: (groupId: string, receipts: GroupReadReceipt[]) => void;
  updateReceipt: (groupId: string, receipt: GroupReadReceipt) => void;
  clearGroup: (groupId: string) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      messagesByGroup: {},
      unreadCounts: {},
      receiptsByGroup: {},

      addMessage: (groupId, message) =>
        set((state) => {
          const existing = state.messagesByGroup[groupId] ?? [];
          // Avoid duplicates: replace optimistic (temp) or exact ID match
          const filtered = existing.filter((m) => m.id !== message.id);
          return {
            messagesByGroup: {
              ...state.messagesByGroup,
              [groupId]: [...filtered, message],
            },
          };
        }),

      updateMessage: (groupId, message) =>
        set((state) => ({
          messagesByGroup: {
            ...state.messagesByGroup,
            [groupId]: (state.messagesByGroup[groupId] ?? []).map((m) =>
              m.id === message.id ? { ...m, ...message } : m
            ),
          },
        })),

      prependMessages: (groupId, messages) =>
        set((state) => {
          const existing = state.messagesByGroup[groupId] ?? [];
          // Avoid duplicates when prepending older messages
          const existingIds = new Set(existing.map((m) => m.id));
          const newMessages = messages.filter((m) => !existingIds.has(m.id));
          return {
            messagesByGroup: {
              ...state.messagesByGroup,
              [groupId]: [...newMessages, ...existing],
            },
          };
        }),

      setMessages: (groupId, messages) =>
        set((state) => ({
          messagesByGroup: {
            ...state.messagesByGroup,
            [groupId]: messages,
          },
        })),

      setUnreadCount: (groupId, count) =>
        set((state) => ({
          unreadCounts: { ...state.unreadCounts, [groupId]: count },
        })),

      setReceipts: (groupId, receipts) =>
        set((state) => ({
          receiptsByGroup: { ...state.receiptsByGroup, [groupId]: receipts },
        })),

      updateReceipt: (groupId, receipt) =>
        set((state) => {
          const existing = state.receiptsByGroup[groupId] ?? [];
          const idx = existing.findIndex((r) => r.user_id === receipt.user_id);
          const updated =
            idx >= 0
              ? existing.map((r, i) => (i === idx ? receipt : r))
              : [...existing, receipt];
          return {
            receiptsByGroup: { ...state.receiptsByGroup, [groupId]: updated },
          };
        }),

      clearGroup: (groupId) =>
        set((state) => {
          const { [groupId]: _msgs, ...restMsgs } = state.messagesByGroup;
          const { [groupId]: _counts, ...restCounts } = state.unreadCounts;
          const { [groupId]: _receipts, ...restReceipts } = state.receiptsByGroup;
          return {
            messagesByGroup: restMsgs,
            unreadCounts: restCounts,
            receiptsByGroup: restReceipts,
          };
        }),
    }),
    {
      name: 'chat-store',
      version: 1,
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
