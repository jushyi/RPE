# Phase 18: Deferred Group Chat Features - Research

**Researched:** 2026-03-12
**Domain:** Real-time group chat (Supabase Realtime, messaging, presence, media in chat), enhanced share flow
**Confidence:** HIGH

## Summary

Phase 18 adds three major features on top of Phase 17's social infrastructure: (1) real-time group chat messaging with text/image/video support, delivered via Supabase Realtime broadcast channels with messages persisted in a `messages` table, (2) enhanced share flow with per-content-type checkboxes and retroactive sharing from workout history, and (3) message features including read receipts, typing indicators, edit/delete with time constraints.

The app already uses `@supabase/supabase-js` which includes the Realtime client -- no new dependencies are needed. The Supabase Realtime system provides three primitives: **Broadcast** (ephemeral low-latency messages between clients), **Presence** (shared state tracking for online/typing indicators), and **Postgres Changes** (database change notifications). For chat, the recommended approach is: persist messages to the `messages` table, use **Postgres Changes** to listen for new inserts in real-time, use **Presence** for typing indicators, and use **Broadcast** for ephemeral events like "user stopped typing." This avoids building a custom WebSocket layer while getting true real-time delivery.

**Primary recommendation:** Use Supabase Realtime `postgres_changes` on the `messages` table for real-time message delivery (one channel per group). Use Presence for typing indicators. Persist all messages server-side. Track read state via a `group_read_receipts` table with `last_read_message_id` per user per group (simpler than per-message tracking). Reuse existing `send-push` Edge Function for chat push notifications. Enhance the existing `SharePrompt` component from Phase 17 with content-type checkboxes.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Full group chat: separate Chat tab alongside the existing Feed tab within each group screen
- Real-time delivery via Supabase Realtime subscriptions (messages appear instantly)
- Text, images, and videos supported in chat messages
- Push notifications for new chat messages, respects existing per-group mute toggle from Phase 17
- Muting a group silences both feed shares and chat notifications
- Per-share content-type selection: when sharing after a workout, user picks which content types to include (workout summary, PRs, videos) via checkboxes
- Enhances Phase 17's share flow (not a separate feature) -- adds content-type checkboxes alongside group selection
- Full workout summary only (no individual exercise selection)
- Individual PR selection: each PR from the session shown as a separate selectable checkbox
- Videos selectable individually per set
- Share button on workout detail screen in History tab
- Opens the same share flow (pick content types + target groups)
- No time limit -- any past workout can be shared
- Both dates shown on feed card: share date for timeline ordering, "Workout from [original date]" label for context
- Re-sharing allowed: same workout can be shared to different groups or re-shared to the same group
- Delivered + read receipts (checkmark for delivered, double-check/blue for read -- WhatsApp-style)
- Typing indicators ("[Name] is typing..." via Supabase Realtime presence)
- Edit and delete own messages
- 15-minute edit window -- after 15 minutes, message is locked (shows "edited" indicator when edited)
- Delete shows "This message was deleted" placeholder

### Claude's Discretion
- Chat UI layout and message bubble styling
- Image/video upload handling in chat (compression, size limits)
- Message pagination strategy (cursor-based, load older messages on scroll)
- Database schema for messages table (id, group_id, sender_id, content, media_url, type, created_at, edited_at, deleted_at)
- RLS policies for group-scoped message access
- Supabase Realtime channel structure (per-group channels)
- Typing indicator debounce/throttle strategy
- Read receipt tracking mechanism (last_read_at per user per group vs per-message)
- How to handle offline message queue
- Message input UI (expandable text input, media attachment button placement)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

## Standard Stack

### Core (Already in Project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | ^2.99.0 | Realtime channels, broadcast, presence, postgres_changes, DB operations | Already project standard; Realtime client included |
| zustand | ^5.0.11 | Chat message store, unread counts | Established project pattern |
| react-native-mmkv | ^4.2.0 | Offline message draft persistence, read state cache | Established project pattern |
| expo-image-picker | ~55.0.11 | Pick images/videos for chat messages | Already in project |
| expo-video | ~55.0.10 | Video playback in chat | Already in project |
| expo-video-thumbnails | ~55.0.10 | Generate thumbnails for video messages | Already in project |
| expo-file-system | ~55.0.10 | File operations for media uploads | Already in project |
| expo-notifications | ~55.0.11 | Push notifications for chat messages | Already in project |

