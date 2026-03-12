---
phase: quick-20
plan: 1
subsystem: plans
tags: [bug-fix, auth, race-condition, pull-to-refresh]
dependency_graph:
  requires: [supabase-auth, plan-store]
  provides: [session-aware-plan-fetch, force-refresh-plans]
  affects: [dashboard, plans-tab]
tech_stack:
  patterns: [auth-session-guard-before-rls-query]
key_files:
  modified:
    - src/features/plans/hooks/usePlans.ts
    - app/(app)/(tabs)/dashboard.tsx
    - app/(app)/(tabs)/plans.tsx
decisions:
  - "Auth session check before RLS-protected queries prevents empty results on cold start"
metrics:
  duration: 1min
  completed: "2026-03-12"
---

# Quick Task 20: Fix Plans Not Showing on Phone

Session-aware fetchPlans with auth guard before Supabase RLS query, plus force-refresh on pull-to-refresh for both dashboard and plans tab.

## What Was Done

### Task 1: Fix fetchPlans session awareness and force-refresh (3d267c5)

**Root cause:** `fetchPlans()` ran before the Supabase auth session was restored on app launch. With no auth token, RLS returned zero rows, and the empty result was cached as canonical. Subsequent non-force calls saw `lastFetched` was set and returned early.

**Fixes applied:**

1. **Session guard in usePlans.ts:** Added `supabase.auth.getSession()` check at the top of `fetchPlans`. If no session exists, the function returns early with a warning instead of querying RLS with no token and caching empty results.

2. **Dashboard pull-to-refresh force flag:** Changed `fetchPlans()` to `fetchPlans(true)` in the `refreshAll` callback so pull-to-refresh always bypasses the cache and re-fetches from the server.

3. **Plans tab pull-to-refresh:** Added `RefreshControl` to the plans tab FlatList with a `handleRefresh` callback that calls `fetchPlans(true)`. Users can now pull-to-refresh on the Plans tab to force a server re-fetch.

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- TypeScript compilation passes (no new errors in modified files; all pre-existing errors are in unrelated files)
- Auth session check prevents empty RLS results on cold start
- Pull-to-refresh forces server re-fetch on both dashboard and plans tab
