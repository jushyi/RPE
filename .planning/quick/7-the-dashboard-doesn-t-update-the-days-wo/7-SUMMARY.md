---
phase: quick
plan: 7
subsystem: workout-dashboard
tags: [bug-fix, cache-invalidation, mmkv]
dependency_graph:
  requires: []
  provides: [removeCompletedSession-export]
  affects: [dashboard-today-section, history-deletion]
tech_stack:
  added: []
  patterns: [mmkv-cache-invalidation-on-delete]
key_files:
  created: []
  modified:
    - src/features/workout/hooks/useCompletedToday.ts
    - src/features/history/hooks/useHistory.ts
decisions:
  - Used mmkv.remove() instead of mmkv.delete() for MMKV v4 Nitro API compatibility
metrics:
  duration: 2min
  completed: "2026-03-10"
---

# Quick Task 7: Fix Dashboard Showing Deleted Workout Sessions

MMKV completed-today cache invalidation on session deletion, using removeCompletedSession export wired into deleteSession.

## What Changed

The dashboard "Today's Workout" section continued showing deleted sessions because `deleteSession` in `useHistory` only removed the session from Supabase and historyStore, but the separate MMKV cache (`completed-today`) retained stale data. On dashboard focus, `useCompletedToday` merged the stale cached session back in.

### Fix

1. **Added `removeCompletedSession(sessionId)` export** to `useCompletedToday.ts` -- reads MMKV cache, filters out the deleted session, writes back (or removes key if empty).
2. **Wired into `deleteSession`** in `useHistory.ts` -- after `removeSession(id)`, calls `removeCompletedSession(id)` to clear the MMKV cache.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed MMKV v4 API: `mmkv.delete()` -> `mmkv.remove()`**
- **Found during:** Task 1 (TypeScript verification)
- **Issue:** Plan specified `mmkv.delete(KEY)` but MMKV v4 Nitro API uses `remove()` not `delete()`
- **Fix:** Changed to `mmkv.remove(KEY)`
- **Files modified:** src/features/workout/hooks/useCompletedToday.ts
- **Commit:** 77b6dad

## Task Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Export removeCompletedSession and wire into deleteSession | 77b6dad | useCompletedToday.ts, useHistory.ts |

## Verification

- TypeScript compiles without errors in modified files
- Pre-existing TS error in summary.tsx (unrelated, from other uncommitted work) -- out of scope

## Self-Check: PASSED
