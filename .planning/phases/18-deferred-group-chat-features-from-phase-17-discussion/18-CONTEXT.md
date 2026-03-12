# Phase 18: Deferred Group Chat Features - Context

**Gathered:** 2026-03-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Add real-time group chat messaging to existing groups (from Phase 17), enhance the share flow with per-content-type selection, and enable retroactive sharing from workout history. Groups, friendships, feeds, and reactions already exist from Phase 17.

</domain>

<decisions>
## Implementation Decisions

### Messaging scope
- Full group chat: separate Chat tab alongside the existing Feed tab within each group screen
- Real-time delivery via Supabase Realtime subscriptions (messages appear instantly)
- Text, images, and videos supported in chat messages
- Push notifications for new chat messages, respects existing per-group mute toggle from Phase 17
- Muting a group silences both feed shares and chat notifications

### Content controls (enhanced share flow)
- Per-share content-type selection: when sharing after a workout, user picks which content types to include (workout summary, PRs, videos) via checkboxes
- Enhances Phase 17's share flow (not a separate feature) — adds content-type checkboxes alongside group selection
- Full workout summary only (no individual exercise selection)
- Individual PR selection: each PR from the session shown as a separate selectable checkbox
- Videos selectable individually per set

### Retroactive sharing
- Share button on workout detail screen in History tab
- Opens the same share flow (pick content types + target groups)
- No time limit — any past workout can be shared
- Both dates shown on feed card: share date for timeline ordering, "Workout from [original date]" label for context
- Re-sharing allowed: same workout can be shared to different groups or re-shared to the same group

### Message features
- Delivered + read receipts (checkmark for delivered, double-check/blue for read — WhatsApp-style)
- Typing indicators ("[Name] is typing..." via Supabase Realtime presence)
- Edit and delete own messages
- 15-minute edit window — after 15 minutes, message is locked (shows "edited" indicator when edited)
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

</decisions>

<specifics>
## Specific Ideas

- Chat tab and Feed tab within each group — like WhatsApp where group chat and shared media are separate views
- Share flow enhancement should feel seamless — checkboxes for content types appear naturally alongside group selection
- Retroactive sharing from history should use the exact same share flow as post-workout sharing for consistency
- Read receipts and typing indicators make it feel like a real messaging experience for the friend group

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `supabase/functions/send-push/index.ts`: Edge Function for push delivery — reusable for chat message notifications
- `notifications/utils/pushTokenRegistration.ts`: Push token registration already runs on every authenticated launch
- Supabase Realtime already used in `dashboard.tsx`, `useAuth.ts`, `useSyncQueue.ts` — pattern established for subscriptions
- Phase 17's share flow components: content picker and group selector to be enhanced with checkboxes
- Phase 17's group feed and card components: group screen infrastructure to add Chat tab to
- `videos/types.ts` and video upload pattern from Phase 14: reusable for chat media uploads
- `ProfilePhotoPicker` + avatar upload pattern: reusable for chat image sending

### Established Patterns
- Zustand + MMKV persist for all stores — new chat/message store follows same pattern
- Supabase RLS for per-user data isolation — new group-scoped message policies
- `as-any` pattern for Supabase `.from()` calls on tables not in generated types
- Edge Functions with Deno.serve + CORS headers
- Card-based UI patterns throughout the app
- Ionicons for all UI icons

### Integration Points
- Group screen from Phase 17: add Chat tab alongside Feed tab
- Share flow from Phase 17: enhance with content-type checkboxes
- History detail screen: add Share button
- Supabase Realtime: new channel subscriptions per group for chat
- Push notification Edge Function: extend for chat message notifications
- New Supabase tables: messages, message_read_receipts (or last_read tracking)

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 18-deferred-group-chat-features-from-phase-17-discussion*
*Context gathered: 2026-03-12*
