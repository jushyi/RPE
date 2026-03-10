---
phase: quick-15
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - app/(app)/(tabs)/dashboard.tsx
  - src/features/workout/hooks/useCompletedToday.ts
autonomous: true
requirements: [QUICK-15]
must_haves:
  truths:
    - "Dashboard does NOT re-fetch data when navigating back to it from another tab"
    - "Dashboard DOES refresh all data when user taps the Home tab icon while already on the dashboard"
    - "Dashboard still loads data on initial mount"
  artifacts:
    - path: "app/(app)/(tabs)/dashboard.tsx"
      provides: "Dashboard with initial-load-only + tab-press refresh"
    - path: "src/features/workout/hooks/useCompletedToday.ts"
      provides: "Completed today hook without useFocusEffect auto-refresh"
  key_links:
    - from: "app/(app)/(tabs)/dashboard.tsx"
      to: "useCompletedToday"
      via: "tabPress listener calls refresh()"
      pattern: "tabPress.*refresh"
---

<objective>
Stop the dashboard from re-fetching all data every time it comes into view. Data should only refresh when the user taps the Home tab icon while already on the dashboard tab, or on initial mount.

Purpose: Prevents unnecessary network requests and UI flicker/skeleton flashing when switching tabs.
Output: Modified dashboard and useCompletedToday hook.
</objective>

<execution_context>
@C:/Users/maser/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/maser/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@app/(app)/(tabs)/dashboard.tsx
@src/features/workout/hooks/useCompletedToday.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Remove useFocusEffect auto-refresh from useCompletedToday</name>
  <files>src/features/workout/hooks/useCompletedToday.ts</files>
  <action>
    In the `useCompletedToday` hook:

    1. Remove the `useFocusEffect(refresh)` call on line 160. This is what causes re-fetching every time the dashboard comes into view.
    2. Remove the `useFocusEffect` import from expo-router (if no longer used).
    3. Instead, load initial data with a `useEffect` that runs only once on mount. The effect should call `refresh()` once to populate from MMKV cache + Supabase on first load.
    4. Keep the `refresh` function exposed so the dashboard can call it manually on tab-press.

    The key change: `useFocusEffect(refresh)` --> `useEffect(() => { refresh(); }, [])` (mount-only).
  </action>
  <verify>
    <automated>npx tsc --noEmit --pretty 2>&1 | head -20</automated>
  </verify>
  <done>useCompletedToday no longer auto-refreshes on focus, only on initial mount and when refresh() is called explicitly.</done>
</task>

<task type="auto">
  <name>Task 2: Remove useFocusEffect from dashboard, keep tabPress refresh</name>
  <files>app/(app)/(tabs)/dashboard.tsx</files>
  <action>
    In `DashboardScreen`:

    1. Remove the `useFocusEffect` block (lines 327-332) that calls `getPRBaselines` and `fetchPlans` on every focus. Replace it with a `useEffect` that runs once on mount:
       ```
       useEffect(() => {
         getPRBaselines().then(setBaselines).catch(() => {});
         fetchPlans();
       }, []);
       ```

    2. Keep the existing `tabPress` listener (lines 335-346) exactly as-is -- this is the desired behavior where tapping the Home icon while already on dashboard refreshes everything.

    3. Remove `useFocusEffect` from the import if no longer used. Keep `useCallback` only if still needed elsewhere.

    The tabPress listener already calls `refreshCompleted()`, `getPRBaselines()`, and `fetchPlans()` -- that covers the "tap icon to refresh" behavior the user wants.
  </action>
  <verify>
    <automated>npx tsc --noEmit --pretty 2>&1 | head -20</automated>
  </verify>
  <done>Dashboard loads data once on mount, refreshes only when user taps the Home tab icon while already on dashboard. No more re-fetch on every tab switch.</done>
</task>

</tasks>

<verification>
1. TypeScript compiles without errors
2. Navigate away from dashboard to Exercises tab and back -- no skeleton/loading flash, data stays as-is
3. Tap the Home tab icon while already on dashboard -- data refreshes (skeleton may briefly show for PRs)
</verification>

<success_criteria>
- Dashboard does not re-fetch when navigating back from other tabs
- Dashboard refreshes all data when Home tab icon is tapped while on dashboard
- No TypeScript errors
</success_criteria>

<output>
After completion, create `.planning/quick/15-the-dashboard-shouldnt-refresh-everytime/15-SUMMARY.md`
</output>
