---
phase: quick-35
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/features/dashboard/hooks/useTodaysWorkout.ts
  - src/features/dashboard/components/TodaysWorkoutCard.tsx
  - src/stores/planStore.ts
  - src/features/auth/hooks/useAuth.ts
autonomous: true
requirements: [QUICK-35]

must_haves:
  truths:
    - "TodaysWorkoutCard shows the current authenticated user's active plan from Supabase, not MMKV cache"
    - "Switching accounts immediately shows the correct user's workout data without stale cache"
    - "Start Workout button still works using the Supabase-fetched plan_day data"
    - "Quick-34 clearPlans workaround is fully reverted since the root cause is now fixed"
  artifacts:
    - path: "src/features/dashboard/hooks/useTodaysWorkout.ts"
      provides: "Hook that fetches active plan from Supabase directly"
      contains: "supabase.from"
    - path: "src/features/dashboard/components/TodaysWorkoutCard.tsx"
      provides: "Card consuming Supabase-fetched plan data for startFromPlan"
    - path: "src/stores/planStore.ts"
      provides: "Store without clearPlans action (reverted)"
    - path: "src/features/auth/hooks/useAuth.ts"
      provides: "Auth hook without clearPlans calls (reverted)"
  key_links:
    - from: "src/features/dashboard/hooks/useTodaysWorkout.ts"
      to: "supabase workout_plans"
      via: "direct Supabase query for active plan with plan_days"
      pattern: "supabase\\.from.*workout_plans"
    - from: "src/features/dashboard/components/TodaysWorkoutCard.tsx"
      to: "src/features/dashboard/hooks/useTodaysWorkout.ts"
      via: "consuming activePlan from hook for startFromPlan"
      pattern: "useTodaysWorkout"
---

<objective>
Refactor useTodaysWorkout to fetch the active plan directly from Supabase instead of reading from the MMKV-cached planStore. This is the proper fix for stale workout data after account switch -- the hook should query the source of truth (Supabase) not the cache. Also revert the quick-34 clearPlans workaround since it is no longer needed.

Purpose: TodaysWorkoutCard is the only dashboard card that reads from MMKV cache instead of Supabase. This creates stale data issues on account switch and is inconsistent with other dashboard cards.
Output: useTodaysWorkout queries Supabase directly; TodaysWorkoutCard uses that data for startFromPlan; quick-34 clearPlans changes reverted.
</objective>

<execution_context>
@C:/Users/maser/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/maser/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/features/dashboard/hooks/useTodaysWorkout.ts
@src/features/dashboard/components/TodaysWorkoutCard.tsx
@src/features/plans/hooks/usePlans.ts
@src/stores/planStore.ts
@src/features/auth/hooks/useAuth.ts

<interfaces>
From src/features/plans/types.ts (Plan type used by both files):
- Plan has: id, name, is_active, plan_days (PlanDay[])
- PlanDay has: id, plan_id, day_name, weekday, plan_day_exercises (PlanDayExercise[])

From src/features/progress/types.ts:
- TodaysWorkoutState = { state: 'no-plan' } | { state: 'planned', plan, todayDay } | { state: 'rest-day', plan, nextDay? }

From src/stores/authStore.ts:
- useAuthStore has: userId (string | null)

