---
phase: 17-friend-workout-pr-and-set-video-sharing-creating-of-groups-to-share-with
plan: "01"
subsystem: social
tags: [social, database, migration, zustand, store, types, utils, rls, tdd]
dependency_graph:
  requires: []
  provides:
    - supabase/migrations/20260318000001_create_social.sql
    - src/features/social/types.ts
    - src/features/social/utils/handleValidation.ts
    - src/features/social/utils/friendInviteCode.ts
    - src/features/social/utils/sharePayload.ts
    - src/features/social/utils/reactionIcons.ts
    - src/stores/friendshipStore.ts
    - src/stores/socialStore.ts
  affects: []
tech_stack:
  added: []
  patterns:
    - Zustand + MMKV persist (matching coachingStore/notificationStore)
    - as-any pattern for Supabase tables not in generated types
    - SECURITY DEFINER helper functions for group-scoped RLS
    - Cursor-based feed pagination using created_at
    - DB trigger for auto-friendship on request acceptance
    - TDD (RED/GREEN) for all pure utility functions
key_files:
  created:
    - supabase/migrations/20260318000001_create_social.sql
    - src/features/social/types.ts
    - src/features/social/utils/handleValidation.ts
    - src/features/social/utils/friendInviteCode.ts
    - src/features/social/utils/sharePayload.ts
    - src/features/social/utils/reactionIcons.ts
    - src/stores/friendshipStore.ts
    - src/stores/socialStore.ts
    - tests/social/handleValidation.test.ts
    - tests/social/friendInviteCode.test.ts
    - tests/social/sharePayload.test.ts
    - tests/social/reactionIcons.test.ts
  modified: []
decisions:
  - "Reaction icons use Ionicons key strings (e.g., 'fire' -> 'flame-outline'), NOT emoji characters per CLAUDE.md"
  - "Friendships use canonical ordering user_a < user_b with DB trigger for auto-creation on request accept"
  - "feed pagination uses cursor-based created_at approach with 20 items per page"
  - "createGroup always inserts creator as group_member in same call to avoid Pitfall 3"
  - "search_profiles_by_handle RPC uses SECURITY DEFINER to bypass restrictive profile RLS safely"
  - "socialStore uses Record<string, ...> instead of Map for MMKV JSON serialization compatibility"
metrics:
  duration: 6min
  completed_date: "2026-03-13"
  tasks_completed: 2
  files_created: 12
---

# Phase 17 Plan 01: Social Foundation - Database, Types, Utils, and Stores Summary

Social database schema, TypeScript types, tested pure utility functions, and two Zustand stores providing the complete data layer foundation for friend connections, groups, and content sharing.

## What Was Built

### Task 1: Database Migration + Types + Utility Functions (TDD)

**Migration (`20260318000001_create_social.sql`):**
- Added `handle TEXT UNIQUE` column to `profiles` with index
- `search_profiles_by_handle(query TEXT)` RPC with SECURITY DEFINER (bypasses restrictive profile RLS, returns only safe fields)
- 7 new tables: `friend_requests`, `friendships`, `friend_invite_codes`, `groups`, `group_members`, `shared_items`, `reactions`
- RLS enabled on all tables with per-table policies
- Helper functions: `is_group_member(UUID)` and `is_friend_with(UUID)` both SECURITY DEFINER STABLE
- DB trigger: auto-inserts into `friendships` with canonical ordering when `friend_requests.status` changes to `accepted`
- Composite index on `shared_items (group_id, created_at DESC)` for efficient feed queries

**Types (`src/features/social/types.ts`):**
- Exports: `FriendProfile`, `FriendRequest`, `Friendship`, `FriendInviteCode`, `Group`, `GroupMember`, `SharedItem` (discriminated union), `Reaction`, `WorkoutSharePayload`, `PRSharePayload`, `VideoSharePayload`

**Utility Functions (all TDD, 44 tests pass):**
- `handleValidation.ts`: `validateHandle()` + `HANDLE_REGEX` - validates 3-20 chars, lowercase alphanumeric + underscores, must start with letter
- `friendInviteCode.ts`: `generateFriendInviteCode()` + `FRIEND_INVITE_CODE_EXPIRY_HOURS` - reuses coaching INVITE_CHARS pattern
- `sharePayload.ts`: `buildWorkoutPayload()`, `buildPRPayload()`, `buildVideoPayload()` - typed payload builders
- `reactionIcons.ts`: `REACTION_ICONS` array (5 Ionicons entries, no emoji chars) + `getReactionIcon(key)`

### Task 2: Zustand Stores

**`friendshipStore.ts` (MMKV key: 'friendship-store'):**
- State: `friends`, `pendingRequests`, `sentRequests`, `myHandle`, `loading`
- Actions: complete friend lifecycle (fetch, send, accept, reject, unfriend, invite code generate/redeem, handle search/set)
- `searchByHandle` calls `search_profiles_by_handle` RPC

**`socialStore.ts` (MMKV key: 'social-store'):**
- State: `groups`, `groupMembers`, `feedItems`, `feedCursors`, `reactions`, `loading`
- Note: Uses `Record<string, T>` instead of `Map<string, T>` for MMKV JSON serialization compatibility
- Actions: full group lifecycle + cursor-based feed pagination + share to multiple groups + reactions
- `createGroup` always inserts creator as group_member in same call (addresses RESEARCH.md Pitfall 3)
- Feed pagination: 20 items per page, cursor = `created_at` of last item

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Type Consideration] Used Record instead of Map in socialStore**
- **Found during:** Task 2
- **Issue:** Plan specified `Map<string, GroupMember[]>` etc. but MMKV persist uses JSON serialization which cannot serialize Map objects
- **Fix:** Used `Record<string, GroupMember[]>` etc. which serializes correctly to JSON
- **Files modified:** `src/stores/socialStore.ts`
- **Commit:** 011832a

## Test Results

- Social utility tests: 44/44 passed
- Full suite: 91/92 passed (1 pre-existing failure in `sync-queue.test.ts` - `insert` vs `upsert` mismatch, unrelated to this plan)

## Self-Check: PASSED

All 12 created files found on disk. Both task commits (8e52bd0, 011832a) present in git log.
