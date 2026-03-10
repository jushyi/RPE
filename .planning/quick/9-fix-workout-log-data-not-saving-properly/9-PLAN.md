---
phase: quick-9
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - src/stores/workoutStore.ts
  - src/features/workout/components/ExercisePage.tsx
  - app/(app)/workout/index.tsx
  - src/features/workout/hooks/useWorkoutSession.ts
  - tests/workout/set-logging.test.ts
  - tests/workout/workout-store.test.ts
autonomous: true
requirements: [BUG-9]
must_haves:
  truths:
    - "logSet targets the correct session exercise when duplicate exercise_ids exist"
    - "removeExercise removes the correct session exercise when duplicate exercise_ids exist"
    - "SetCard onLog does not create unnecessary function references"
  artifacts:
    - path: "src/stores/workoutStore.ts"
      provides: "logSet and removeExercise match by session exercise id, not exercise_id"
    - path: "tests/workout/set-logging.test.ts"
      provides: "Test covering duplicate exercise_id scenario"
  key_links:
    - from: "src/features/workout/components/ExercisePage.tsx"
      to: "src/stores/workoutStore.ts"
      via: "onLogSet callback passes exercise.id (session-unique)"
      pattern: "onLogSet\\(exercise\\.id"
    - from: "app/(app)/workout/index.tsx"
      to: "src/stores/workoutStore.ts"
      via: "handleLogSet passes sessionExerciseId to store.logSet"
      pattern: "store\\.logSet\\(exerciseId"
---

<objective>
Fix workout set logging to use session-unique exercise IDs instead of shared exercise_ids, preventing sets from being logged to the wrong exercise when the same exercise appears multiple times in a plan day.

Purpose: Sets logged for a duplicate exercise silently go to the first occurrence, corrupting workout data and summary numbers.
Output: Corrected logSet/removeExercise matching + updated callers + regression test
</objective>

<execution_context>
@C:/Users/maser/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/maser/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/stores/workoutStore.ts
@src/features/workout/components/ExercisePage.tsx
@app/(app)/workout/index.tsx
@src/features/workout/hooks/useWorkoutSession.ts
@tests/workout/set-logging.test.ts
@tests/workout/workout-store.test.ts
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Fix store matching and add regression test</name>
  <files>src/stores/workoutStore.ts, tests/workout/set-logging.test.ts, tests/workout/workout-store.test.ts</files>
  <behavior>
    - Test: logSet with two exercises sharing the same exercise_id logs to the correct one (second occurrence) by session exercise `id`
    - Test: removeExercise with duplicate exercise_ids removes only the targeted session exercise by `id`
    - Existing tests continue to pass (they use unique exercise_ids so behavior is unchanged)
  </behavior>
  <action>
1. In `src/stores/workoutStore.ts`:
   - Change `logSet` (line 96) from `(e) => e.exercise_id === exerciseId` to `(e) => e.id === exerciseId`. The parameter name stays `exerciseId` but now represents the session exercise's unique `id`.
   - Change `removeExercise` (line 141) from `(e) => e.exercise_id !== exerciseId` to `(e) => e.id !== exerciseId`. Same parameter semantics change.
   - Update the TypeScript interface comments if helpful but no signature change needed (parameter is still `string`).

2. In `tests/workout/set-logging.test.ts`:
   - Update ALL existing `logSet('ex-1', ...)` calls to `logSet('se-1', ...)` (the session exercise id) since logSet now matches by session exercise `id`.
   - Update the assertion that finds the exercise to use `e.id === 'se-1'` instead of `e.exercise_id === 'ex-1'`.
   - Add new test: "logSet targets correct exercise when duplicate exercise_ids exist" — create a session with two exercises that share `exercise_id: 'ex-1'` but have distinct `id: 'se-1'` and `id: 'se-3'`. Log a set to `'se-3'`. Assert `se-3` has 1 logged set and `se-1` has 0.

3. In `tests/workout/workout-store.test.ts`:
   - Update `removeExercise('ex-1')` call (line 124) to use the session exercise id. After `startPlanSession`, the exercises get generated UUIDs, so instead start a manual session via `startSession(...)` with known ids (like the set-logging test does) and call `removeExercise('se-1')`. Assert the remaining exercise has `id` matching the other session exercise.
  </action>
  <verify>
    <automated>cd C:/Users/maser/Desktop/Gym-App && npx jest tests/workout/set-logging.test.ts tests/workout/workout-store.test.ts --no-coverage 2>&1 | tail -20</automated>
  </verify>
  <done>logSet and removeExercise match by session exercise `id`. New test proves duplicate exercise_id scenario works. All existing tests pass.</done>
</task>

<task type="auto">
  <name>Task 2: Update all callers to pass session exercise id</name>
  <files>src/features/workout/components/ExercisePage.tsx, app/(app)/workout/index.tsx, src/features/workout/hooks/useWorkoutSession.ts</files>
  <action>
1. In `src/features/workout/components/ExercisePage.tsx`:
   - Line 48: Change `onLogSet(exercise.exercise_id, ...)` to `onLogSet(exercise.id, ...)` — pass the session-unique id.
   - Line 50: Update useCallback dependency array — replace `exercise.exercise_id` with `exercise.id`.
   - Line 70: Change `onLog={(w, r, rpe) => handleLog(w, r, rpe)}` to `onLog={handleLog}` — pass the stable callback reference directly instead of wrapping in an inline arrow function. `handleLog` already matches the `(weight, reps, rpe) => void` signature.

2. In `app/(app)/workout/index.tsx`:
   - The `handleLogSet` callback (line 58-76) receives `exerciseId` from `ExercisePage.onLogSet` and passes it to `store.logSet(exerciseId, ...)`. Since ExercisePage now passes `exercise.id`, this flows through correctly. No change needed here — the parameter is just a passthrough string.

3. In `src/features/workout/hooks/useWorkoutSession.ts`:
   - Line 68: Change `logSetAction(currentExercise.exercise_id, setLog)` to `logSetAction(currentExercise.id, setLog)` — the `logCurrentSet` function should pass the session exercise's unique `id`.
  </action>
  <verify>
    <automated>cd C:/Users/maser/Desktop/Gym-App && npx tsc --noEmit 2>&1 | head -20 && npx jest tests/workout/ --no-coverage 2>&1 | tail -20</automated>
  </verify>
  <done>All callers pass session exercise `id` to logSet/removeExercise. TypeScript compiles cleanly. SetCard onLog no longer creates unnecessary closure.</done>
</task>

</tasks>

<verification>
1. `npx jest tests/workout/ --no-coverage` — all workout tests pass
2. `npx tsc --noEmit` — no type errors
3. Manual: Start a plan day that has the same exercise twice, log sets for the second occurrence, verify sets appear on the correct exercise and summary shows correct totals
</verification>

<success_criteria>
- logSet and removeExercise use session exercise `id` (unique per session) not `exercise_id` (shared catalog id)
- Regression test proves duplicate exercise_id scenario logs to the correct exercise
- All existing tests pass with updated ids
- ExercisePage passes handleLog directly to SetCard (no inline wrapper)
</success_criteria>

<output>
After completion, create `.planning/quick/9-fix-workout-log-data-not-saving-properly/9-SUMMARY.md`
</output>
