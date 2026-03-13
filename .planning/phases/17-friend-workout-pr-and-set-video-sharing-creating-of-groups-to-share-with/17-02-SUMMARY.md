---
phase: 17-friend-workout-pr-and-set-video-sharing-creating-of-groups-to-share-with
plan: "02"
subsystem: social
tags: [social, friends, ui, tab, hook, components, invite-code, handle-search, friend-requests]
dependency_graph:
  requires:
    - 17-01
  provides:
    - app/(app)/(tabs)/social.tsx
    - app/(app)/social/_layout.tsx
    - app/(app)/social/add-friend.tsx
    - app/(app)/social/friend-requests.tsx
    - src/features/social/hooks/useFriendships.ts
    - src/features/social/components/FriendListItem.tsx
    - src/features/social/components/FriendRequestCard.tsx
  affects:
    - app/(app)/(tabs)/_layout.tsx
    - app/(app)/_layout.tsx
tech_stack:
  added: []
  patterns:
    - useFriendships hook wrapping Zustand store with mount-fetch + pendingCount
    - FlatList with RefreshControl and ListHeader/Footer for section layout
    - SafeAreaView with edges=['top'] for tab screens
    - LayoutAnimation.Presets.easeInEaseOut on FriendRequestCard accept/reject
    - Debounced handle search (300ms useEffect with ref cleanup)
    - Inline feedback text (not Alert) for redeem code success/error
    - Stack.Screen options header title via JSX in stack route files
key_files:
  created:
    - app/(app)/(tabs)/social.tsx
    - app/(app)/social/_layout.tsx
    - app/(app)/social/add-friend.tsx
    - app/(app)/social/friend-requests.tsx
    - src/features/social/hooks/useFriendships.ts
    - src/features/social/components/FriendListItem.tsx
    - src/features/social/components/FriendRequestCard.tsx
  modified:
    - app/(app)/(tabs)/_layout.tsx
    - app/(app)/_layout.tsx
decisions:
  - "Social tab is 5th position (Home, Plans, Calc, Social, Settings) since Calculator tab was added after original plan was written"
  - "FriendRequestCard fetches sender profiles in friend-requests.tsx using local Supabase query (pendingRequests only has IDs)"
  - "add-friend.tsx uses inline feedback text (not Alert) for redeem success/error per plan spec"
  - "app/(app)/social/_layout.tsx stack navigator needed for sub-routes (matching plans/_layout.tsx pattern)"
metrics:
  duration: 2min
  completed_date: "2026-03-13"
  tasks_completed: 2
  files_created: 7
  files_modified: 2
---

# Phase 17 Plan 02: Social Tab + Friendship UI Summary

Social tab with friends list, add-friend screen (invite code + handle search), and friend requests screen — delivering the complete friendship connection layer for the app.

## What Was Built

### Task 1: Social tab route + tab bar update + friends list screen

**`src/features/social/hooks/useFriendships.ts`:**
- Thin wrapper around `friendshipStore` with `useEffect` on mount that calls `fetchFriends`, `fetchPendingRequests`, `fetchSentRequests`
- Returns: `friends`, `pendingRequests`, `sentRequests`, `loading`, `pendingCount` (derived), and `actions` object

**`src/features/social/components/FriendListItem.tsx`:**
- Renders avatar (Image if URL present, else initials fallback) + `display_name` + `@handle`
- Long-press triggers `Alert.alert` confirmation before calling `onUnfriend(friend.id)`
- Dark theme matching `TraineeCard` pattern from coaching feature

**`app/(app)/(tabs)/social.tsx`:**
- Header with "Social" title and `person-add-outline` icon button linking to add-friend screen
- FlatList with `ListHeaderComponent` showing Friends section title + pending count badge that links to friend-requests
- Empty state: "No friends yet. Tap + to add friends."
- `ListFooterComponent` with Groups placeholder ("No groups yet.")
- Pull-to-refresh via `RefreshControl`

**`app/(app)/(tabs)/_layout.tsx`:** Added Social tab with `people-outline` icon (4th tab, between Calc and Settings)

**`app/(app)/_layout.tsx`:** Registered `social` route group with `headerShown: false`

**`app/(app)/social/_layout.tsx`:** Stack navigator for social sub-routes matching `plans/_layout.tsx` pattern

### Task 2: Add friend screen + FriendRequestCard + friend requests screen

**`src/features/social/components/FriendRequestCard.tsx`:**
- Sender avatar/initials, display_name, @handle
- Accept (checkmark-outline, success color) and Reject (close-outline, muted) action buttons
- `LayoutAnimation.Presets.easeInEaseOut` on both actions for animated removal

**`app/(app)/social/add-friend.tsx`:**
- Section A (Invite Code):
  - Generate Code button: calls `generateFriendInviteCode()`, shows code in large accent text with Copy button (expo-clipboard)
  - Enter Code: TextInput auto-uppercase, inline success/error feedback text, "Connect" button calling `redeemFriendInviteCode()`
- Section B (Handle Search):
  - TextInput with `@` prefix visual, 300ms debounced search via `searchByHandle()`
  - Results list with "Add Friend" / "Sent" (disabled) buttons; strips `@` prefix, lowercases input

**`app/(app)/social/friend-requests.tsx`:**
- Fetches sender profiles via Supabase on mount (pending request rows only have `sender_id`)
- FlatList of pending requests using `FriendRequestCard`
- `ListFooterComponent` renders sent requests with "Pending" badge
- Pull-to-refresh

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added social/_layout.tsx stack navigator**
- **Found during:** Task 2 (creating sub-routes)
- **Issue:** Expo Router sub-routes under `app/(app)/social/` require a `_layout.tsx` stack navigator to function as a route group
- **Fix:** Created `app/(app)/social/_layout.tsx` following `plans/_layout.tsx` pattern
- **Files modified:** `app/(app)/social/_layout.tsx`
- **Commit:** ac42482

**2. [Rule 2 - Missing functionality] Sender profile lookup in friend-requests screen**
- **Found during:** Task 2
- **Issue:** `pendingRequests` from store only contains `sender_id` (UUID), not profile data. `FriendRequestCard` needs display_name, handle, avatar_url
- **Fix:** Added local Supabase profile fetch in `friend-requests.tsx` on mount and when requests change
- **Files modified:** `app/(app)/social/friend-requests.tsx`
- **Commit:** 1b20eaf

## Test Results

- Social utility tests: 44/44 passed
- Full suite: 104/105 passed (1 pre-existing failure in `sync-queue.test.ts` - `insert` vs `upsert` mismatch, unrelated to this plan)

## Self-Check: PASSED

All 7 created files and 2 modified files found on disk. Both task commits (ac42482, 1b20eaf) present in git log.
