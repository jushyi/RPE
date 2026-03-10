---
phase: quick-15
plan: 1
subsystem: dashboard
tags: [performance, navigation, ux]
dependency_graph:
  requires: []
  provides: [dashboard-no-refetch-on-focus]
  affects: [dashboard, useCompletedToday]
tech_stack:
  patterns: [mount-only-useEffect, manual-refresh-via-tabPress]
key_files:
  modified:
    - src/features/workout/hooks/useCompletedToday.ts
    - app/(app)/(tabs)/dashboard.tsx
decisions:
  - Mount-only useEffect instead of useFocusEffect for initial data load
  - Keep tabPress listener as the sole manual refresh trigger
metrics:
  duration: 1min
  completed: "2026-03-10"
  tasks_completed: 2
  tasks_total: 2
---

# Quick Task 15: Stop Dashboard Refresh on Every Tab Switch Summary

Replaced useFocusEffect with mount-only useEffect in both the dashboard screen and useCompletedToday hook, eliminating unnecessary re-fetches and UI flicker when switching tabs.

## What Changed

### Task 1: Remove useFocusEffect from useCompletedToday (16307fa)

- Replaced `useFocusEffect(refresh)` with `useEffect(() => { refresh(); }, [])` so the hook only fetches data once on mount
- Removed the `useFocusEffect` import from expo-router (no longer needed)
- The `refresh()` function remains exposed for the dashboard to call on tab-press

### Task 2: Remove useFocusEffect from dashboard (87b2bae)

- Replaced `useFocusEffect` block that called `getPRBaselines` and `fetchPlans` on every focus with a mount-only `useEffect`
- Removed `useFocusEffect` and `useCallback` imports (both no longer used)
- Kept the existing `tabPress` event listener unchanged -- tapping the Home tab icon while already on the dashboard still refreshes all data

## Behavior After Changes

| Scenario | Before | After |
|----------|--------|-------|
| Switch to another tab and back | Full re-fetch, skeleton flash | No re-fetch, data persists |
| App first opens to dashboard | Loads data | Loads data (unchanged) |
| Tap Home icon while on dashboard | Refreshes all data | Refreshes all data (unchanged) |

## Deviations from Plan

None - plan executed exactly as written.

## Pre-existing Issues (Out of Scope)

- `app/(app)/(tabs)/dashboard.tsx:336` - TypeScript error on `tabPress` listener type (pre-existing, not caused by this change)
- `src/features/workout/components/SetCard.tsx:85` - Missing Ionicons import (unrelated file)

## Self-Check: PASSED