### No New Dependencies Required

This phase builds entirely on the existing stack. Supabase Realtime (broadcast, presence, postgres_changes) is included in `@supabase/supabase-js` and requires no additional packages.

## Architecture Patterns

### Recommended Feature Structure
```
src/features/social/
  hooks/
    useChat.ts              # Chat messages: send, edit, delete, subscribe
    useTypingIndicator.ts   # Presence-based typing indicator
    useReadReceipts.ts      # Track and display read state
    useChatMedia.ts         # Image/video upload for chat messages
    useRetroactiveShare.ts  # Share from history detail screen
  components/
    ChatScreen.tsx          # Full chat view (message list + input)
    MessageBubble.tsx       # Single message bubble (text/image/video)
    MessageInput.tsx        # Expandable text input with media button
    TypingIndicator.tsx     # "[Name] is typing..." display
    ReadReceiptIcon.tsx     # Checkmark / double-check icons
    ChatMediaPicker.tsx     # Image/video attachment picker
    ContentTypeCheckboxes.tsx  # Checkboxes for share content selection
    RetroShareButton.tsx    # Share button on history detail screen
    GroupTabs.tsx           # Feed | Chat tab switcher within group screen

app/(app)/social/
  group-feed.tsx            # MODIFIED: Add tab switcher (Feed | Chat)
  group-chat.tsx            # New: Chat screen route (or inline in group-feed with tabs)

app/(app)/history/
  session-detail.tsx        # MODIFIED: Add share button
```

### Pattern 1: Supabase Realtime for Chat Messages

**What:** Subscribe to new message inserts via `postgres_changes` on the `messages` table, filtered by `group_id`. This gives real-time delivery when messages are inserted into the database.

**When to use:** When a user opens a group chat screen.

**Why postgres_changes over broadcast:** Messages need to be persisted anyway. Using `postgres_changes` means the insert is the single source of truth -- both persistence and real-time delivery happen from one operation. Broadcast would require separate insert + broadcast calls.

```typescript
// Source: Supabase Realtime docs
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
    (payload) => {
      const newMessage = payload.new as Message;
      addMessageToStore(newMessage);
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
      const updatedMessage = payload.new as Message;
      updateMessageInStore(updatedMessage);
    }
  )
  .subscribe();

// Cleanup on unmount
return () => {
  supabase.removeChannel(channel);
};
```

### Pattern 2: Presence for Typing Indicators

**What:** Use Supabase Realtime Presence to track which users are currently typing in a group chat.

**Debounce strategy:** Track typing with a 2-second debounce. When user types, call `track()` with `{ typing: true }`. After 2 seconds of no input, call `track()` with `{ typing: false }`. Other clients listen to `sync` events and filter for users where `typing === true`.

```typescript
// Source: Supabase Presence docs
const chatChannel = supabase.channel(`group-chat:${groupId}`, {
  config: {
    presence: { key: userId },
  },
});

// Listen for typing
chatChannel
  .on('presence', { event: 'sync' }, () => {
    const state = chatChannel.presenceState();
    const typingUsers = Object.entries(state)
      .filter(([key, presences]) =>
        key !== userId &&
        (presences as any[])[0]?.typing === true
      )
      .map(([key]) => key);
    setTypingUsers(typingUsers);
  })
  .subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await chatChannel.track({ typing: false, user_name: displayName });
    }
  });

// When user types (debounced)
let typingTimeout: NodeJS.Timeout;
const onTextChange = (text: string) => {
  setText(text);
  chatChannel.track({ typing: true, user_name: displayName });
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    chatChannel.track({ typing: false, user_name: displayName });
  }, 2000);
};
```

### Pattern 3: Read Receipts via last_read_message_id

**What:** Track read state with a `group_read_receipts` table storing `(group_id, user_id, last_read_message_id, updated_at)`. When a user opens a chat, update their `last_read_message_id` to the latest message. To show read status on a message, check if all other group members' `last_read_message_id >= message.id`.

**Why last_read over per-message:** Far fewer rows (1 per user per group vs 1 per user per message). Sufficient for WhatsApp-style read receipts where you only need to know "has this person read up to this point."

