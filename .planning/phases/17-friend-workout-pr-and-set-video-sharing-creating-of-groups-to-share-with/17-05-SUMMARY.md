---
phase: 17-friend-workout-pr-and-set-video-sharing-creating-of-groups-to-share-with
plan: 05
subsystem: ui
tags: [social, share, push-notifications, zustand, react-native]

requires:
  - phase: 17-01
    provides: sharePayload utils (buildWorkoutPayload, buildPRPayload, buildVideoPayload) and socialStore with shareToGroups action
  - phase: 17-03
    provides: groups schema, socialStore groups state, group membership

provides:
  - useShareFlow hook — content selection, group targeting, share dispatch with notifications
  - notifyGroupOnShare utility — push notification dispatch via send-push Edge Function
  - SharePrompt component — collapsible card on workout summary for post-workout sharing
  - SharePrompt integrated into workout summary screen between WeightTargetPrompt and Done button

affects:
  - group-feed (shared items posted here appear in group feeds built in plan 04)

tech-stack:
  added: []
  patterns:
    - "fire-and-forget notification pattern: void async call to notifyGroupOnShare so notification failure never blocks share flow"
    - "useMemo for prExercises in summary.tsx so computed value is shared between PR display and SharePrompt"
    - "content key scheme: 'workout', 'pr-{index}', 'video-{index}' for Set-based multi-select"

key-files:
  created:
    - src/features/social/hooks/useShareFlow.ts
    - src/features/social/utils/notifyGroup.ts
    - src/features/social/components/SharePrompt.tsx
  modified:
    - app/(app)/workout/summary.tsx

key-decisions:
  - "useShareFlow derives content at hook instantiation via useMemo keyed on session.id to avoid re-computation"
  - "notifyGroupOnShare fetches non-muted members directly from Supabase (not from store cache) for accuracy"
  - "SharePrompt starts collapsed to reduce visual noise; expands on tap to reveal full pickers"
  - "prExercises computation extracted from inline IIFE into useMemo in summary.tsx for clean prop passing"
  - "Notification content type uses most-specific selected type (video > pr > workout) for descriptive push title"

requirements-completed: [SOCL-09, SOCL-11]

duration: 5min
completed: 2026-03-13
---

# Phase 17 Plan 05: Share Flow and Push Notifications Summary

**Post-workout share flow with collapsible SharePrompt card, content/group multi-select, and fire-and-forget push notifications to non-muted group members via send-push Edge Function**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-13T19:30:00Z
- **Completed:** 2026-03-13T19:35:25Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Created `useShareFlow` hook that derives workout summary, PR, and video content from a session — never including body metrics (SOCL-14)
- Created `notifyGroupOnShare` utility that fetches non-muted members and invokes the send-push Edge Function
- Created `SharePrompt` collapsible card component with content checkboxes, group chips, and share button
- Integrated SharePrompt into workout summary screen using extracted useMemo for prExercises

## Task Commits

1. **Task 1: Share flow hook + notification utility** - `743c42e` (feat)
2. **Task 2: SharePrompt component + integrate into workout summary** - `0a627f8` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/features/social/hooks/useShareFlow.ts` - Hook managing content/group selection, payload building, shareToGroups dispatch, and notification fire-and-forget
- `src/features/social/utils/notifyGroup.ts` - Fetches non-muted members, invokes send-push Edge Function with group_share type
- `src/features/social/components/SharePrompt.tsx` - Collapsible share card for workout summary with checkbox content selection and horizontal group chip picker
- `app/(app)/workout/summary.tsx` - Added useMemo for prExercises, imported SharePrompt, rendered between WeightTargetPrompt and Done button

## Decisions Made

- SharePrompt starts collapsed (shows "Share with your groups" tap affordance) to minimize visual noise on summary screen — most users may not share every workout
- `notifyGroupOnShare` fetches live from Supabase rather than using cached `groupMembers` store to get accurate mute status at time of share
- Content type key scheme (`workout`, `pr-0`, `video-0`) avoids conflicts since each type has a stable prefix
- `prExercises` extracted to `useMemo` so it can be passed to both the PR display section and `SharePrompt` without duplicating computation

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

Pre-existing test failures in `tests/settings/csvExport.test.ts` (2 tests checking old "Hips" column vs current "Biceps/Quad" schema) and `tests/workout/sync-queue.test.ts` (1 test checking "insert" vs "upsert" operation) were present before this plan and are out of scope.

## User Setup Required

None - no external service configuration required beyond the send-push Edge Function already deployed in Phase 16.

## Next Phase Readiness

- Share flow is complete: users can share workout summaries, PRs, and set videos to groups from the post-workout summary screen
- Shared items appear in group feeds (built in Plan 04)
- Push notifications dispatched to non-muted group members via existing send-push infrastructure

---
*Phase: 17-friend-workout-pr-and-set-video-sharing-creating-of-groups-to-share-with*
*Completed: 2026-03-13*
