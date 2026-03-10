---
quick_task: 10
status: complete
commit: dbfc1e5
---

# Quick Task 10: Fix history trend arrows not showing upward trend

## What Changed

**File:** `src/features/history/hooks/useSessionDetail.ts`

**Root cause:** `fetchPreviousSession` used `.lt('ended_at', sessionDate)` to find
the previous session for delta comparison. PostgreSQL excludes rows where `ended_at IS NULL`
from `<` comparisons. Sessions with `ended_at = NULL` (from app crashes or incomplete endings)
could never be found as a "previous" session, so upward deltas from those sessions never showed.

**Fix:** Changed to use `started_at` instead of `ended_at` for both the filter and ordering:
- `.lt('started_at', sessionDate)` — includes all sessions regardless of ended_at
- `.order('started_at', { ascending: false })` — consistent chronological ordering
- Passed `normalized.started_at` as the reference date (always non-null)