**Delivered vs Read:**
- **Delivered** = message exists in database (confirmed by successful insert)
- **Read** = recipient's `last_read_message_id >= message.id`

```typescript
// Update read position when user views messages
async function markAsRead(groupId: string, messageId: string) {
  await (supabase.from as any)('group_read_receipts')
    .upsert(
      {
        group_id: groupId,
        user_id: userId,
        last_read_message_id: messageId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'group_id,user_id' }
    );
}

// Check if message is read by all members
function getMessageReadStatus(
  messageId: string,
  memberReceipts: GroupReadReceipt[]
): 'sent' | 'delivered' | 'read' {
  // Message exists = delivered
  // All other members have last_read >= this message = read
  const allRead = memberReceipts.every(
    (r) => r.last_read_message_id >= messageId
  );
  return allRead ? 'read' : 'delivered';
}
```

### Pattern 4: Message Edit/Delete with Time Window

**What:** Allow editing own messages within 15 minutes. After that, message is locked. Delete soft-deletes by setting `deleted_at`.

```typescript
function canEditMessage(message: Message, currentUserId: string): boolean {
  if (message.sender_id !== currentUserId) return false;
  if (message.deleted_at) return false;
  const fifteenMinutes = 15 * 60 * 1000;
  const elapsed = Date.now() - new Date(message.created_at).getTime();
  return elapsed < fifteenMinutes;
}

async function editMessage(messageId: string, newContent: string) {
  await (supabase.from as any)('messages')
    .update({
      content: newContent,
      edited_at: new Date().toISOString(),
    })
    .eq('id', messageId)
    .eq('sender_id', userId); // RLS also enforces this
}

async function deleteMessage(messageId: string) {
  await (supabase.from as any)('messages')
    .update({
      deleted_at: new Date().toISOString(),
    })
    .eq('id', messageId)
    .eq('sender_id', userId);
}
```

### Pattern 5: Enhanced Share Flow with Content-Type Checkboxes

**What:** Modify Phase 17's `SharePrompt` component to include checkboxes for content types. The same component is reused for retroactive sharing from history.

```typescript
interface ShareableContent {
  workoutSummary: boolean;          // Full summary toggle
  selectedPRs: string[];            // PR IDs selected
  selectedVideos: string[];         // Set log IDs with videos selected
}

// SharePrompt enhanced with content selection
<SharePrompt
  session={session}
  prs={prExercises}
  videos={videoSets}
  onShare={(content: ShareableContent, groupIds: string[]) => {
    // Create shared_items entries for each selected content + group
  }}
/>
```

### Pattern 6: Retroactive Sharing from History

**What:** Add a Share button to the workout detail screen in History tab. It opens the same SharePrompt flow, but populates from the historical session data.

**Both dates:** Feed cards for retroactively shared content show:
- Timeline position: based on `shared_items.created_at` (share date)
- Label: "Workout from [session.logged_at]" to show original workout date

```typescript
// shared_items payload for retroactive share
{
  content_type: 'workout',
  payload: {
    session_id: 'abc-123',
    workout_date: '2026-03-01',  // Original workout date
    title: 'Push Day',
    exercises: [...],
    total_volume: 12500,
    duration_seconds: 3600,
  }
}
// The feed card shows "Workout from Mar 1, 2026" with the card positioned at share time
```

### Pattern 7: Chat Media Upload

**What:** Reuse the video upload pattern from Phase 14 (`videoUploadQueue.ts`). For images, upload to a new `chat-media` Supabase Storage bucket.

```typescript
async function uploadChatMedia(
  userId: string,
  messageId: string,
  localUri: string,
  mediaType: 'image' | 'video',
): Promise<string> {
  const file = new File(localUri);
  const arrayBuffer = await file.arrayBuffer();
  const ext = localUri.split('.').pop()?.toLowerCase() || (mediaType === 'image' ? 'jpg' : 'mp4');
  const contentType = mediaType === 'image'
    ? `image/${ext === 'png' ? 'png' : 'jpeg'}`
    : (ext === 'mov' ? 'video/quicktime' : 'video/mp4');

  const filePath = `${userId}/${messageId}.${ext}`;

  const { error } = await supabase.storage
    .from('chat-media')
    .upload(filePath, arrayBuffer, { contentType, upsert: true });

  if (error) throw error;

  const { data } = supabase.storage.from('chat-media').getPublicUrl(filePath);
  return data.publicUrl;
}
```

