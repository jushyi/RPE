---
phase: quick-27
plan: 01
subsystem: navigation
tags: [tabs, exercises, plans, pager-view]
dependency_graph:
  requires: []
  provides: [exercises-in-plans-pager]
  affects: [tab-layout, plans-screen]
tech_stack:
  added: []
  patterns: [pager-view-3-page, inner-tab-navigation]
key_files:
  created: []
  modified:
    - app/(app)/(tabs)/plans.tsx
    - app/(app)/(tabs)/_layout.tsx
  deleted:
    - app/(app)/(tabs)/exercises.tsx
decisions:
  - Exercises content copied inline into plans.tsx rather than extracting shared component (keeps it simple, exercises.tsx was the only consumer)
metrics:
  duration: 2min
  completed: 2026-03-12
---

# Quick Task 27: Move Exercises Off Home Tab and Into Plans Summary

Moved exercise library from standalone bottom tab into Plans screen as third PagerView page (Plans | History | Exercises), reducing bottom tabs from 4 to 3.

## What Was Done

### Task 1: Move exercise library into Plans PagerView and remove Exercises bottom tab
**Commit:** `9ef0cea`

- Added `ExercisesContent` component to `plans.tsx` containing all exercise library functionality (search, filter bar, FlatList, FAB, BottomSheet)
- Updated `TABS` constant from `['Plans', 'History']` to `['Plans', 'History', 'Exercises']`
- Increased `offscreenPageLimit` from 1 to 2 to keep all three pages alive
- Added third PagerView page wrapping `ExercisesContent`
- Removed `exercises` Tabs.Screen from `_layout.tsx` -- bottom tabs now show: Home, Plans, Settings
- Deleted `app/(app)/(tabs)/exercises.tsx` entirely
- Added styles: `exercisesContainer`, `exercisesFilterWrapper`, `exercisesList`, `exercisesFab`, `exercisesFabPressed`, `exercisesFabText`

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- TypeScript check (`npx tsc --noEmit`): All errors are pre-existing (unrelated to this change)
- Bottom tab bar: 3 tabs (Home, Plans, Settings)
- Plans screen PagerView: 3 swipeable pages (Plans, History, Exercises)
- Exercise picker modal in plan creation/workout flow: Untouched (separate component)

## Self-Check: PASSED

- [x] plans.tsx exists and contains ExercisesContent
- [x] _layout.tsx exists with 3 tabs (no exercises tab)
- [x] exercises.tsx deleted
- [x] Commit 9ef0cea found in git history
