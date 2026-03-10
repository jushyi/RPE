---
quick_task: 10
status: complete
commits: dbfc1e5, 7a1f21c
---

# Quick Task 10: Fix history trend arrows not showing upward trend

## What Changed

**File:** `src/features/history/hooks/useSessionDetail.ts`

**Root cause:** Delta comparison only matched sessions with the same `plan_day_id`.
When a freestyle session (plan_day_id = null) preceded a plan-based session with the
same exercise, the plan-based session couldn't find the freestyle one — no delta shown.
Downward trends worked because those compared two plan-based sessions with matching IDs.

**Fix 1 (dbfc1e5):** Use `started_at` instead of `ended_at` for session ordering
(handles NULL ended_at from crashes).

**Fix 2 (7a1f21c):** Added `fetchPreviousSessionByExercises` fallback. When no
same-plan-day previous session exists, searches the last 10 sessions for any with
overlapping exercises. This enables deltas across freestyle → plan and plan → plan transitions.