### Anti-Patterns to Avoid
- **Broadcast-only chat without persistence:** Do NOT use broadcast as the sole message delivery mechanism. Messages must be persisted to the `messages` table. Use `postgres_changes` for real-time delivery of persisted messages.
- **Per-message read receipt rows:** Do NOT create a `message_read_receipts` table with one row per user per message. This explodes in size. Use `last_read_message_id` per user per group.
- **Polling for new messages:** Do NOT poll the messages table on an interval. Supabase Realtime `postgres_changes` provides instant delivery.
- **Client-side edit window enforcement only:** The 15-minute edit window MUST be enforced in RLS policy, not just client-side. A malicious client could bypass client checks.
- **Building a custom WebSocket layer:** Supabase Realtime already provides channels, presence, and postgres_changes. Do not use a separate WebSocket library.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Real-time message delivery | Custom WebSocket | Supabase Realtime `postgres_changes` | Already included in supabase-js, handles reconnection |
| Typing indicators | Custom ping/pong | Supabase Realtime Presence | Built-in state sync with join/leave/sync events |
| Push notifications for chat | New Edge Function | Reuse `send-push` Edge Function | Already handles multi-recipient, token lookup |
| Video upload in chat | New upload pipeline | Adapt `videoUploadQueue.ts` pattern | Same Storage API, same file handling |
| Image picking | Custom picker | `expo-image-picker` | Already in project, handles permissions |
| Video thumbnails | Custom thumbnail gen | `expo-video-thumbnails` | Already in project |
| Share prompt UI | New component | Enhance Phase 17's `SharePrompt` | Same UX, just add checkboxes |

## Common Pitfalls

### Pitfall 1: Realtime Channel Leaks
**What goes wrong:** Channels are subscribed but never unsubscribed, leading to memory leaks and duplicate messages.
**Why it happens:** Forgetting cleanup in useEffect, or navigating away without removing the channel.
**How to avoid:** Always call `supabase.removeChannel(channel)` in the useEffect cleanup. Use a ref to track the current channel instance.
**Warning signs:** Duplicate messages appearing, performance degradation after navigating between groups.

### Pitfall 2: Edit Window Race Condition
**What goes wrong:** User starts editing at 14:59, submits at 15:01, but client allows it because check was done at edit start.
**Why it happens:** Client-side time check at edit initiation, not at submission.
**How to avoid:** Enforce 15-minute window in both client AND server. RLS policy: `CHECK(now() - created_at < interval '15 minutes')` on UPDATE. Client disables edit button after 15 minutes for UX.
**Warning signs:** Messages edited after the window.

### Pitfall 3: Optimistic Message Ordering
**What goes wrong:** Optimistically added messages appear out of order when the server-confirmed version arrives via `postgres_changes`.
**Why it happens:** Local timestamp differs from server `created_at`.
**How to avoid:** Use a temporary local ID for optimistic messages. When the `postgres_changes` INSERT event arrives, replace the optimistic message with the server version. Use `id` matching, not content matching.
**Warning signs:** Messages jumping position in the list.

### Pitfall 4: Chat Notifications for Active Users
**What goes wrong:** User receives a push notification for a message they are currently viewing.
**Why it happens:** Push notification sent to all non-muted members regardless of online status.
**How to avoid:** Two approaches: (a) Edge Function checks presence state before sending push (complex), or (b) client silently dismisses notifications for the currently active group chat (simpler). Recommend option (b).
**Warning signs:** Notifications appearing while user is looking at the chat.

### Pitfall 5: Presence State on App Background
**What goes wrong:** User backgrounds the app but presence still shows them as "typing."
**Why it happens:** AppState change not tracked, presence not cleaned up.
**How to avoid:** Listen to `AppState` changes. On background, call `channel.untrack()`. On foreground, re-track with `{ typing: false }`. The existing `AppState` listener in `client.ts` shows the pattern.
**Warning signs:** Ghost typing indicators.

