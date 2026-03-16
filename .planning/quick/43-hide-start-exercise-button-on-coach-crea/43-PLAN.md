---
phase: quick-43
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - app/(app)/plans/[id].tsx
autonomous: true
requirements: [QUICK-43]

must_haves:
  truths:
    - "When a coach views a plan they created for a trainee, no Start Workout button appears"
    - "When a trainee views a coach-created plan assigned to them, the Start Workout button still appears"
    - "When a user views their own self-created plan, the Start Workout button still appears"
  artifacts:
    - path: "app/(app)/plans/[id].tsx"
      provides: "Conditional Start Workout button based on coach ownership"
  key_links:
    - from: "app/(app)/plans/[id].tsx"
      to: "useAuthStore"
      via: "userId comparison with plan.coach_id"
      pattern: "plan\\.coach_id.*userId"
---

<objective>
Hide the "Start Workout" button on coach-created trainee plans when viewed by the coach.

Purpose: Coaches should not accidentally start workouts from plans they created for trainees. Only the trainee (or the user on their own self-created plans) should see the Start Workout button.

Output: Modified plan detail screen with conditional Start Workout visibility.
</objective>

<execution_context>
@C:/Users/maser/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/maser/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@app/(app)/plans/[id].tsx
@src/features/plans/components/PlanDaySection.tsx
@src/features/plans/types.ts
</context>

<interfaces>
<!-- Key types and contracts the executor needs -->

From src/features/plans/types.ts:
```typescript
export interface Plan {
  id: string;
  user_id: string;
  name: string;
  is_active: boolean;
  coach_id: string | null;  // null = self-created, non-null = coach who created it
  created_at: string;
  updated_at: string;
  plan_days: PlanDay[];
}
```

From src/features/plans/components/PlanDaySection.tsx:
```typescript
interface PlanDaySectionProps {
  day: PlanDay;
  defaultExpanded?: boolean;
  onStartWorkout?: (day: PlanDay) => void;  // When undefined, button is hidden
  isCoachPlan?: boolean;
  onWeekdayChange?: (dayId: string, weekday: number) => void;
}
```

From src/stores/authStore.ts:
```typescript
useAuthStore((s) => s.userId)  // returns current user's ID
```
</interfaces>

<tasks>

<task type="auto">
  <name>Task 1: Conditionally hide Start Workout for coach-owned plans</name>
  <files>app/(app)/plans/[id].tsx</files>
  <action>
In `app/(app)/plans/[id].tsx`:

1. Import `useAuthStore` from `@/stores/authStore` (already used elsewhere in the app).

2. At the top of the `PlanDetailScreen` component, get the current userId:
   ```typescript
   const userId = useAuthStore((s) => s.userId);
   ```

3. In the FlatList `renderItem` (around line 264), determine whether to show the Start Workout button. The button should be HIDDEN when the current user is the coach who created this plan (i.e., `plan.coach_id === userId`). In all other cases (self-created plans where coach_id is null, or trainee viewing their coach-assigned plan where coach_id !== userId), the button should remain visible.

   Change the `onStartWorkout` prop from:
   ```typescript
   onStartWorkout={startFromPlan}
   ```
   to:
   ```typescript
   onStartWorkout={plan.coach_id === userId ? undefined : startFromPlan}
   ```

   This works because PlanDaySection already checks `onStartWorkout && day.plan_day_exercises.length > 0` before rendering the button (line 169 of PlanDaySection.tsx). Passing `undefined` hides it.

4. Also hide the "Set as Active Plan" footer button using the same logic. Change the ListFooterComponent from:
   ```typescript
   !plan.is_active ? (
   ```
   to:
   ```typescript
   !plan.is_active && plan.coach_id !== userId ? (
   ```
   A coach viewing their trainee's plan should not be able to set it as their own active plan.
  </action>
  <verify>
    <automated>cd C:/Users/maser/Projects/Gym-App && npx tsc --noEmit --pretty 2>&1 | head -20</automated>
  </verify>
  <done>
    - Coach viewing a plan where plan.coach_id matches their userId sees no Start Workout button and no Set as Active button
    - Trainee viewing their own coach-created plan (plan.coach_id !== their userId) still sees both buttons
    - User viewing their own self-created plan (plan.coach_id is null) still sees both buttons
    - TypeScript compiles without errors
  </done>
</task>

</tasks>

<verification>
- TypeScript compilation passes with no errors
- Visual check: Coach views trainee plan -> no Start Workout or Set Active buttons visible
- Visual check: Trainee views own plan (coach-created) -> Start Workout and Set Active buttons visible
- Visual check: User views self-created plan -> Start Workout and Set Active buttons visible
</verification>

<success_criteria>
The Start Workout and Set as Active Plan buttons are hidden on the plan detail screen when the current user is the coach who created that plan. All other users continue to see the buttons as before.
</success_criteria>

<output>
After completion, create `.planning/quick/43-hide-start-exercise-button-on-coach-crea/43-SUMMARY.md`
</output>
