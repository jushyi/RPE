---
phase: 18-deferred-group-chat-features-from-phase-17-discussion
plan: "02"
subsystem: social/sharing
tags: [share-flow, retroactive-sharing, content-selection, history]
dependency_graph:
  requires: [18-01]
  provides: [ContentTypeCheckboxes, RetroShareButton, useRetroactiveShare]
  affects: [SharePrompt, useShareFlow, history/sessionId]
tech_stack:
  added: []
  patterns: [ShareableContent-type-driven-checkboxes, workout_date-payload-convention, retroactive-fetch-from-supabase]
key_files:
  created:
    - src/features/social/components/ContentTypeCheckboxes.tsx
    - src/features/social/components/RetroShareButton.tsx
    - src/features/social/hooks/useRetroactiveShare.ts
  modified:
    - src/features/social/components/SharePrompt.tsx
    - src/features/social/hooks/useShareFlow.ts
    - app/(app)/history/[sessionId].tsx
decisions:
  - "ContentTypeCheckboxes uses Ionicons checkmark-circle/ellipse-outline (not checkbox/square-outline) per plan spec"
  - "useShareFlow migrated from Set<string> selectedContent to ShareableContent type from chat.ts"
  - "RetroShareButton embeds RetroShareModal inline (not a separate file) for cohesion"
  - "Retroactive share payloads extend standard payloads with workout_date field (no schema change — JSONB is flexible)"
  - "RetroShareModal resets selection state on modal open using session.id as dependency key"
metrics:
  duration: 5min
  completed: "2026-03-13"
  tasks_completed: 2
  files_modified: 6
---

# Phase 18 Plan 02: ContentTypeCheckboxes + Retroactive Sharing Summary

Enhanced share flow with per-content-type checkboxes and retroactive sharing from workout history with workout_date payload field.

## What Was Built

### Task 1: ContentTypeCheckboxes + Enhanced SharePrompt

**ContentTypeCheckboxes** (`src/features/social/components/ContentTypeCheckboxes.tsx`):
- Renders a workout summary toggle (always on), individual PR checkboxes, and individual video checkboxes
- PRs section hidden when no PRs; videos section hidden when no videos
- Uses Ionicons `checkmark-circle` / `ellipse-outline` for checked/unchecked states
- Magenta accent color for selected items
- Props: `prs`, `videos`, `value: ShareableContent`, `onChange`, `disabled`

**SharePrompt updated** (`src/features/social/components/SharePrompt.tsx`):
- Replaced inline checkbox rendering with `ContentTypeCheckboxes`
- Added optional `onShare?: (content: ShareableContent, groupIds: string[]) => void` callback
- Content selection now uses `ShareableContent` type from `chat.ts`

**useShareFlow updated** (`src/features/social/hooks/useShareFlow.ts`):
- Replaced `Set<string> selectedContent` with `ShareableContent` state + `setShareableContent` setter
- All items selected by default (workoutSummary=true, all PR and video indices in selectedPRs/selectedVideos)
- Exports `shareableContent` and `setShareableContent` for SharePrompt to consume

### Task 2: Retroactive Sharing from History Detail

**useRetroactiveShare** (`src/features/social/hooks/useRetroactiveShare.ts`):
- Takes `sessionId: string | null`; fetches only when non-null
- Queries `workout_sessions + session_exercises + set_logs` (with `video_url` per Pitfall 7)
- Returns `{ session: WorkoutSession | null, prs: PRItem[], videos: VideoItem[], workoutDate, loading, refetch }`
- PRs derived from `set_logs` where `is_pr = true` (best weight per exercise)
- Videos from all `set_logs` with non-null `video_url`
- Cancels in-flight fetch on unmount/sessionId change

**RetroShareButton** (`src/features/social/components/RetroShareButton.tsx`):
- Renders `Ionicons share-outline` button; returns null when `groups.length === 0`
- Opens `RetroShareModal` (pageSheet) containing full share flow
- Modal includes workout date badge ("Workout from Jan 1, 2026"), `ContentTypeCheckboxes`, group chips, share button
- Retroactive payloads include `workout_date` field in all content_type payloads (workout, pr, video)
- State resets on modal close

**history/[sessionId].tsx updated**:
- Imports and renders `RetroShareButton` in nav bar header-right position
- Groups share button and delete button in a row with `navRightButtons` style

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written.

### Pre-existing Test Failures (Out of Scope)

The following test failures existed before this plan and are unrelated to the changes made:
- `tests/workout/sync-queue.test.ts` — operation `upsert` vs `insert` assertion mismatch
- `tests/settings/csvExport.test.ts` — CSV header format mismatch

## Self-Check: PASSED

All 3 created files exist on disk.
Both per-task commits confirmed: c54edff (Task 1) and ace63b2 (Task 2).
