---
phase: quick-31
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/features/dashboard/components/TodaysWorkoutCard.tsx
autonomous: true
requirements: [QUICK-31]
must_haves:
  truths:
    - "No-plan workout card buttons stack vertically (column layout)"
  artifacts:
    - path: "src/features/dashboard/components/TodaysWorkoutCard.tsx"
      provides: "Vertical button layout in no-plan state"
      contains: "flexDirection: 'column'"
  key_links: []
---

<objective>
Change the no-plan state buttons in TodaysWorkoutCard from horizontal (side-by-side) to vertical (stacked) layout.

Purpose: Buttons look better stacked vertically, matching typical mobile card patterns.
Output: Updated TodaysWorkoutCard.tsx with column layout for no-plan buttons.
</objective>

<execution_context>
@C:/Users/maser/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/maser/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/features/dashboard/components/TodaysWorkoutCard.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Stack no-plan buttons vertically</name>
  <files>src/features/dashboard/components/TodaysWorkoutCard.tsx</files>
  <action>
In the StyleSheet at the bottom of TodaysWorkoutCard.tsx, make two changes:

1. Change `noPlanBtns` style (line 172-174): replace `flexDirection: 'row'` with `flexDirection: 'column'`. Keep `gap: 10`.

2. Remove `flex: 1` from `noPlanBtn` style (line 176-178). Either remove the `noPlanBtn` style entirely and the wrapping Views around each Button (lines 102, 108, 109, 115), OR just remove `flex: 1` from the style. Simplest approach: remove the `noPlanBtn` style and the wrapping `<View style={s.noPlanBtn}>` elements, letting each Button sit directly inside the column container.
  </action>
  <verify>
    <automated>npx tsc --noEmit --pretty 2>&1 | head -20</automated>
  </verify>
  <done>No-plan state shows "Create a Plan" and "Quick Workout" buttons stacked vertically instead of side by side. TypeScript compiles without errors.</done>
</task>

</tasks>

<verification>
- Open the app with no active plan set. The two buttons should appear stacked vertically.
- TypeScript compilation passes.
</verification>

<success_criteria>
- noPlanBtns uses flexDirection: 'column'
- flex: 1 removed from button wrappers (or wrappers removed entirely)
- No TypeScript errors
</success_criteria>

<output>
After completion, create `.planning/quick/31-stack-no-plan-workout-card-buttons-verti/31-SUMMARY.md`
</output>
