---
phase: quick-33
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - src/features/workout/workoutSessionBridge.ts
  - src/features/workout/hooks/useWorkoutSession.ts
  - src/features/workout/hooks/useSyncQueue.ts
  - app/(app)/workout/summary.tsx
autonomous: true
requirements: [quick-33]
must_haves:
  truths:
    - "Pressing Finish/End on a workout navigates to the summary screen"
    - "Completed workout session is persisted to Supabase database"
    - "If sync fails, user sees a console warning and items remain queued for retry"
  artifacts:
    - path: "src/features/workout/workoutSessionBridge.ts"
      provides: "MMKV-backed session handoff instead of module-level variable"
    - path: "src/features/workout/hooks/useWorkoutSession.ts"
      provides: "Resilient finishWorkout with error logging and fallback navigation"
  key_links:
    - from: "src/features/workout/hooks/useWorkoutSession.ts"
      to: "src/features/workout/workoutSessionBridge.ts"
      via: "setCompletedSession / getCompletedSession"
    - from: "app/(app)/workout/summary.tsx"
      to: "src/features/workout/workoutSessionBridge.ts"
      via: "getCompletedSession on mount"
---

<objective>
Fix silent failure when finishing a workout: pressing Finish does not navigate to summary screen and does not save the workout to the database.

Purpose: The finish workout flow has multiple silent failure points -- a module-level variable bridge that can lose data during HMR/re-renders, no error logging when navigation or sync fails, and swallowed sync errors that prevent database persistence.

Output: Resilient workout finish flow with MMKV-backed session handoff, error logging, and reliable navigation to summary.
</objective>

<execution_context>
@C:/Users/maser/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/maser/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@src/features/workout/workoutSessionBridge.ts
@src/features/workout/hooks/useWorkoutSession.ts
@src/features/workout/hooks/useSyncQueue.ts
@app/(app)/workout/summary.tsx
@app/(app)/workout/index.tsx
@stores/workoutStore.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Make session bridge MMKV-backed and add error logging to finishWorkout</name>
  <files>src/features/workout/workoutSessionBridge.ts, src/features/workout/hooks/useWorkoutSession.ts</files>
  <action>
**Root cause analysis:** The `workoutSessionBridge.ts` stores the completed session in a module-level `let` variable (`_completedSession`). This variable is lost during Metro HMR (hot module reload) because module re-evaluation resets it to `null`. When the summary screen mounts and calls `getCompletedSession()`, it gets `null`, so no session data is displayed and `enqueueCompletedSession` is never called (the useEffect guards on `if (!session) return`). Additionally, `finishWorkout` in useWorkoutSession has zero error logging, so any failure in the flow is completely silent.

**Fix workoutSessionBridge.ts:**
1. Import `createMMKV` from `react-native-mmkv` and create a named instance: `const bridgeStorage = createMMKV({ id: 'workout-bridge' });`
2. Replace the module-level `_completedSession` variable with MMKV-backed storage:
   - `setCompletedSession`: serialize session to JSON and store in MMKV with key `'completed_session'`
   - `getCompletedSession`: read from MMKV, parse JSON, return `WorkoutSession | null`. Wrap in try/catch returning null on parse failure.
   - `clearCompletedSession`: remove the key from MMKV
3. Keep the `_isFinishing` flag as a module-level variable (it only needs to survive within a single navigation transition, not across HMR).

**Fix useWorkoutSession.ts finishWorkout:**
1. Wrap the entire `finishWorkout` body in a try/catch. In the catch block:
   - `console.error('finishWorkout failed:', error);`
   - `setIsFinishing(false);`
   - Show `Alert.alert('Error', 'Failed to save workout. Please try again.');`
2. After `router.replace('/workout/summary' as any)`, add a safety timeout fallback. After the replace call, add:
   ```ts
   // Safety fallback: if navigation doesn't fire within 500ms, force it
   setTimeout(() => {
     if (isWorkoutFinishing()) {
       console.warn('finishWorkout: navigation may have stalled, retrying');
       router.replace('/workout/summary' as any);
     }
   }, 500);
   ```
3. Add `console.log` statements at key points for debugging: before `finishSessionAction()`, after it returns (log whether completed is truthy), and before `router.replace`.
  </action>
  <verify>
    <automated>npx tsc --noEmit --pretty 2>&1 | head -30</automated>
  </verify>
  <done>Bridge uses MMKV for completed session persistence (survives HMR). finishWorkout has try/catch with user-visible error alert and console logging at every step. Navigation has a 500ms retry fallback.</done>
</task>

<task type="auto">
  <name>Task 2: Add sync queue error logging and ensure summary screen handles null session gracefully</name>
  <files>src/features/workout/hooks/useSyncQueue.ts, app/(app)/workout/summary.tsx</files>
  <action>
**Fix useSyncQueue.ts flushSyncQueue:**
1. In the `for` loop where items are processed, when an error occurs (`if (error)`), add: `console.warn('Sync queue: failed to sync item to', item.table, ':', error.message ?? error);`
2. This ensures sync failures are visible in the console/logs instead of being completely silent.

**Fix summary.tsx to handle edge cases:**
1. In the `useEffect` that enqueues and flushes, add error handling around `enqueueCompletedSession(session)`:
   ```ts
   try {
     enqueueCompletedSession(session);
   } catch (err) {
     console.error('Failed to enqueue session for sync:', err);
   }
   ```
2. In the `flushSyncQueue(supabase).catch(...)`, change to log the error: `.catch((err) => console.warn('Flush sync queue failed:', err));`
3. In the `handleDone` function, after `clearCompletedSession()`, add a check: if `router.dismissAll` throws or the navigation stack is empty, fall back to `router.replace('/(app)/(tabs)/dashboard')`:
   ```ts
   const handleDone = () => {
     clearCompletedSession();
     try {
       router.dismissAll();
     } catch {
       router.replace('/(app)/(tabs)/dashboard' as any);
     }
   };
   ```
  </action>
  <verify>
    <automated>npx tsc --noEmit --pretty 2>&1 | head -30</automated>
  </verify>
  <done>Sync queue failures are logged to console with table name and error message. Summary screen has error handling around enqueue and navigation. All silent failure points now produce visible console output.</done>
</task>

</tasks>

<verification>
1. TypeScript compiles without errors: `npx tsc --noEmit`
2. Start a workout (plan-based or freestyle), immediately press End/Finish
3. Verify navigation to summary screen occurs
4. Check Supabase database for the workout_sessions entry
5. Check console for any error/warning logs from the new logging
</verification>

<success_criteria>
- Finishing a workout always navigates to the summary screen (no silent failure)
- Completed session data survives HMR / module re-evaluation via MMKV bridge
- Workout data is persisted to Supabase (or sync failures are logged visibly)
- No silent swallowing of errors anywhere in the finish flow
</success_criteria>

<output>
After completion, create `.planning/quick/33-starting-a-workout-and-clicking-finish-d/33-SUMMARY.md`
</output>