Supabase query pattern from usePlans.ts fetchPlans:
```typescript
const { data: { session } } = await supabase.auth.getSession();
const { data, error } = await (supabase.from('workout_plans') as any)
  .select('*, plan_days(id, plan_id, day_name, weekday, alarm_time, alarm_enabled, sort_order, created_at, plan_day_exercises(...))')
  .eq('user_id', session.user.id)
  .eq('is_active', true)
  .order('created_at', { ascending: false });
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Rewrite useTodaysWorkout to fetch active plan from Supabase</name>
  <files>src/features/dashboard/hooks/useTodaysWorkout.ts, src/features/dashboard/components/TodaysWorkoutCard.tsx</files>
  <action>
    1. In `src/features/dashboard/hooks/useTodaysWorkout.ts`:
       - Remove the `usePlanStore` import (no longer reading from MMKV)
       - Add imports: `useState`, `useEffect` from react; `supabase` from `@/lib/supabase/client`; `useAuthStore` from `@/stores/authStore`; `Plan` from `@/features/plans/types`
       - Keep the `determineTodaysWorkout` pure function exactly as-is (unchanged)
       - Change the return type of `useTodaysWorkout` to `{ workout: TodaysWorkoutState; activePlan: Plan | null }` so the consumer gets both the workout state AND the full plan object (needed by TodaysWorkoutCard for startFromPlan)
       - Rewrite the `useTodaysWorkout` hook body:
         - `const [activePlan, setActivePlan] = useState<Plan | null>(null)`
         - `const userId = useAuthStore((s) => s.userId)`
         - `useEffect` that runs when `userId` changes:
           - If `!userId` or `!supabase`, set activePlan to null and return
           - Query Supabase: `(supabase.from('workout_plans') as any).select('*, plan_days(id, plan_id, day_name, weekday, sort_order, plan_day_exercises(id, plan_day_id, exercise_id, sort_order, target_sets, notes, unit_override, weight_progression, exercise:exercises(id, name, equipment, muscle_groups)))').eq('user_id', userId).eq('is_active', true).limit(1).single()`
           - On success, normalize plan_days by sort_order (same as fetchPlans pattern): sort plan_days by sort_order, sort each day's plan_day_exercises by sort_order
           - Call `setActivePlan(normalized)` on success, `setActivePlan(null)` on error (no active plan)
           - Use `let cancelled = false` pattern for cleanup to avoid setting state after unmount
         - deps: `[userId]`
         - Compute workout with `useMemo`: `determineTodaysWorkout(activePlan, new Date().getDay())` with dep `[activePlan]`
         - Return `{ workout, activePlan }`

    2. In `src/features/dashboard/components/TodaysWorkoutCard.tsx`:
       - Remove the `usePlanStore` import entirely
       - Update the `useTodaysWorkout` call: `const { workout, activePlan } = useTodaysWorkout()`
       - Replace `const workout = useTodaysWorkout()` with destructured form above
       - Remove `const activePlan = usePlanStore(...)` line (line 20)
       - In the "Start Workout" button onPress, use `activePlan?.plan_days.find(...)` -- this already works since activePlan is now from the hook return value
       - Everything else stays the same (workout.state checks, completedSessions logic, etc.)
  </action>
  <verify>
    <automated>cd /c/Users/maser/Projects/Gym-App && npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>
    - useTodaysWorkout fetches active plan from Supabase using userId from authStore
    - useTodaysWorkout returns { workout, activePlan } so consumer has plan_day data
    - TodaysWorkoutCard no longer imports usePlanStore
    - TodaysWorkoutCard uses activePlan from hook for startFromPlan
    - TypeScript compiles without errors
  </done>
</task>

<task type="auto">
  <name>Task 2: Revert quick-34 clearPlans workaround</name>
  <files>src/stores/planStore.ts, src/features/auth/hooks/useAuth.ts</files>
  <action>
    1. In `src/stores/planStore.ts`:
       - Remove `clearPlans` from the `PlanActions` interface
       - Remove the `clearPlans` implementation line: `clearPlans: () => set({ plans: [], lastFetched: null, isLoading: false })`

    2. In `src/features/auth/hooks/useAuth.ts`:
       - Remove the `usePlanStore` import entirely (line 5: `import { usePlanStore } from '@/stores/planStore';`)
       - In the `signOut` callback, remove the line: `usePlanStore.getState().clearPlans();`
       - In the `onAuthStateChange` else branch, remove the line: `usePlanStore.getState().clearPlans();`

    These changes are safe because useTodaysWorkout now reads from Supabase keyed by userId. When auth state changes, the userId in authStore changes, which triggers the useEffect in useTodaysWorkout to re-fetch from Supabase for the new user. The planStore cache is still used by usePlans (Plans tab) which already re-fetches on mount. No need to clear it on sign-out.
  </action>
  <verify>
    <automated>cd /c/Users/maser/Projects/Gym-App && npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>
    - planStore no longer has clearPlans action
    - useAuth no longer imports usePlanStore or calls clearPlans
    - TypeScript compiles without errors
    - Quick-34 workaround fully reverted
  </done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` passes with no type errors
2. Manual: Sign in as user A (with active plan), verify TodaysWorkoutCard shows correct plan
3. Manual: Sign out, sign in as user B, verify TodaysWorkoutCard shows user B's plan (not user A's)
4. Manual: Start Workout button works and loads correct plan day exercises
</verification>

<success_criteria>
- useTodaysWorkout queries Supabase directly for active plan, not planStore MMKV cache
- TodaysWorkoutCard has zero references to usePlanStore
- Quick-34 clearPlans changes fully reverted from planStore and useAuth
- Account switch shows correct workout data without stale cache
- Start Workout button still functions correctly with Supabase-fetched plan data
</success_criteria>

<output>
After completion, create `.planning/quick/35-refactor-usetodaysworkout-to-fetch-activ/35-SUMMARY.md`
</output>
