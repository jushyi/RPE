---
phase: 18-deferred-group-chat-features-from-phase-17-discussion
plan: "05"
subsystem: social/chat
tags: [chat, realtime, push-notifications, websockets, media, presence]
dependency_graph:
  requires: [18-01, 18-03, 18-04]
  provides: [group-chat-push-notifications, fully-integrated-chat-screen, group-tabs]
  affects: [supabase/functions/send-push, social-group-feed]
tech_stack:
  added: []
  patterns:
    - Supabase Realtime postgres_changes for chat message delivery
    - Supabase Realtime Presence for typing indicators
    - Expo push notifications via extended send-push Edge Function
    - Zustand + MMKV persist for chat message store (chatStore)
    - Inverted FlatList for chat UI (newest at bottom)
    - KeyboardAvoidingView with iOS padding behavior
key_files:
  created:
    - src/features/social/hooks/useChat.ts
    - src/features/social/hooks/useTypingIndicator.ts
    - src/features/social/hooks/useReadReceipts.ts
    - src/features/social/hooks/useChatMedia.ts
    - src/features/social/components/ChatScreen.tsx
    - src/features/social/components/MessageBubble.tsx
    - src/features/social/components/MessageInput.tsx
    - src/features/social/components/TypingIndicator.tsx
    - src/features/social/components/ChatMediaPicker.tsx
    - src/features/social/components/GroupTabs.tsx
  modified:
    - supabase/functions/send-push/index.ts
    - app/(app)/social/group-feed.tsx
decisions:
  - "[18-05]: send-push Edge Function extended with chat_message type that resolves recipients server-side (group_members + mute filter) rather than client-side for security"
  - "[18-05]: useTypingIndicator uses separate group-typing channel to avoid conflicts with useChat's group-chat channel"
  - "[18-05]: ChatScreen uses inverted FlatList with data reversed so newest messages appear at bottom"
  - "[18-05]: useChatMedia dynamic import for VideoThumbnails (best-effort; falls back gracefully)"
  - "[18-05]: GroupTabs wraps feed content as a prop (ReactNode) to avoid duplicating feed logic"
metrics:
  duration: 9min
  completed: "2026-03-13"
  tasks_completed: 1
  tasks_total: 2
  files_created: 10
  files_modified: 2
---

# Phase 18 Plan 05: Push Notifications for Chat and Full Integration Summary

**One-liner:** Chat push notifications via extended send-push Edge Function with server-side mute filtering, plus fully integrated ChatScreen wiring useChat + useTypingIndicator + useReadReceipts + useChatMedia into GroupTabs Feed/Chat switcher.

## What Was Built

### send-push Edge Function Extension

Extended `supabase/functions/send-push/index.ts` with a dedicated `chat_message` path:
- Accepts `{ type: 'chat_message', group_id, sender_id, sender_name, group_name, message_preview }`
- Fetches non-muted group members server-side (bypasses RLS via service role)
- Sends push with title=group_name, body="[sender]: [preview]"
- Falls back gracefully: no members, all muted, or no push tokens each return 200 with `sent: 0`
- Backward-compatible: existing `recipient_ids` callers still work via the direct path

### useChat Hook

`src/features/social/hooks/useChat.ts`:
- Cursor-based pagination (30 messages per page, DESC order, reversed for FlatList)
- Realtime `postgres_changes` subscription on `messages` table filtered by `group_id`
- INSERT handler fetches sender profile for avatar/name display
- UPDATE handler handles edit/delete propagation
- `sendMessage` → fire-and-forget push via `sendChatPushNotification`
- `editMessage` (15-min window enforced by RLS)
- `deleteMessage` (soft delete, sets `deleted_at`)
- `canEditMessage` exported as pure function for UI disabling

### useTypingIndicator Hook

`src/features/social/hooks/useTypingIndicator.ts`:
- Separate `group-typing:${groupId}` Presence channel (clean separation from messages channel)
- `startTyping()`: tracks `{ typing: true }`, auto-resets after 2s idle via `setTimeout`
- `stopTyping()`: immediately tracks `{ typing: false }`, clears timeout
- AppState listener: on background → `channel.untrack()` (prevents ghost typing, Pitfall 5)
- Cleans up on unmount: untrack + removeChannel

