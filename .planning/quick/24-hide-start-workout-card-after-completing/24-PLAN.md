---
phase: quick-24
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app/(app)/(tabs)/dashboard.tsx
  - src/features/dashboard/components/TodaysWorkoutCard.tsx
autonomous: true
requirements: [QUICK-24]

must_haves:
  truths:
    - "TodaysWorkoutCard with Start Workout button is hidden when a completed session exists for today's planned workout day"
    - "TodaysWorkoutCard still shows on rest days and no-plan days (those states are unaffected)"
    - "Completed workouts section still renders normally above the card area"
  artifacts:
    - path: "app/(app)/(tabs)/dashboard.tsx"
      provides: "Passes completedToday sessions to TodaysWorkoutCard"
    - path: "src/features/dashboard/components/TodaysWorkoutCard.tsx"
      provides: "Conditionally hides when planned workout already completed"
  key_links:
    - from: "dashboard.tsx"
      to: "TodaysWorkoutCard.tsx"
      via: "completedSessions prop"
      pattern: "completedSessions.*WorkoutSession"
---

<objective>
Hide the "Today's Workout" card (with "Start Workout" button) after the user has completed a workout for the day. Currently both the completed workout summary and the start workout card show simultaneously, which is confusing.

Purpose: Remove redundant/misleading "Start Workout" prompt after workout is already done.
Output: TodaysWorkoutCard hidden when a completed session matches the planned workout day.
</objective>

<execution_context>
@C:/Users/maser/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/maser/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@app/(app)/(tabs)/dashboard.tsx
@src/features/dashboard/components/TodaysWorkoutCard.tsx
@src/features/dashboard/hooks/useTodaysWorkout.ts
@src/features/workout/hooks/useCompletedToday.ts

<interfaces>
From src/features/workout/types.ts:
```typescript
export interface WorkoutSession {
  id: string;
  user_id: string;
  plan_id: string | null;
  plan_day_id: string | null;
  title: string;
  started_at: string;
  ended_at: string | null;
  exercises: SessionExercise[];
}
```

From src/features/progress/types.ts:
```typescript
export interface TodaysWorkoutState {
  state: 'planned' | 'rest-day' | 'no-plan';
  plan?: { id: string; name: string };
  todayDay?: { id: string; label: string; exerciseCount: number; estimatedDuration: number };
  nextDay?: { label: string; dayName: string };
}
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Hide TodaysWorkoutCard when planned workout is completed</name>
  <files>src/features/dashboard/components/TodaysWorkoutCard.tsx, app/(app)/(tabs)/dashboard.tsx</files>
  <action>
In `TodaysWorkoutCard.tsx`:
1. Add an optional prop `completedSessions` of type `WorkoutSession[]` (import from workout types).
2. In the `planned` state branch (line 15), before rendering the card, check if any session in `completedSessions` has a `plan_day_id` matching `workout.todayDay.id`. If a match exists, return `null` (hide the card entirely).
3. This keeps the rest-day and no-plan branches unaffected -- those still render normally since the user may want to do a quick/freestyle workout even after completing a planned one.

In `dashboard.tsx`:
1. Pass the `completedToday` sessions array to `TodaysWorkoutCard` as the `completedSessions` prop on line 375:
   `<TodaysWorkoutCard completedSessions={completedToday} />`

Logic summary: When `workout.state === 'planned'` AND `completedSessions.some(s => s.plan_day_id === workout.todayDay.id)`, return null. This correctly handles:
- Multiple workouts in a day (only hides if the specific plan day was completed)
- Freestyle workouts (plan_day_id is null, won't match)
- No completed workouts (array is empty, card shows normally)
  </action>
  <verify>
    <automated>npx tsc --noEmit --pretty 2>&1 | head -30</automated>
  </verify>
  <done>TodaysWorkoutCard is hidden when a completed session's plan_day_id matches the planned workout day id. Card still shows for rest-day and no-plan states. TypeScript compiles without errors.</done>
</task>

</tasks>

<verification>
- TypeScript compiles cleanly
- When a completed session exists with matching plan_day_id, TodaysWorkoutCard returns null
- Rest-day and no-plan states still render their respective cards
- Completed workouts section in dashboard still renders independently
</verification>

<success_criteria>
After completing a planned workout, only the "Today's Workouts" completed summary section shows on the dashboard. The "Today's Workout" card with "Start Workout" button is hidden.
</success_criteria>

<output>
After completion, create `.planning/quick/24-hide-start-workout-card-after-completing/24-SUMMARY.md`
</output>
