---
phase: quick
plan: 22
type: execute
wave: 1
depends_on: []
files_modified:
  - src/features/workout/components/ExercisePage.tsx
autonomous: true
requirements: []
must_haves:
  truths:
    - "Starting a workout no longer crashes with ReferenceError on removeSet"
    - "Deleting a logged set from a workout exercise works correctly"
  artifacts:
    - path: "src/features/workout/components/ExercisePage.tsx"
      provides: "removeSet accessed from workoutStore"
  key_links:
    - from: "src/features/workout/components/ExercisePage.tsx"
      to: "src/stores/workoutStore.ts"
      via: "useWorkoutStore selector for removeSet"
      pattern: "useWorkoutStore.*removeSet"
---

<objective>
Fix ReferenceError: Property 'removeSet' doesn't exist in ExercisePage.tsx

Purpose: The workout screen crashes immediately when opened because `removeSet` is called on line 65 of ExercisePage.tsx but was never imported from the workoutStore. The function exists in workoutStore (line 125) but the component references it as a bare identifier.

Output: Working ExercisePage that can delete sets without crashing.
</objective>

<execution_context>
@C:/Users/maser/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/maser/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/features/workout/components/ExercisePage.tsx
@src/stores/workoutStore.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Import removeSet from workoutStore and fix dependency array</name>
  <files>src/features/workout/components/ExercisePage.tsx</files>
  <action>
In ExercisePage.tsx, add a store selector for `removeSet` from `useWorkoutStore`, following the same pattern as `toggleUnit` on line 27:

1. On line 27 (after the existing `toggleUnit` selector), add:
   `const removeSet = useWorkoutStore((s) => s.removeSet);`

2. The `handleDeleteSet` callback on line 62-70 already uses `removeSet` correctly and includes it in its dependency array. No other changes needed -- just the missing store access.

Do NOT change any other logic. The `handleDeleteSet` callback, its dependency array `[exercise.id, removeSet]`, and the `SetCard` `onDelete` prop wiring are all correct already.
  </action>
  <verify>
    <automated>cd C:/Users/maser/Projects/Gym-App && npx tsc --noEmit src/features/workout/components/ExercisePage.tsx 2>&1 | head -20</automated>
  </verify>
  <done>ExercisePage.tsx compiles without errors; `removeSet` is properly imported from workoutStore; no ReferenceError at runtime.</done>
</task>

</tasks>

<verification>
- TypeScript compilation passes with no errors for ExercisePage.tsx
- No remaining bare references to `removeSet` without store access
</verification>

<success_criteria>
- Workout screen opens without ReferenceError crash
- Set deletion works for logged sets (calls workoutStore.removeSet)
- Extra set removal still works (decrements extraSets state)
</success_criteria>

<output>
After completion, create `.planning/quick/22-fix-referenceerror-property-removeset-do/22-SUMMARY.md`
</output>
