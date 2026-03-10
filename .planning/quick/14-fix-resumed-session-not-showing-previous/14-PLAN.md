---
phase: quick-14
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/features/workout/components/SetCard.tsx
  - src/features/workout/components/ExercisePage.tsx
autonomous: true
requirements: [QUICK-14]
must_haves:
  truths:
    - "Resumed workout displays previously logged weight values in SetCard inputs"
    - "Resumed workout displays previously logged reps values in SetCard inputs"
    - "Resumed workout displays previously logged RPE values in SetCard inputs"
    - "Logged sets still show Logged badge and hide Log button"
    - "New unlogged sets still initialize from targetSet (plan-based) or empty (freestyle)"
  artifacts:
    - path: "src/features/workout/components/SetCard.tsx"
      provides: "SetCard that initializes from loggedSet data when available"
    - path: "src/features/workout/components/ExercisePage.tsx"
      provides: "Passes loggedSet data to SetCard for already-logged sets"
  key_links:
    - from: "src/features/workout/components/ExercisePage.tsx"
      to: "src/features/workout/components/SetCard.tsx"
      via: "loggedSet prop with actual SetLog data"
      pattern: "loggedSet=\\{.*logged_sets"
---

<objective>
Fix resumed workout sessions not displaying previously entered weight, reps, and RPE values.

Purpose: When a user resumes an in-progress workout, SetCard inputs show empty/target values instead of the actual logged data because SetCard initializes state from `targetSet` only and never reads from `logged_sets`. The store persists logged sets correctly via MMKV, but the UI component ignores them on mount.

Output: SetCard receives and displays actual logged set data when resuming a workout.
</objective>

<execution_context>
@C:/Users/maser/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/maser/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@src/features/workout/components/SetCard.tsx
@src/features/workout/components/ExercisePage.tsx
@src/features/workout/types.ts
@src/stores/workoutStore.ts

<interfaces>
<!-- From src/features/workout/types.ts — SetLog shape -->
From src/features/workout/types.ts:
```typescript
export interface SetLog {
  id: string;
  set_number: number;
  weight: number;
  reps: number;
  rpe: number | null;
  unit: 'kg' | 'lbs';
  is_pr: boolean;
  logged_at: string;
}
```

From src/features/workout/components/SetCard.tsx (current):
```typescript
interface SetCardProps {
  targetSet?: TargetSet;
  setNumber: number;
  unit: 'kg' | 'lbs';
  onLog: (weight: number, reps: number, rpe: number | null) => void;
  isLogged?: boolean;
}
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Pass loggedSet data from ExercisePage to SetCard and initialize inputs from it</name>
  <files>src/features/workout/components/SetCard.tsx, src/features/workout/components/ExercisePage.tsx</files>
  <action>
**Root cause:** SetCard initializes `weight`, `reps`, `rpe` state from `targetSet` only (lines 19-27 of SetCard.tsx). When resuming a workout, the store has `logged_sets` data persisted via MMKV, but SetCard never receives or reads it. The `isLogged` boolean is passed but contains no actual values.

**Fix in ExercisePage.tsx:**
In the `setCards` loop (around line 67-82), find the matching logged set and pass it as a new `loggedSet` prop:

```tsx
const loggedSet = exercise.logged_sets.find((s) => s.set_number === setNumber);

<SetCard
  key={`set-${exercise.id}-${setNumber}`}
  targetSet={targetSet}
  setNumber={setNumber}
  unit={exercise.unit}
  onLog={handleLog}
  isLogged={!!loggedSet}
  loggedSet={loggedSet}
/>
```

Note: Change `isAlreadyLogged` to derive from `loggedSet` instead of a separate `.some()` call for efficiency.

**Fix in SetCard.tsx:**
1. Import `SetLog` type from `@/features/workout/types`.
2. Add `loggedSet?: SetLog` to `SetCardProps` interface.
3. Change `useState` initializers to prefer `loggedSet` values over `targetSet`:

```tsx
const [weight, setWeight] = useState(() => {
  if (loggedSet) return String(loggedSet.weight);
  if (targetSet?.weight && targetSet.weight > 0) return String(targetSet.weight);
  return '';
});
const [reps, setReps] = useState(() => {
  if (loggedSet) return String(loggedSet.reps);
  if (targetSet?.reps && targetSet.reps > 0) return String(targetSet.reps);
  return '';
});
const [rpe, setRpe] = useState(() => {
  if (loggedSet?.rpe != null && loggedSet.rpe > 0) return String(loggedSet.rpe);
  if (targetSet?.rpe != null && targetSet.rpe > 0) return String(targetSet.rpe);
  return '';
});
```

4. Initialize `hasLogged` ref from the loggedSet presence: `const hasLogged = useRef(!!loggedSet);`

This ensures that when the component mounts with existing logged data (resume case), inputs display the actual values. For new sets, behavior is unchanged (falls through to targetSet or empty).
  </action>
  <verify>
    <automated>cd C:/Users/maser/Desktop/Gym-App && npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>
    - SetCard accepts optional `loggedSet` prop of type `SetLog`
    - When `loggedSet` is provided, weight/reps/RPE inputs initialize from logged values
    - When `loggedSet` is absent, behavior is unchanged (targetSet or empty)
    - hasLogged ref initializes from loggedSet presence
    - ExercisePage passes the matching logged_set to each SetCard
    - TypeScript compiles without new errors
  </done>
</task>

</tasks>

<verification>
1. TypeScript compiles: `npx tsc --noEmit` passes (no new errors)
2. Manual verification: Start a workout, log some sets, navigate away, resume — logged values should appear in the inputs
</verification>

<success_criteria>
- Resumed workout sessions display previously logged weight, reps, and RPE values in SetCard inputs
- Already-logged sets show "Logged" badge and hide the Log button (unchanged behavior)
- New unlogged sets still initialize from targetSet (plan-based) or empty (freestyle) as before
- No TypeScript errors introduced
</success_criteria>

<output>
After completion, create `.planning/quick/14-fix-resumed-session-not-showing-previous/14-SUMMARY.md`
</output>