### Pitfall 6: Large Media in Chat Without Compression
**What goes wrong:** Users send full-resolution photos/videos, causing slow uploads and high storage costs.
**Why it happens:** No compression or size limits.
**How to avoid:** Use `expo-image-picker`'s `quality` option (0.7 for images). For videos, limit duration (e.g., 30 seconds) and use `videoQuality: ImagePicker.UIImagePickerControllerQualityType.Medium`. Set a max file size (e.g., 50MB for video, 5MB for images).
**Warning signs:** Slow message sending, storage costs spiking.

### Pitfall 7: Retroactive Share Missing Video URLs
**What goes wrong:** Sharing a past workout's videos fails because local URIs are gone and only `video_url` in `set_logs` has the data.
**Why it happens:** Retroactive share tries to use local video data that was cleaned up.
**How to avoid:** For retroactive shares, always fetch `video_url` from `set_logs` table in Supabase, not from local storage. The video is already uploaded.
**Warning signs:** Missing video thumbnails in retroactive share prompt.

## Database Schema

### Messages Table
```sql
-- Migration: 20260319000001_create_messages.sql

CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT,                    -- Text content (null for media-only messages)
  media_url TEXT,                  -- URL to uploaded media in chat-media bucket
  media_type TEXT CHECK (media_type IN ('image', 'video') OR media_type IS NULL),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  edited_at TIMESTAMPTZ,           -- Non-null = message was edited
  deleted_at TIMESTAMPTZ,          -- Non-null = soft-deleted
  CONSTRAINT content_or_media CHECK (content IS NOT NULL OR media_url IS NOT NULL)
);

CREATE INDEX idx_messages_group_created ON public.messages (group_id, created_at DESC);
CREATE INDEX idx_messages_sender ON public.messages (sender_id);

-- RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Members can view messages (excluding soft-deleted content is handled client-side for "deleted" placeholder)
CREATE POLICY "Members can view group messages"
  ON public.messages FOR SELECT
  USING (public.is_group_member(group_id));

-- Members can insert messages
CREATE POLICY "Members can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id AND public.is_group_member(group_id));

-- Sender can edit within 15 minutes (content only, not deleted_at)
CREATE POLICY "Sender can edit own messages within 15 min"
  ON public.messages FOR UPDATE
  USING (auth.uid() = sender_id AND deleted_at IS NULL)
  WITH CHECK (
    auth.uid() = sender_id
    AND (
      -- Allow setting deleted_at (soft delete, no time limit)
      deleted_at IS NOT NULL
      OR
      -- Allow editing content within 15 minutes
      (now() - created_at < interval '15 minutes')
    )
  );

-- Enable Realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
```

### Read Receipts Table
```sql
CREATE TABLE public.group_read_receipts (
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_read_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);

ALTER TABLE public.group_read_receipts ENABLE ROW LEVEL SECURITY;

-- Members can view read receipts for their groups
CREATE POLICY "Members can view group read receipts"
  ON public.group_read_receipts FOR SELECT
  USING (public.is_group_member(group_id));

-- Users can update their own read receipt
CREATE POLICY "Users can update own read receipt"
  ON public.group_read_receipts FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.is_group_member(group_id));

CREATE POLICY "Users can update own read receipt update"
  ON public.group_read_receipts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### Chat Media Storage Bucket
```sql
-- Create a new bucket for chat media (separate from set-videos)
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-media', 'chat-media', true);

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload chat media"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'chat-media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Public read for chat media
CREATE POLICY "Anyone can read chat media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'chat-media');

-- Users can delete their own chat media
CREATE POLICY "Users can delete own chat media"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'chat-media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

### Enhanced shared_items for Retroactive Sharing
```sql
-- Add original_workout_date to shared_items payload convention
-- No schema change needed -- payload is JSONB and already flexible
-- Convention: retroactive shares include 'workout_date' field in payload
-- Feed cards check for payload->>'workout_date' to show "Workout from [date]"
```

## Code Examples