### useReadReceipts Hook

`src/features/social/hooks/useReadReceipts.ts`:
- `markAsRead(messageId)`: upserts `group_read_receipts` with `onConflict: 'group_id,user_id'`
- Subscribes to `postgres_changes` on `group_read_receipts` for real-time receipt updates
- `getMessageReadStatus` exported as pure function: returns 'read' | 'delivered' | 'sent'

### useChatMedia Hook

`src/features/social/hooks/useChatMedia.ts`:
- `pickImage()`, `pickVideo()`, `takePhoto()` via `expo-image-picker`
- Uploads to `chat-media` Supabase Storage bucket using `fetch()` fallback pattern
- Video thumbnail generation via dynamic `expo-video-thumbnails` import (best-effort)
- Returns `{ mediaUrl, mediaType, thumbnailUrl? }`

### ChatScreen Component

`src/features/social/components/ChatScreen.tsx`:
- Wires all hooks: useChat + useTypingIndicator + useReadReceipts + useChatMediaPicker
- Inverted FlatList (data reversed) with `onEndReached` for `loadMore` pagination
- Auto-markAsRead on mount and when new messages arrive while focused
- Long-press on own messages → Alert with Edit / Delete options
- Edit mode: populates MessageInput with existing content
- `KeyboardAvoidingView` with `behavior="padding"` on iOS

### MessageBubble Component

`src/features/social/components/MessageBubble.tsx`:
- Own messages: right-aligned, magenta (`colors.accent`) background, white text
- Others' messages: left-aligned, `surfaceElevated` background, avatar + sender name
- Deleted state: italicized "This message was deleted" placeholder
- Edited state: "edited" label below content
- Media: Image tap → fullscreen modal; Video tap → VideoView modal with play button
- Read receipt icons: `checkmark-outline` (delivered), `checkmark-done` (read, blue tint)

### MessageInput Component

`src/features/social/components/MessageInput.tsx`:
- Expandable `TextInput` (maxHeight 120dp)
- Attach button (Ionicons `attach`) → calls `onAttach` (ChatMediaPicker)
- Send button (Ionicons `send`) disabled when empty
- Edit mode banner ("Editing message") with cancel button
- Pending media preview with remove button

### TypingIndicator Component

`src/features/social/components/TypingIndicator.tsx`:
- Animated opacity pulse (0.4 ↔ 1.0, 600ms interval)
- Shows "X is typing..." or "X and Y are typing..."
- Hidden when `typingUsers` array is empty

### GroupTabs Component

`src/features/social/components/GroupTabs.tsx`:
- Feed | Chat tab bar with magenta underline on active tab
- Unread count badge on Chat tab (reads from `chatStore.unreadCounts`)
- Renders `feedContent` prop or `<ChatScreen groupId={groupId} />` based on active tab

### group-feed.tsx Update

Replaced direct `FlatList` render with `<GroupTabs groupId feedContent={...} />`. Feed content passed as `ReactNode` prop to avoid duplicating feed logic.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Missing Prerequisites] Built all chat infrastructure (Plans 18-03 and 18-04 were never executed)**
- **Found during:** Task 1 execution - `src/features/social/hooks/useChat.ts`, `ChatScreen.tsx` did not exist
- **Issue:** Plans 18-03 (core chat UI) and 18-04 (typing/receipts/media) had never been executed, leaving zero chat files
- **Fix:** Built all required files as part of Plan 18-05 execution: 10 new files covering all functionality from both prior plans plus Plan 18-05's push notification integration
- **Files created:** All listed in key_files.created above
- **Commit:** b81a9b3

**2. [Rule 1 - Design] Separated typing indicator into its own Presence channel**
- **Found during:** Task 1 - potential conflict between postgres_changes subscription and Presence on same channel
- **Fix:** Used `group-typing:${groupId}` for Presence (typing) and `group-chat:${groupId}` for postgres_changes (messages), keeping clean separation per Supabase best practices
- **Commit:** b81a9b3

## Self-Check: PASSED

All 12 files present. Commit b81a9b3 verified in git log.
Pre-existing test failures (csvExport, sync-queue) confirmed to exist before this plan's changes.
Chat tests: 26/26 passing (npx jest --testPathPattern=chat).
