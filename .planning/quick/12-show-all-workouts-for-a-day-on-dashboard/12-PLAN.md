---
phase: quick-12
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app/(app)/(tabs)/dashboard.tsx
autonomous: true
requirements: [QUICK-12]
must_haves:
  truths:
    - "Completed workouts for today are visible on the dashboard regardless of whether a plan day is scheduled"
    - "When no plan day is scheduled but workouts were completed, both the completed cards and the Quick Workout button appear"
    - "When a plan day is scheduled and workouts completed, the existing behavior is preserved"
  artifacts:
    - path: "app/(app)/(tabs)/dashboard.tsx"
      provides: "Dashboard showing all completed workouts for the day"
  key_links:
    - from: "app/(app)/(tabs)/dashboard.tsx"
      to: "useCompletedToday hook"
      via: "completedToday sessions array"
      pattern: "completedToday\\.length"
---

<objective>
Show all completed workouts for today on the dashboard, regardless of whether they were from a scheduled plan day or a freestyle/ad-hoc session.

Purpose: Currently, if no plan day is scheduled for today, the dashboard only shows a "Quick Workout" button and never renders the CompletedWorkoutCard components. Users who did freestyle workouts or started workouts outside their plan schedule see no record on the dashboard.

Output: Updated dashboard that always shows completed workout cards when sessions exist for today.
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
  <name>Task 1: Refactor dashboard to show completed workouts independently of plan schedule</name>
  <files>app/(app)/(tabs)/dashboard.tsx</files>
  <action>
Restructure the main dashboard rendering logic (lines ~385-433) so that completed workouts are always shown when they exist, regardless of the `todayDay` variable.

Current structure (problematic):
```
if refreshing -> skeleton
else if todayDay -> Today's Workout card (contains completedToday OR plan exercises)
else -> Quick Workout button only (NO completed workouts ever shown)
```

New structure:
```
if refreshing -> skeleton
else:
  if todayDay AND completedToday.length === 0 -> Today's Workout card with plan exercises + Start button (existing behavior)
  else if todayDay AND completedToday.length > 0 -> Today's Workout header + completed cards (existing behavior)
  else if !todayDay -> Quick Workout button (existing behavior)

  // ALWAYS show completed workouts below the main action area, regardless of todayDay
  if completedToday.length > 0 AND !todayDay -> render completed workout cards section
```

More specifically, the simplest correct approach:

1. Keep the existing `todayDay` block but refactor so completed workouts also render when `!todayDay`.
2. When `!todayDay` but `completedToday.length > 0`, render:
   - The "Quick Workout" button (so user can start another workout)
   - Below it, a section titled "Today's Workouts" showing the CompletedWorkoutCard components (same style as when they appear inside the todayDay block)
3. When `todayDay` exists, keep current behavior exactly as-is (completed cards shown inside the todayDay card).

Implementation detail:
- After the existing `quickWorkoutBtn` Pressable (the `!todayDay` else branch around line 426), add a conditional block:
```tsx
{!todayDay && completedToday.length > 0 && (
  <View style={ds.todayCard}>
    <Text style={ds.completedSectionTitle}>Today's Workouts</Text>
    {completedToday.map((s, i) => (
      <CompletedWorkoutCard key={s.id} session={s} index={i} isOnly={completedToday.length === 1} />
    ))}
  </View>
)}
```
- Move the `quickWorkoutBtn` outside the ternary so it renders BEFORE the completed section when `!todayDay`, maintaining the existing margin.
- Add a `completedSectionTitle` style to `ds` StyleSheet: `{ color: colors.textSecondary, fontSize: 13, fontWeight: '500', marginBottom: 12 }` — matching the `todayLabel` style for consistency.

Do NOT change the `useCompletedToday` hook or any other file. This is purely a dashboard layout change.
  </action>
  <verify>
    <automated>npx tsc --noEmit --project C:/Users/maser/Desktop/Gym-App/tsconfig.json 2>&1 | head -20</automated>
  </verify>
  <done>
    - When no plan day is scheduled for today but the user has completed workouts, the dashboard shows both the Quick Workout button AND the completed workout cards below it
    - When a plan day IS scheduled, behavior is identical to current (no regression)
    - TypeScript compiles without errors
  </done>
</task>

</tasks>

<verification>
- TypeScript compilation passes
- Visual check: On a day with no scheduled plan but completed workouts, dashboard shows workout cards
- Visual check: On a day with a scheduled plan and completed workouts, existing behavior unchanged
</verification>

<success_criteria>
All completed workouts for today are visible on the dashboard regardless of plan scheduling. No regressions to existing plan-day workout display.
</success_criteria>

<output>
After completion, create `.planning/quick/12-show-all-workouts-for-a-day-on-dashboard/12-SUMMARY.md`
</output>
