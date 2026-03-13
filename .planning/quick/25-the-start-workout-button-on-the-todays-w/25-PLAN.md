---
phase: quick-25
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - src/features/dashboard/components/TodaysWorkoutCard.tsx
autonomous: true
requirements: [quick-25]
must_haves:
  truths:
    - "Tapping Start Workout on the TodaysWorkoutCard launches a plan-based workout session"
    - "The workout session loads with the correct exercises from the planned day"
  artifacts:
    - path: "src/features/dashboard/components/TodaysWorkoutCard.tsx"
      provides: "Fixed Start Workout button using startFromPlan flow"
  key_links:
    - from: "src/features/dashboard/components/TodaysWorkoutCard.tsx"
      to: "src/features/workout/hooks/useWorkoutSession.ts"
      via: "startFromPlan(planDay) call"
      pattern: "startFromPlan"
---

<objective>
Fix the Start Workout button on the TodaysWorkoutCard in the dashboard so it actually starts a workout session.

Purpose: The button currently navigates directly to `/(app)/workout` passing only a `planDayId` param, but the workout screen expects an active session to already exist in the workoutStore. The working flow (from plan detail screen) calls `startFromPlan(planDay)` which creates the session in the store AND navigates. The TodaysWorkoutCard must do the same.

Output: Working Start Workout button that launches a plan-based workout.
</objective>

<execution_context>
@C:/Users/maser/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/maser/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/features/dashboard/components/TodaysWorkoutCard.tsx
@src/features/workout/hooks/useWorkoutSession.ts
@src/stores/workoutStore.ts
@src/stores/planStore.ts
</context>

<interfaces>
<!-- The root cause and fix pattern -->

From src/features/workout/hooks/useWorkoutSession.ts:
```typescript
// startFromPlan creates a session in workoutStore AND navigates to /workout
const startFromPlan = useCallback(
  (planDay: PlanDay) => {
    if (!userId) return;
    startPlanSession(planDay, userId);
    router.push('/workout' as any);
  },
  [userId, startPlanSession, router]
);
```

From src/features/plans/types.ts:
```typescript
// PlanDay is the full object needed by startFromPlan
// Available via usePlanStore plans -> plan_days
```

Bug: TodaysWorkoutCard line 59-63 does `router.push('/(app)/workout', { planDayId: ... })` which:
1. Does NOT create a session in workoutStore (no startPlanSession call)
2. Uses wrong param name (`planDayId` vs `plan_day_id`)
3. Workout screen finds no activeSession, redirects back immediately

Working pattern (plan detail screen): calls `startFromPlan(planDay)` from useWorkoutSession hook, which handles both session creation and navigation.
</interfaces>

<tasks>

<task type="auto">
  <name>Task 1: Fix Start Workout button to use startFromPlan</name>
  <files>src/features/dashboard/components/TodaysWorkoutCard.tsx</files>
  <action>
    Replace the broken `router.push` call on the Start Workout button with the proper `startFromPlan` flow:

    1. Import `usePlanStore` from `@/stores/planStore`.
    2. In the component, get the active plan's full plan_days from the store: `const activePlan = usePlanStore((s) => s.plans.find((p) => p.is_active));`
    3. Get `startFromPlan` from `useWorkoutSession()` (already imported).
    4. Change the Start Workout button's `onPress` handler to:
       - Look up the full `PlanDay` from `activePlan.plan_days` using `workout.todayDay.id`
       - Call `startFromPlan(planDay)` if found
    5. The `router` import can remain for the Pressable that navigates to the plan detail page.
    6. Remove the now-unused `router.push` for starting workout.

    The key insight: `startFromPlan` already handles both creating the session in the store AND navigating to the workout screen. The TodaysWorkoutCard just needs to call it with the full PlanDay object instead of trying to navigate directly.
  </action>
  <verify>
    npx tsc --noEmit --pretty 2>&1 | head -20
  </verify>
  <done>Start Workout button on TodaysWorkoutCard calls startFromPlan with the full PlanDay object, launching the workout session correctly instead of navigating to a blank screen.</done>
</task>

</tasks>

<verification>
- TypeScript compilation passes with no errors in TodaysWorkoutCard.tsx
- Start Workout button onPress calls startFromPlan (not router.push to workout)
- The full PlanDay object is resolved from the plan store before calling startFromPlan
</verification>

<success_criteria>
- Tapping Start Workout on the dashboard TodaysWorkoutCard launches a workout session with the correct exercises loaded
- No TypeScript errors
</success_criteria>

<output>
After completion, create `.planning/quick/25-the-start-workout-button-on-the-todays-w/25-SUMMARY.md`
</output>
