---
phase: quick-20
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - src/features/plans/hooks/usePlans.ts
  - app/(app)/(tabs)/plans.tsx
  - app/(app)/(tabs)/dashboard.tsx
autonomous: true
requirements: [FIX-PLANS-NOT-SHOWING]
must_haves:
  truths:
    - "Plans tab shows workout plans that exist in the database"
    - "Dashboard TodaysWorkoutCard shows the active plan, not 'No plan set up yet'"
    - "Pull-to-refresh on dashboard forces a fresh fetch of plans"
  artifacts:
    - path: "src/features/plans/hooks/usePlans.ts"
      provides: "fetchPlans with session-awareness and force-refresh support"
  key_links:
    - from: "src/features/plans/hooks/usePlans.ts"
      to: "supabase auth session"
      via: "getSession check before querying"
      pattern: "supabase\\.auth\\.getSession"
---

<objective>
Fix plans not showing on phone despite existing in the database.

Purpose: The Plans tab and dashboard show empty/no-plan state even when workout plans exist in Supabase. Root cause is a race condition where fetchPlans() runs before the Supabase auth session is fully restored, causing RLS to return empty results. Additionally, pull-to-refresh calls fetchPlans() without the force flag, so it skips re-fetching when the cache has a lastFetched timestamp.

Output: Plans reliably load on app start and can be force-refreshed.
</objective>

<execution_context>
@C:/Users/maser/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/maser/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/features/plans/hooks/usePlans.ts
@src/stores/planStore.ts
@app/(app)/(tabs)/plans.tsx
@app/(app)/(tabs)/dashboard.tsx
@src/lib/supabase/client.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix fetchPlans session awareness and force-refresh</name>
  <files>src/features/plans/hooks/usePlans.ts, app/(app)/(tabs)/dashboard.tsx, app/(app)/(tabs)/plans.tsx</files>
  <action>
Fix three issues in the plans fetching flow:

**1. Session-aware fetching in usePlans.ts (line ~36-78):**

In `fetchPlans`, before running the Supabase query, check that the auth session is available. If not, wait for it or skip gracefully. Replace the early section of fetchPlans with:

```typescript
const fetchPlans = useCallback(async (force = false) => {
  if (!force && lastFetched && plans.length > 0) return;
  if (!supabase) return;

  // Ensure we have a valid auth session before querying (RLS requires it)
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    console.warn('fetchPlans: no auth session, skipping');
    return;
  }

  setLoading(true);
  // ... rest of fetch logic unchanged
```

This prevents the query from running against RLS with no token and storing empty results as canonical.

**2. Force-refresh on pull-to-refresh in dashboard.tsx:**

In the `refreshAll` callback (~line 269-277), change `fetchPlans()` to `fetchPlans(true)` so pull-to-refresh always re-fetches plans from the server:

```typescript
const refreshAll = useCallback(() => {
  refreshCompleted();
  setRefreshingPRs(true);
  getPRBaselines()
    .then(setBaselines)
    .catch(() => {})
    .finally(() => setRefreshingPRs(false));
  fetchPlans(true);  // Force re-fetch on pull-to-refresh
}, [refreshCompleted, getPRBaselines, fetchPlans]);
```

**3. Force-refresh on pull-to-refresh/tab re-tap in plans.tsx:**

In the PlansContent component, add a pull-to-refresh RefreshControl to the FlatList. Also ensure the Plans tab has a way to force-refresh. Modify PlansContent:

- Add `const [refreshing, setRefreshing] = useState(false);` state
- Add a `handleRefresh` callback that calls `fetchPlans(true)`, sets refreshing true, and sets it false when done
- Add `RefreshControl` to the FlatList:
  ```typescript
  <FlatList
    ...existing props
    refreshControl={
      <RefreshControl
        refreshing={refreshing}
        onRefresh={handleRefresh}
        tintColor={colors.accent}
        colors={[colors.accent]}
      />
    }
  />
  ```
- Import `RefreshControl` from 'react-native' (add to existing import)
- Import `useState` (add to existing import if not already there)

Do NOT change the dependency arrays of useCallback in usePlans.ts -- they are correct as-is. Do NOT change any alarm-related logic. Do NOT change the Supabase query structure.
  </action>
  <verify>
    <automated>cd C:/Users/maser/Projects/Gym-App && npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>
    - fetchPlans checks for valid auth session before querying Supabase
    - Pull-to-refresh on dashboard passes force=true to fetchPlans
    - Plans tab FlatList has pull-to-refresh with force=true
    - TypeScript compiles without errors in modified files
  </done>
</task>

</tasks>

<verification>
- `npx tsc --noEmit` passes (no type errors)
- Manual verification: open app on phone, plans tab shows existing plans
- Pull-to-refresh on dashboard and plans tab force-fetches from server
</verification>

<success_criteria>
Phone displays workout plans that exist in the database. Pull-to-refresh reliably re-fetches plans from the server. No regression in plan creation, deletion, or active plan toggling.
</success_criteria>

<output>
After completion, create `.planning/quick/20-phone-shows-no-plans-even-though-there-a/20-SUMMARY.md`
</output>
