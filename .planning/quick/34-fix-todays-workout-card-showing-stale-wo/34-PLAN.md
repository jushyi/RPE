---
phase: quick-34
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/stores/planStore.ts
  - src/features/auth/hooks/useAuth.ts
autonomous: true
requirements: [QUICK-34]

must_haves:
  truths:
    - "After signing out and signing in as a different user, the TodaysWorkoutCard shows the new user's plan (or no-plan state), not the previous user's plan"
    - "Plan store MMKV cache is cleared on sign-out so no stale data persists"
  artifacts:
    - path: "src/stores/planStore.ts"
      provides: "clearPlans action to reset plan state"
      contains: "clearPlans"
    - path: "src/features/auth/hooks/useAuth.ts"
      provides: "Plan store clearing on sign-out"
  key_links:
    - from: "src/features/auth/hooks/useAuth.ts"
      to: "src/stores/planStore.ts"
      via: "clearPlans called in signOut and onAuthStateChange(null)"
      pattern: "clearPlans"
---

<objective>
Fix the TodaysWorkoutCard showing a stale workout from a previously logged-in account instead of the current user's plan data.

Purpose: The planStore persists to MMKV but is never cleared on sign-out. When a different user signs in, the old user's plans (including active plan) are still in the store. The `useTodaysWorkout` hook reads `activePlan` from planStore, so it shows the wrong workout. Additionally, `fetchPlans` has a cache guard (`if (!force && lastFetched && plans.length > 0) return`) that prevents re-fetching when stale plans exist.

Output: planStore cleared on sign-out; TodaysWorkoutCard shows correct data for current user after account switch.
</objective>

<execution_context>
@C:/Users/maser/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/maser/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/stores/planStore.ts
@src/features/auth/hooks/useAuth.ts
@src/features/dashboard/hooks/useTodaysWorkout.ts
@src/features/dashboard/components/TodaysWorkoutCard.tsx
@src/stores/authStore.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add clearPlans action to planStore and call it on sign-out</name>
  <files>src/stores/planStore.ts, src/features/auth/hooks/useAuth.ts</files>
  <action>
    1. In `src/stores/planStore.ts`:
       - Add a `clearPlans` action to the `PlanActions` interface: `clearPlans: () => void;`
       - Implement it in the store: `clearPlans: () => set({ plans: [], lastFetched: null, isLoading: false })`
       - This resets all plan state including `lastFetched` so the cache guard in `fetchPlans` won't skip the next fetch.

    2. In `src/features/auth/hooks/useAuth.ts`:
       - Import `usePlanStore` from `@/stores/planStore`
       - In the `signOut` callback, call `usePlanStore.getState().clearPlans()` BEFORE `clearAuth()`. Using `.getState()` avoids subscribing the hook to planStore changes.
       - In the `onAuthStateChange` listener, in the `else` branch (session is null / signed out), also call `usePlanStore.getState().clearPlans()` before `clearAuth()`. This handles edge cases where auth state changes without going through the signOut function (e.g., token expiry, server-side session revocation).

    This ensures that when a user signs out (by any mechanism), the planStore is wiped clean. When the next user signs in and the dashboard mounts, `fetchPlans` will see `plans.length === 0` and fetch fresh data from Supabase for the new user.
  </action>
  <verify>
    <automated>npx jest tests/plans/plan-store.test.ts --passWithNoTests 2>&1 | tail -5</automated>
  </verify>
  <done>
    - planStore has a `clearPlans` action that resets plans to [] and lastFetched to null
    - signOut in useAuth calls clearPlans before clearAuth
    - onAuthStateChange null-session branch calls clearPlans before clearAuth
    - Switching accounts shows correct TodaysWorkoutCard data (no stale plans from previous user)
  </done>
</task>

</tasks>

<verification>
1. Existing plan store tests still pass
2. Manual verification: sign in as user A (with active plan), sign out, sign in as user B -- TodaysWorkoutCard shows user B's plan or no-plan state
</verification>

<success_criteria>
- planStore.clearPlans() exists and resets plans + lastFetched
- Sign-out clears plan cache in both signOut function and onAuthStateChange listener
- No stale workout data visible after account switch
</success_criteria>

<output>
After completion, create `.planning/quick/34-fix-todays-workout-card-showing-stale-wo/34-SUMMARY.md`
</output>
