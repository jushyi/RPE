---
quick_task: 10
description: "Fix history trend arrows not showing upward trend on subsequent days for same exercise"
created: 2026-03-10
plans: 1
---

# Quick Task 10: Fix history trend arrows not showing upward trend

## Root Cause

`fetchPreviousSession` in `useSessionDetail.ts` filters with `.lt('ended_at', sessionDate)`.
Sessions with `ended_at = NULL` (from crashes, incomplete endings) are excluded from PostgreSQL
comparisons. If the first session for a plan day has `ended_at = NULL`, subsequent sessions
can never find it as a "previous" → no upward delta shown.

Additionally, the previous session data is returned raw from Supabase without normalizing
`session_exercises` (no sorting of set_logs), though this doesn't affect calculation correctness.

## Plan 1: Fix fetchPreviousSession query

### Task 1: Use started_at for session ordering instead of ended_at

**files:** `src/features/history/hooks/useSessionDetail.ts`
**action:**
1. In `fetchPreviousSession`, change `.lt('ended_at', sessionDate)` to `.lt('started_at', sessionDate)`
2. Change `.order('ended_at', { ascending: false })` to `.order('started_at', { ascending: false })`
3. In the caller (fetchSession), pass `normalized.started_at` instead of `normalized.ended_at ?? normalized.started_at`

**verify:** The query now finds sessions that started before the current session, regardless of whether they have ended_at set.
**done:** Previous sessions with NULL ended_at are included in delta comparisons.
