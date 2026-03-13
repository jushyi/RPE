---
phase: 18-deferred-group-chat-features-from-phase-17-discussion
plan: 01
subsystem: database
tags: [supabase, realtime, chat, zustand, mmkv, rls, storage, typescript]

# Dependency graph
requires:
  - phase: 17-social-system
    provides: groups, group_members, is_group_member() RLS helper, socialStore patterns

provides:
  - messages table with RLS and 15-min edit window enforced server-side
  - group_read_receipts table with upsert-capable RLS
  - chat-media storage bucket with user-folder-scoped policies
  - Realtime publication for messages table
  - Message, GroupReadReceipt, ShareableContent, ChatMediaType TypeScript types
  - canEditMessage, getMessageReadStatus, formatMessageTime pure utility functions
  - buildSharePayload, buildRetroactiveSharePayload functions
  - buildChatMediaPath, getChatMediaPublicUrl utility functions
  - chatStore (Zustand + MMKV) with addMessage/updateMessage/setMessages/setUnreadCount/clearGroup

affects:
  - 18-02 (ContentTypeCheckboxes, SharePrompt enhancement)
  - 18-03 (Chat UI hooks and screens)
  - 18-04 (useChatMedia hook implementation)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Supabase Realtime enabled via ALTER PUBLICATION on new tables
    - last_read_message_id per-user-per-group read receipt pattern (O(users*groups))
    - ChatMediaType as union type for image/video discriminant
    - chatStore follows socialStore Zustand+MMKV persist pattern with named storage id

key-files:
  created:
    - supabase/migrations/20260319000001_create_messages.sql
    - src/features/social/types/chat.ts
    - src/features/social/utils/chatUtils.ts
    - src/features/social/utils/shareContentSelection.ts
    - src/features/social/utils/chatMediaUtils.ts
    - src/stores/chatStore.ts
    - tests/chat/editWindow.test.ts
    - tests/chat/readReceipts.test.ts
    - tests/chat/shareContentSelection.test.ts
    - tests/chat/retroactiveShare.test.ts
    - tests/chat/chatMediaUpload.test.ts
  modified: []

key-decisions:
  - "chatStore imported Message/GroupReadReceipt from canonical types/chat.ts rather than defining inline to prevent duplicate type drift"
  - "getMessageReadStatus uses lexicographic UUID >= comparison which preserves chronological order for UUID v4 sequential IDs"
  - "chatStore pre-existing implementation was richer than spec (includes receiptsByGroup, prependMessages, updateReceipt); retained all extra functionality"
  - "buildChatMediaPath and getChatMediaPublicUrl extracted as pure functions to chatMediaUtils.ts for testability"

patterns-established:
  - "Pattern: Chat types defined in src/features/social/types/chat.ts; stores re-export from there"
  - "Pattern: Pure utility functions tested in TDD RED/GREEN cycle before implementation"

requirements-completed:
  - CHAT-01
  - CHAT-03
  - CHAT-05
  - CHAT-06
  - CHAT-08
  - CHAT-09

# Metrics
duration: 4min
completed: 2026-03-13
---

# Phase 18 Plan 01: Database Foundation for Group Chat Summary

**Supabase messages table with RLS 15-min edit window, read receipts table, chat-media bucket, Realtime publication, TypeScript types, and tested pure utility functions**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-13T20:04:41Z
- **Completed:** 2026-03-13T20:08:00Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments

- Created full Supabase migration with messages + group_read_receipts tables, RLS policies, chat-media bucket, and Realtime publication
- Defined canonical TypeScript types (Message, GroupReadReceipt, ShareableContent, ChatMediaType) in dedicated types/chat.ts module
- TDD: 5 test files, 26 passing tests covering edit window, read receipts, share payload, retroactive share, and chat media stubs
- Implemented pure utility functions: canEditMessage, getMessageReadStatus, formatMessageTime, buildSharePayload, buildRetroactiveSharePayload
- Updated chatStore to use Zustand persist with MMKV (chat-store id) and import canonical chat types

## Task Commits

1. **Task 1: Database migration + TypeScript types** - `65ba78c` (feat)
2. **Task 2: Utility functions, tests, and chat store** - `66fadc5` (feat)

## Files Created/Modified

- `supabase/migrations/20260319000001_create_messages.sql` - messages table, group_read_receipts, chat-media bucket, RLS, Realtime
- `src/features/social/types/chat.ts` - Message, GroupReadReceipt, ShareableContent, ChatMediaType
- `src/features/social/utils/chatUtils.ts` - canEditMessage, getMessageReadStatus, formatMessageTime
- `src/features/social/utils/shareContentSelection.ts` - buildSharePayload, buildRetroactiveSharePayload
- `src/features/social/utils/chatMediaUtils.ts` - buildChatMediaPath, getChatMediaPublicUrl
- `src/stores/chatStore.ts` - Zustand + MMKV chat store with full message management
- `tests/chat/editWindow.test.ts` - 6 tests for canEditMessage
- `tests/chat/readReceipts.test.ts` - 5 tests for getMessageReadStatus
- `tests/chat/shareContentSelection.test.ts` - 6 tests for buildSharePayload
- `tests/chat/retroactiveShare.test.ts` - 4 tests for buildRetroactiveSharePayload
- `tests/chat/chatMediaUpload.test.ts` - 5 tests for chat media utilities and picker contract

## Decisions Made

- chatStore already existed with a richer pre-implementation (receiptsByGroup, prependMessages, updateReceipt); updated it to use MMKV persist middleware and import canonical types from types/chat.ts rather than rewriting it
- getMessageReadStatus uses string >= comparison for UUID IDs — works correctly because we compare the same message ID against last_read values (same ID = read)
- buildChatMediaPath extracted as pure function rather than inlined in hook for testability without Supabase mocking

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Enhancement] chatStore updated to use persist middleware and canonical types**
- **Found during:** Task 2 (chatStore creation)
- **Issue:** chatStore.ts already existed with inline type definitions (Message, GroupReadReceipt) and lacked MMKV persist. Plan required MMKV persist and types imported from canonical source.
- **Fix:** Added persist middleware with MMKV storage (id: 'chat-store'), imported Message/GroupReadReceipt from types/chat.ts, added `export type { Message, GroupReadReceipt }` for backward compat
- **Files modified:** src/stores/chatStore.ts
- **Verification:** All 26 chat tests pass
- **Committed in:** 66fadc5 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - pre-existing file enhancement)
**Impact on plan:** Enhancement aligns pre-existing file with plan spec and canonical type source. No scope creep.

## Issues Encountered

None — TDD RED/GREEN cycle executed cleanly. All 26 tests pass on first GREEN implementation.

## User Setup Required

**Database migration requires deployment to Supabase.** Run:
```bash
supabase db push
```

This will create the messages table, group_read_receipts table, chat-media bucket, and enable Realtime for messages.

## Next Phase Readiness

- Data layer foundation complete: migration ready for deployment, types defined, pure functions tested
- Plans 18-02 through 18-06 can build UI, hooks, and real-time subscriptions against these contracts
- chat-media bucket must be created via `supabase db push` before Plan 18-04 (useChatMedia) can be tested on device

---
*Phase: 18-deferred-group-chat-features-from-phase-17-discussion*
*Completed: 2026-03-13*