### Chat Message Store (Zustand + MMKV)
```typescript
// src/stores/chatStore.ts
import { create } from 'zustand';
import { createMMKV } from 'react-native-mmkv';

const storage = createMMKV({ id: 'chat-store' });

interface ChatState {
  messagesByGroup: Record<string, Message[]>;
  unreadCounts: Record<string, number>;
  addMessage: (groupId: string, message: Message) => void;
  updateMessage: (groupId: string, message: Message) => void;
  setMessages: (groupId: string, messages: Message[]) => void;
  setUnreadCount: (groupId: string, count: number) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messagesByGroup: {},
  unreadCounts: {},
  addMessage: (groupId, message) =>
    set((state) => ({
      messagesByGroup: {
        ...state.messagesByGroup,
        [groupId]: [...(state.messagesByGroup[groupId] || []), message],
      },
    })),
  updateMessage: (groupId, message) =>
    set((state) => ({
      messagesByGroup: {
        ...state.messagesByGroup,
        [groupId]: (state.messagesByGroup[groupId] || []).map((m) =>
          m.id === message.id ? message : m
        ),
      },
    })),
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
}));
```

### Chat Hook with Realtime Subscription
```typescript
// src/features/social/hooks/useChat.ts
import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useChatStore } from '@/stores/chatStore';

export function useChat(groupId: string) {
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const { addMessage, updateMessage, setMessages } = useChatStore();

  // Load initial messages (cursor-based, newest first)
  const loadMessages = useCallback(async (cursor?: string) => {
    let query = (supabase.from as any)('messages')
      .select('*, profiles!sender_id(display_name, avatar_url)')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })
      .limit(30);

    if (cursor) query = query.lt('created_at', cursor);

    const { data } = await query;
    if (data) setMessages(groupId, data.reverse());
  }, [groupId]);

  // Subscribe to realtime
  useEffect(() => {
    const channel = supabase
      .channel(`group-chat:${groupId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `group_id=eq.${groupId}`,
      }, (payload) => {
        addMessage(groupId, payload.new as Message);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `group_id=eq.${groupId}`,
      }, (payload) => {
        updateMessage(groupId, payload.new as Message);
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [groupId]);

  // Send message
  const sendMessage = useCallback(async (content: string, mediaUrl?: string, mediaType?: 'image' | 'video') => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await (supabase.from as any)('messages').insert({
      group_id: groupId,
      sender_id: user.id,
      content: content || null,
      media_url: mediaUrl || null,
      media_type: mediaType || null,
    });
  }, [groupId]);

  return { loadMessages, sendMessage };
}
```

### Message Bubble Rendering Logic
```typescript
function renderMessage(message: Message, currentUserId: string) {
  const isMine = message.sender_id === currentUserId;
  const isDeleted = message.deleted_at !== null;
  const isEdited = message.edited_at !== null && !isDeleted;
  const canEdit = canEditMessage(message, currentUserId);

  if (isDeleted) {
    return <DeletedMessagePlaceholder isMine={isMine} />;
    // Shows: "This message was deleted" in italics
  }

  return (
    <MessageBubble
      content={message.content}
      mediaUrl={message.media_url}
      mediaType={message.media_type}
      isMine={isMine}
      isEdited={isEdited}
      senderName={message.profiles?.display_name}
      senderAvatar={message.profiles?.avatar_url}
      timestamp={message.created_at}
      readStatus={getReadStatus(message)}
      onLongPress={isMine ? () => showMessageActions(message, canEdit) : undefined}
    />
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom WebSocket for chat | Supabase Realtime postgres_changes | Supabase v2 matured | No custom infra needed |
| Per-message read tracking | last_read_message_id per user per group | Standard chat pattern | O(users*groups) rows vs O(users*messages) |
| Polling for typing | Supabase Realtime Presence | Built into supabase-js | Real-time with automatic cleanup |
| Separate share flows | Single SharePrompt enhanced with checkboxes | Phase 18 enhancement | Code reuse, consistent UX |

## Open Questions

1. **Supabase Realtime publication setup**
   - What we know: `postgres_changes` requires the table to be added to the `supabase_realtime` publication
   - What's unclear: Whether the project's Supabase instance has this publication configured, or if it needs a migration
   - Recommendation: Include `ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;` in the migration. This is idempotent and safe.

2. **Offline message queue**
   - What we know: The app has an offline-first pattern with sync queue for workouts
   - What's unclear: How important offline chat messaging is (chat is inherently online)
   - Recommendation: Keep it simple. Draft messages can persist in MMKV. Failed sends show a retry button. Do not build a full offline message queue -- chat requires connectivity.

3. **Push notification batching for chat**
   - What we know: Active chat can generate many rapid messages
   - What's unclear: Whether rapid-fire push notifications will overwhelm recipients
   - Recommendation: For v1, send push on every message (respecting mute). If needed later, add a debounce in the Edge Function (e.g., batch messages within 5 seconds). This is a future optimization.

4. **Chat media storage limits**
   - What we know: Set videos already use Supabase Storage
   - What's unclear: Storage cost implications of chat media
   - Recommendation: Set reasonable limits via `expo-image-picker` options (image quality 0.7, video max 30 seconds). Monitor storage usage. Consider a cleanup policy later.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29 + jest-expo 55 |
| Config file | jest.config.js (project root) |
| Quick run command | `npx jest --bail --testPathPattern=chat` |
| Full suite command | `npx jest --bail` |

### Phase Requirements -> Test Map

| Behavior | Test Type | Automated Command | File Exists? |
|----------|-----------|-------------------|-------------|
| canEditMessage (15-min window) | unit | `npx jest tests/chat/editWindow.test.ts -x` | No - Wave 0 |
| Message read status computation | unit | `npx jest tests/chat/readReceipts.test.ts -x` | No - Wave 0 |
| Share payload with content type selection | unit | `npx jest tests/chat/shareContentSelection.test.ts -x` | No - Wave 0 |
| Retroactive share payload construction | unit | `npx jest tests/chat/retroactiveShare.test.ts -x` | No - Wave 0 |
| Typing indicator debounce logic | unit | `npx jest tests/chat/typingDebounce.test.ts -x` | No - Wave 0 |
| Chat media upload path construction | unit | `npx jest tests/chat/chatMediaUpload.test.ts -x` | No - Wave 0 |

### Sampling Rate
- **Per task commit:** `npx jest --bail --testPathPattern=chat`
- **Per wave merge:** `npx jest --bail`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/chat/editWindow.test.ts` -- 15-minute edit window logic
- [ ] `tests/chat/readReceipts.test.ts` -- read status computation from last_read_message_id
- [ ] `tests/chat/shareContentSelection.test.ts` -- content type checkbox selection logic
- [ ] `tests/chat/retroactiveShare.test.ts` -- retroactive share payload with both dates
- [ ] `tests/chat/typingDebounce.test.ts` -- typing indicator debounce behavior

## Sources

### Primary (HIGH confidence)
- [Supabase Realtime Broadcast docs](https://supabase.com/docs/guides/realtime/broadcast) -- channel subscription, send, ack, self-send configuration
- [Supabase Realtime Presence docs](https://supabase.com/docs/guides/realtime/presence) -- track/untrack API, sync/join/leave events, custom keys
- [Supabase Realtime Concepts docs](https://supabase.com/docs/guides/realtime/concepts) -- public vs private channels, authorization
- Existing codebase: `supabase/functions/send-push/index.ts` -- push notification delivery pattern
- Existing codebase: `features/videos/utils/videoUploadQueue.ts` -- file upload to Supabase Storage pattern
- Existing codebase: `features/videos/types.ts` -- video type definitions
- Existing codebase: `lib/supabase/client.ts` -- Supabase client configuration
- Phase 17 RESEARCH.md -- group schema, RLS patterns, `is_group_member()` function, feed pagination

### Secondary (MEDIUM confidence)
- [Supabase Realtime authorization blog](https://supabase.com/blog/supabase-realtime-broadcast-and-presence-authorization) -- private channel authorization
- Chat read receipt patterns -- `last_read_message_id` approach is standard (WhatsApp, Signal use similar)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, all existing libraries
- Architecture: HIGH -- Supabase Realtime API verified from official docs, follows established project patterns
- Database schema: HIGH -- mirrors Phase 17 patterns, RLS uses existing `is_group_member()` function
- Pitfalls: HIGH -- based on Realtime docs and chat application best practices
- Chat media: MEDIUM -- reuses video upload pattern but chat-specific compression/limits are discretionary

**Research date:** 2026-03-12
**Valid until:** 2026-04-12 (stable -- Supabase Realtime API is mature)
