---
phase: quick-5
plan: 5
type: execute
wave: 1
depends_on: []
files_modified:
  - src/features/workout/workoutSessionBridge.ts
  - src/features/workout/hooks/useWorkoutSession.ts
  - app/(app)/workout/summary.tsx
  - app/(app)/workout/index.tsx
autonomous: true
requirements: []
must_haves:
  truths:
    - "No require cycle warning appears in Metro bundler output"
    - "Workout session still completes and navigates to summary screen"
    - "Summary screen still resets the finishing flag on mount"
    - "Workout index screen still guards against missing session using isWorkoutFinishing"
  artifacts:
    - path: "src/features/workout/workoutSessionBridge.ts"
      provides: "Shared module-level state: completedSession + isFinishing flags"
      exports: ["setCompletedSession", "getCompletedSession", "clearCompletedSession", "isWorkoutFinishing", "setIsFinishing", "resetFinishingFlag"]
  key_links:
    - from: "src/features/workout/hooks/useWorkoutSession.ts"
      to: "src/features/workout/workoutSessionBridge.ts"
      via: "import setCompletedSession, setIsFinishing"
    - from: "app/(app)/workout/summary.tsx"
      to: "src/features/workout/workoutSessionBridge.ts"
      via: "import getCompletedSession, clearCompletedSession, resetFinishingFlag"
    - from: "app/(app)/workout/index.tsx"
      to: "src/features/workout/workoutSessionBridge.ts"
      via: "import isWorkoutFinishing"
---

<objective>
Break the circular dependency between useWorkoutSession.ts and summary.tsx by extracting their shared module-level state into a neutral bridge module.

Purpose: Metro's require cycle warning indicates a real bundler risk — circular imports can cause undefined values at module init time. The bridge pattern is the standard React Native fix.
Output: New file workoutSessionBridge.ts; both the hook and the screen import from it instead of each other. A third caller (workout/index.tsx) is also updated to import isWorkoutFinishing from the bridge.
</objective>

