---
phase: quick
plan: 13
type: execute
wave: 1
depends_on: []
files_modified:
  - src/features/workout/hooks/useWorkoutSession.ts
  - src/stores/workoutStore.ts
  - src/features/workout/hooks/usePRDetection.ts
  - src/features/workout/components/ExercisePage.tsx
  - src/features/workout/components/ExercisePager.tsx
  - app/(app)/workout/index.tsx
autonomous: true
requirements: [QUICK-13]
must_haves:
  truths:
    - "Freestyle exercises use the user's preferred unit (kg or lbs) instead of hardcoded lbs"
    - "Plan exercises with null unit_override fall back to the user's preferred unit instead of hardcoded lbs"
    - "PR baselines are stored with the actual exercise unit, not hardcoded lbs"
  artifacts:
    - path: "src/features/workout/hooks/useWorkoutSession.ts"
      provides: "Freestyle exercise unit from authStore.preferredUnit"
      contains: "preferredUnit"
    - path: "src/stores/workoutStore.ts"
      provides: "Plan session fallback unit from authStore.preferredUnit"
      contains: "preferredUnit"
    - path: "src/features/workout/hooks/usePRDetection.ts"
      provides: "detectPR accepts unit parameter, uses it in all PR write sites"
      contains: "unit"
  key_links:
    - from: "src/features/workout/hooks/useWorkoutSession.ts"
      to: "src/stores/authStore.ts"
      via: "useAuthStore.getState().preferredUnit"
      pattern: "useAuthStore\\.getState\\(\\)\\.preferredUnit"
    - from: "src/features/workout/components/ExercisePage.tsx"
      to: "src/features/workout/hooks/usePRDetection.ts"
      via: "onDetectPR(exerciseId, weight, unit)"
      pattern: "onDetectPR.*exercise\\.unit"
---

<objective>
Fix hardcoded 'lbs' unit defaults across workout session creation and PR detection so they respect the user's preferredUnit from authStore.

Purpose: Users who prefer kg get lbs-denominated exercises and PRs, which is incorrect.
Output: All three bug locations fixed -- freestyle exercises, plan fallback, and PR writes all use correct unit.
</objective>

<execution_context>
@C:/Users/maser/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/maser/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/stores/authStore.ts
@src/features/workout/hooks/useWorkoutSession.ts
@src/stores/workoutStore.ts
@src/features/workout/hooks/usePRDetection.ts
@src/features/workout/components/ExercisePage.tsx
@src/features/workout/components/ExercisePager.tsx
@app/(app)/workout/index.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix hardcoded 'lbs' in session creation (useWorkoutSession + workoutStore)</name>
  <files>src/features/workout/hooks/useWorkoutSession.ts, src/stores/workoutStore.ts</files>
  <action>
    1. In `src/features/workout/hooks/useWorkoutSession.ts` line 120, in the `addFreestyleExercise` callback:
       - Change `unit: 'lbs'` to `unit: useAuthStore.getState().preferredUnit`
       - The `useAuthStore` import already exists at line 4, so no new import needed.
       - Use `getState()` (not a hook selector) because this is inside a useCallback, and we want the current value at call time.

    2. In `src/stores/workoutStore.ts` line 70, in `startPlanSession`:
       - Change the fallback `(pde.unit_override ?? 'lbs')` to `(pde.unit_override ?? useAuthStore.getState().preferredUnit)`
       - Add import: `import { useAuthStore } from '@/stores/authStore';` at the top of the file.
       - This is a Zustand store (not a React component), so `getState()` is the correct access pattern.
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <done>Freestyle exercises and plan exercises with null unit_override use the user's preferredUnit from authStore instead of hardcoded 'lbs'.</done>
</task>

<task type="auto">
  <name>Task 2: Thread unit parameter through detectPR and fix all PR write sites</name>
  <files>src/features/workout/hooks/usePRDetection.ts, src/features/workout/components/ExercisePage.tsx, src/features/workout/components/ExercisePager.tsx, app/(app)/workout/index.tsx</files>
  <action>
    1. In `src/features/workout/hooks/usePRDetection.ts`:
       - Add `unit: 'kg' | 'lbs'` as third parameter to `detectPR` (line 85): `async (exerciseId: string, weight: number, unit: 'kg' | 'lbs'): Promise<PRResult>`
       - Line 108: Change `unit: 'lbs'` to `unit` in the session cache push for exercises not in baselines
       - Line 127: Change `unit: 'lbs'` to `unit` in the Supabase upsert object
       - Line 145: Change `unit: 'lbs'` to `unit` in the setBaselines local state update

    2. In `src/features/workout/components/ExercisePage.tsx`:
       - Line 14: Update the `onDetectPR` prop type to include unit: `(exerciseId: string, weight: number, unit: 'kg' | 'lbs') => Promise<PRResult>`
       - Line 37: Pass `exercise.unit` as third argument: `await onDetectPR(exercise.exercise_id, weight, exercise.unit)`

    3. In `src/features/workout/components/ExercisePager.tsx`:
       - Line 13: Update the `onDetectPR` prop type to match: `(exerciseId: string, weight: number, unit: 'kg' | 'lbs') => Promise<PRResult>`
       - No other changes needed -- ExercisePager passes `onDetectPR` through to ExercisePage unchanged.

    4. In `app/(app)/workout/index.tsx`:
       - Line 149: The `detectPR` from `usePRDetection` now accepts 3 params. Since it is passed directly as `onDetectPR={detectPR}`, no change needed here -- the call sites in ExercisePage will pass the third arg through.
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <done>detectPR accepts a unit parameter. All three PR write sites (session cache push, Supabase upsert, local baselines state) use the passed unit instead of hardcoded 'lbs'. ExercisePage passes exercise.unit through when calling onDetectPR.</done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` passes with no errors
2. Grep confirms no remaining hardcoded `'lbs'` in the three modified files (except in type annotations):
   - `grep -n "'lbs'" src/features/workout/hooks/useWorkoutSession.ts` should return nothing
   - `grep -n "'lbs'" src/stores/workoutStore.ts` should return nothing
   - `grep -n "'lbs'" src/features/workout/hooks/usePRDetection.ts` should return nothing
</verification>

<success_criteria>
- No hardcoded 'lbs' remains in useWorkoutSession.ts, workoutStore.ts, or usePRDetection.ts (outside type annotations)
- TypeScript compiles cleanly
- Unit flows from authStore.preferredUnit into freestyle exercises and plan fallbacks
- Unit flows from exercise.unit through detectPR into all PR persistence sites
</success_criteria>

<output>
After completion, create `.planning/quick/13-fix-default-unit-to-match-pr-unit-instea/13-SUMMARY.md`
</output>
