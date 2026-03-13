---
phase: 17-friend-workout-pr-and-set-video-sharing-creating-of-groups-to-share-with
plan: "03"
subsystem: social
tags: [social, groups, ui, hook, components, member-management, mute, leave-group]
dependency_graph:
  requires:
    - 17-01
    - 17-02
  provides:
    - app/(app)/social/create-group.tsx
    - app/(app)/social/group-detail.tsx
    - src/features/social/components/GroupCard.tsx
    - src/features/social/components/GroupMemberList.tsx
    - src/features/social/hooks/useGroups.ts
  affects:
    - app/(app)/(tabs)/social.tsx
    - src/stores/socialStore.ts
tech_stack:
  added: []
  patterns:
    - useGroups hook wrapping socialStore with mount-fetch (matching useFriendships pattern)
    - GroupCard with Ionicons people-outline icon (no emoji per CLAUDE.md)
    - Inline friend picker with checkbox selection in create-group
    - Inline add-member picker toggle in group-detail (no separate screen)
    - Profile batch fetch via supabase .in() for member display names/avatars
    - Confirmation Alert for leave/remove destructive actions
key_files:
  created:
    - src/features/social/hooks/useGroups.ts
    - src/features/social/components/GroupCard.tsx
    - src/features/social/components/GroupMemberList.tsx
    - app/(app)/social/create-group.tsx
    - app/(app)/social/group-detail.tsx
  modified:
    - app/(app)/(tabs)/social.tsx
    - src/stores/socialStore.ts
decisions:
  - "fetchGroupMembers added to socialStore as missing critical functionality (Rule 2) — needed for group-detail member display"
  - "Inline add-member picker in group-detail (toggle show/hide) avoids a separate screen, consistent with plan's inline friend list spec"
  - "Member profiles fetched via batch supabase .in() query on mount, same pattern as friend-requests.tsx sender profile lookup"
  - "GroupCard shows member count from groupMembers store state; count is 0 until fetchGroupMembers is called on detail navigation"
metrics:
  duration: 4min
  completed_date: "2026-03-13"
  tasks_completed: 2
  files_created: 5
  files_modified: 2
---

# Phase 17 Plan 03: Group System - Create, Manage Members, Mute, Leave Summary

Group creation screen with friend picker and checkbox selection, group detail with full member management (add/remove for creator, mute toggle and leave for all members) — wired into the Social tab's groups section with real data from useGroups hook.

## What Was Built

### Task 1: useGroups hook + GroupCard component + groups section on Social tab

**`src/features/social/hooks/useGroups.ts`:**
- Thin wrapper around `useSocialStore` group-related state and actions
- Calls `fetchGroups()` on mount via `useEffect`
- Returns: `groups`, `loading`, `getMembersForGroup()`, `isGroupMuted()`, `fetchGroupMembers`, `createGroup`, `leaveGroup`, `addMember`, `removeMember`, `toggleMute`

**`src/features/social/components/GroupCard.tsx`:**
- Shows group name, member count (`N members`), muted indicator (`notifications-off-outline` Ionicons when muted)
- Icon wrapper with `people-outline` icon in accent circle
- Tappable — navigates to `/(app)/social/group-detail` with `groupId` param
- Dark theme card: `surface` bg, `surfaceElevated` border, `borderRadius: 12`

**`app/(app)/(tabs)/social.tsx` (updated):**
- Replaced groups placeholder with real data from `useGroups`
- Groups section header with count badge + `add-circle-outline` Create Group button
- Nested FlatList (scrollEnabled=false) of GroupCards inside parent FlatList ListFooterComponent
- Empty state: "No groups yet. Create one to start sharing."
- Create Group button navigates to `/(app)/social/create-group`

### Task 2: Create group screen + group detail with member management

**`app/(app)/social/create-group.tsx`:**
- TextInput for group name with 50-char limit + character counter
- FlatList of friends from `friendshipStore` with checkbox rows
- Selected friends highlighted with accent border + `checkmark` Ionicons in filled checkbox
- "Create" button in header-right; disabled when name is empty/invalid
- Calls `createGroup(name, selectedFriendIds)` then navigates back on success
- Loading indicator during creation; Alert for validation failures

**`src/features/social/components/GroupMemberList.tsx`:**
- Renders member rows: avatar (Image or initials fallback), `display_name`, `@handle`
- Current user labeled "(You)" inline in member name
- Creator sees `close-circle-outline` remove button on non-self members (with confirmation Alert)
- "Add Member" row at bottom for creators (navigates via `onAddMemberPress` callback)

**`app/(app)/social/group-detail.tsx`:**
- Receives `groupId` via route params (`useLocalSearchParams`)
- Header title set to `group.name` via `Stack.Screen` options
- Fetches group members on mount via `fetchGroupMembers`; fetches member profiles via batch Supabase query
- `GroupMemberList` with creator/non-creator mode
- Inline add-member picker (toggles show/hide) with filtered friends list (only non-members shown)
- Mute toggle button (`notifications-outline` / `notifications-off-outline`) with `toggleMuteGroup`
- Leave Group button (`exit-outline` icon, error color) with confirmation Alert, calls `leaveGroup` then `router.back()`
- Group Feed placeholder section: "Group sharing coming soon." (wired in Plan 04)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical Functionality] Added fetchGroupMembers to socialStore**
- **Found during:** Task 2 (group-detail screen implementation)
- **Issue:** `socialStore` had `groupMembers: Record<string, GroupMember[]>` state but no `fetchGroupMembers` action. Without it, group-detail could not populate member data on navigation — the cached state would be empty until an add/remove triggered the side-effect refresh inside `addMemberToGroup`.
- **Fix:** Added `fetchGroupMembers(groupId)` action to both `SocialActions` interface and store implementation. Called on mount in `group-detail.tsx` and after mute toggle.
- **Files modified:** `src/stores/socialStore.ts`, `src/features/social/hooks/useGroups.ts`
- **Commit:** 5d3d14f

## Test Results

- Social utility tests: 44/44 passed
- Full suite: 416/419 passed (3 pre-existing failures: sync-queue.test.ts `insert` vs `upsert` and csvExport.test.ts — unrelated to this plan)

## Self-Check: PASSED

All 5 created files and 2 modified files found on disk. Both task commits (28ad64a, 5d3d14f) present in git log.
