---
phase: 17-friend-workout-pr-and-set-video-sharing-creating-of-groups-to-share-with
plan: "04"
subsystem: social
tags: [feed, reactions, cards, social, ui]
dependency_graph:
  requires: ["17-01", "17-02", "17-03"]
  provides: ["group-feed-screen", "shared-item-cards", "reaction-system"]
  affects: ["app/(app)/social/group-detail.tsx"]
tech_stack:
  added: []
  patterns:
    - "cursor-based feed pagination via useFeed hook"
    - "optimistic reaction toggle with icon-key system"
    - "Ionicons-only reaction UI (no emoji characters)"
    - "relative timestamp utility (getTimeLabel)"
key_files:
  created:
    - src/features/social/hooks/useFeed.ts
    - src/features/social/hooks/useReactions.ts
    - src/features/social/components/SharedWorkoutCard.tsx
    - src/features/social/components/SharedPRCard.tsx
    - src/features/social/components/SharedVideoCard.tsx
    - src/features/social/components/ReactionBar.tsx
    - src/features/social/utils/timeLabel.ts
    - app/(app)/social/group-feed.tsx
    - app/(app)/social/shared-item-detail.tsx
  modified:
    - app/(app)/social/group-detail.tsx
decisions:
  - "ReactionBar picker uses Ionicons plus/close toggle (no emoji characters per CLAUDE.md)"
  - "SharedVideoCard uses expo-video player inside Modal with pageSheet presentation (consistent with Phase 14)"
  - "group-detail feed placeholder replaced with View Feed navigation button to group-feed screen"
  - "useFeed fetches reactions for visible items on items.length change (batched per page)"
  - "useReactions uses dynamic import for supabase client to avoid circular dependency at module level"
  - "timeLabel.ts extracted as standalone utility for reuse across all card types"
metrics:
  duration: "4 min"
  completed_date: "2026-03-13"
  tasks_completed: 2
  files_changed: 10
---

# Phase 17 Plan 04: Group Feed, Card Types, and Reaction System Summary

Group feed screen with cursor-based pagination, three share card types (workout summary, PR achievement, video player), and icon-based reaction system using Ionicons throughout.

## What Was Built

**Task 1: Feed hook and three card types**

- `useFeed(groupId)`: wraps `socialStore.fetchFeed` with cursor-based pagination. Returns `items`, `loading`, `hasMore`, `loadMore`, `refresh`. Fetches reactions for visible items after each page loads.
- `SharedWorkoutCard`: author avatar + name + timestamp header, "Completed a workout" label, exercise names truncated to 3 + "and N more", sets/volume/duration stats row with Ionicons. Tappable with `onPress` prop.
- `SharedPRCard`: warning-accented card with `trophy-outline` icon badge, bold exercise name, weight/reps display. Not tappable (self-contained).
- `SharedVideoCard`: black thumbnail placeholder with `play-circle-outline` overlay, tapping opens fullscreen `pageSheet` Modal with `expo-video VideoView`. Exercise name + weight/reps/set label below thumbnail.

**Task 2: ReactionBar, group feed screen, shared item detail, group-detail update**

- `useReactions(sharedItemId)`: derives `reactionCounts` (Map) and `myReactions` (Set) from store reactions. `toggle(emoji)` removes if already reacted, adds if not. Uses dynamic import of supabase client.
- `ReactionBar`: horizontal row of active reaction pills (icon + count), highlighted when user has reacted. Plus/close toggle reveals 5-icon picker row from `REACTION_ICONS`. All icons are Ionicons — no emoji characters.
- `group-feed.tsx`: `FlatList` with `RefreshControl` (pull-to-refresh), `onEndReached` infinite scroll, per-item author profile lookup via Supabase `profiles` table, renders correct card type by `content_type`, `ReactionBar` below each card.
- `shared-item-detail.tsx`: workout type shows full breakdown (stats grid + exercise list); PR and video types render their expanded card. `ReactionBar` pinned at bottom via `SafeAreaView`.
- `group-detail.tsx`: replaced "Group sharing coming soon" placeholder with "View Feed" button navigating to `group-feed` screen with `groupId` and `groupName` params.
- `timeLabel.ts`: utility returning "just now", "5m ago", "2h ago", "3d ago" relative strings.

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

All files listed below were verified to exist after writing:
- app/(app)/social/group-feed.tsx
- app/(app)/social/shared-item-detail.tsx
- src/features/social/components/ReactionBar.tsx
- src/features/social/components/SharedWorkoutCard.tsx
- src/features/social/components/SharedPRCard.tsx
- src/features/social/components/SharedVideoCard.tsx
- src/features/social/hooks/useFeed.ts
- src/features/social/hooks/useReactions.ts
- src/features/social/utils/timeLabel.ts

Pre-existing test failure in `tests/settings/csvExport.test.ts` (Hips vs Biceps/Quad column mismatch from Phase 07 scope) was confirmed as pre-existing before this plan's changes and logged to deferred items.

## Self-Check: PASSED