<execution_context>
@C:/Users/maser/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/maser/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create workoutSessionBridge.ts and update all callers</name>
  <files>
    src/features/workout/workoutSessionBridge.ts
    src/features/workout/hooks/useWorkoutSession.ts
    app/(app)/workout/summary.tsx
    app/(app)/workout/index.tsx
  </files>
  <action>
    The cycle is:
      useWorkoutSession.ts imports `setCompletedSession` from summary.tsx
      summary.tsx imports `resetFinishingFlag` from useWorkoutSession.ts

    Three files are involved:
      - src/features/workout/hooks/useWorkoutSession.ts (writes _isFinishing, calls setCompletedSession)
      - app/(app)/workout/summary.tsx (reads completedSession, calls resetFinishingFlag)
      - app/(app)/workout/index.tsx (calls isWorkoutFinishing to guard redirect)

    Step 1 — Create `src/features/workout/workoutSessionBridge.ts`:

    ```typescript
    /**
     * Shared module-level bridge between useWorkoutSession and the summary screen.
     * Extracted to break the require cycle:
     *   useWorkoutSession -> summary -> useWorkoutSession
     *
     * All three callers import from here instead of from each other.
     */
    import type { WorkoutSession } from '@/features/workout/types';

    // --- Completed session handoff ---
    // Set by useWorkoutSession.finishWorkout() before navigating to summary.
    let _completedSession: WorkoutSession | null = null;

    export function setCompletedSession(session: WorkoutSession) {
      _completedSession = session;
    }

    export function getCompletedSession(): WorkoutSession | null {
      return _completedSession;
    }

    export function clearCompletedSession() {
      _completedSession = null;
    }

    // --- Finishing flag ---
    // Prevents the "no session" redirect from racing with navigation to summary.
    let _isFinishing = false;

    export function isWorkoutFinishing(): boolean {
      return _isFinishing;
    }

    export function setIsFinishing(value: boolean) {
      _isFinishing = value;
    }

    export function resetFinishingFlag() {
      _isFinishing = false;
    }
    ```

    Step 2 — Update `src/features/workout/hooks/useWorkoutSession.ts`:
    - REMOVE: `import { setCompletedSession } from '@/../app/(app)/workout/summary';`
    - ADD: `import { setCompletedSession, setIsFinishing } from '@/features/workout/workoutSessionBridge';`
    - REMOVE the module-level `let _isFinishing = false;` variable declaration
    - REMOVE the `isWorkoutFinishing` function definition (line: `export function isWorkoutFinishing() { return _isFinishing; }`)
    - REMOVE the `resetFinishingFlag` function definition (line: `export function resetFinishingFlag() { _isFinishing = false; }`)
    - In `finishWorkout` callback: replace `_isFinishing = true;` with `setIsFinishing(true);` and replace `_isFinishing = false;` with `setIsFinishing(false);`
    - The hook no longer needs to export isWorkoutFinishing or resetFinishingFlag — callers import from the bridge directly.

    Step 3 — Update `app/(app)/workout/summary.tsx`:
    - REMOVE: `import { resetFinishingFlag as _resetFlag } from '@/features/workout/hooks/useWorkoutSession';`
    - ADD: `import { getCompletedSession, clearCompletedSession, resetFinishingFlag } from '@/features/workout/workoutSessionBridge';`
    - REMOVE the module-level `let _completedSession: WorkoutSession | null = null;` variable
    - REMOVE the `setCompletedSession` function definition
    - REMOVE the `getCompletedSession` function definition
    - In `useState` initializer (`useState<WorkoutSession | null>(() => getCompletedSession())`): already calls getCompletedSession — it will now use the imported version, no change needed to the call site
    - In the `useEffect` that calls `_resetFlag()`: rename to `resetFinishingFlag()`
    - In `handleDone`: replace `_completedSession = null;` with `clearCompletedSession();`
    - Keep the `WorkoutSession` type import — it still uses it for `useState<WorkoutSession | null>`

    Step 4 — Update `app/(app)/workout/index.tsx`:
    - The current import is: `import { useWorkoutSession, isWorkoutFinishing } from '@/features/workout/hooks/useWorkoutSession';`
    - Change to two imports:
      `import { useWorkoutSession } from '@/features/workout/hooks/useWorkoutSession';`
      `import { isWorkoutFinishing } from '@/features/workout/workoutSessionBridge';`
    - No call-site changes needed — isWorkoutFinishing() signature is identical.
  </action>
  <verify>
    <automated>cd /c/Users/maser/Desktop/Gym-App && grep -r "from.*workout/summary" src/features/workout/hooks/ && echo "CYCLE STILL EXISTS" || echo "NO HOOK->SUMMARY IMPORT"</automated>
  </verify>
  <done>
    - workoutSessionBridge.ts exists and exports all 6 functions
    - useWorkoutSession.ts has zero imports from app/(app)/workout/summary.tsx
    - summary.tsx has zero imports from useWorkoutSession.ts
    - index.tsx imports isWorkoutFinishing from workoutSessionBridge (not from useWorkoutSession)
    - No "Require cycle" warning in Metro output for these two files
  </done>
</task>

</tasks>

<verification>
After task completion, confirm:
1. `grep -rn "from.*workout/summary" src/features/workout/hooks/` returns no results
2. `grep -rn "from.*useWorkoutSession" app/(app)/workout/summary.tsx` returns no results
3. `grep -n "workoutSessionBridge" app/(app)/workout/index.tsx` shows the new import
4. workoutSessionBridge.ts exists at src/features/workout/workoutSessionBridge.ts
</verification>

<success_criteria>
Metro bundler no longer emits: "WARN Require cycle: src/features/workout/hooks/useWorkoutSession.ts -> app/(app)/workout/summary.tsx -> src/features/workout/hooks/useWorkoutSession.ts"
</success_criteria>

<output>
After completion, create `.planning/quick/5-fix-require-cycle-between-useworkoutsess/5-SUMMARY.md`
</output>
