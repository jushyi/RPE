---
status: awaiting_human_verify
trigger: "plan-workout-session-not-saved: When a trainee completes a workout day from a coach-created plan, no workout_session record is created in the database."
created: 2026-03-18T00:00:00Z
updated: 2026-03-18T01:30:00Z
---

## Current Focus

hypothesis: CONFIRMED - The sync queue silently fails on FK violations when plan_day_id references a deleted plan_day. The coach plan edit flow deletes and recreates plan_days with new UUIDs. Any in-flight or pending workout sync with old plan_day_id hits a FK violation and loops forever in the failed queue.
test: All 47 workout tests pass including new FK-violation-retry tests and plan session e2e flow test.
expecting: User verification that the fix resolves the issue in production.
next_action: Await human verification of the fix in a real environment.

## Symptoms

expected: When a trainee completes a workout day from a plan, a workout_session record should be created with plan_id and plan_day_id set, along with session_exercises and set_logs.
actual: After trainee completed a plan day, there is NO workout_session record with a plan_id in the database. The only session that exists is a freestyle one (plan_id=null). The plan workout was never persisted.
errors: No errors reported -- the completion appears to work from the trainee's perspective but the data never reaches the database.
reproduction: Trainee opens a plan day -> does the workout -> completes it -> no session record is created in workout_sessions table.
started: Possibly never worked -- first time plan workout completion has been tested end-to-end with real users.

## Eliminated

- hypothesis: Client-side code doesn't pass plan_id/plan_day_id through the flow
  evidence: Full e2e test (tests/workout/plan-session-e2e.test.ts) confirms plan_id and plan_day_id survive startPlanSession -> logSet -> finishSession -> enqueueCompletedSession. All assertions pass.
  timestamp: 2026-03-18T00:30:00Z

- hypothesis: RLS policy blocks trainee INSERT on workout_sessions with plan_id
  evidence: The INSERT policy is simply `auth.uid() = user_id`. Trainee inserts with their own user_id. FK constraints are checked at DB level (not RLS). Plan and plan_day exist.
  timestamp: 2026-03-18T00:35:00Z

- hypothesis: The startFromPlan callback is not wired correctly in PlanDaySection
  evidence: Line 275 of [id].tsx: `onStartWorkout={plan.coach_id === userId ? undefined : startFromPlan}`. For trainee Jhune (not the coach), this passes startFromPlan. Button is visible and functional.
  timestamp: 2026-03-18T00:40:00Z

## Evidence

- timestamp: 2026-03-18T00:20:00Z
  checked: workoutStore.startPlanSession and finishSession
  found: Both correctly handle plan_id and plan_day_id. startPlanSession reads from planDay.plan_id/planDay.id. finishSession spreads activeSession preserving all fields. Tests confirm.
  implication: The store layer is correct.

- timestamp: 2026-03-18T00:25:00Z
  checked: useSyncQueue.enqueueCompletedSession
  found: Correctly extracts plan_id and plan_day_id from session and includes them in the workout_sessions sync item data. E2e test confirms.
  implication: The enqueue layer is correct.

- timestamp: 2026-03-18T00:30:00Z
  checked: useSyncQueue.flushSyncQueue error handling
  found: On DB error, the item is pushed to `failed` array and only a console.warn is logged. The user never sees the error. Failed items are retried on next flush but will keep failing if the underlying cause persists.
  implication: If the DB rejects the insert (e.g., FK violation), the session silently fails to persist forever.

- timestamp: 2026-03-18T00:35:00Z
  checked: usePlanDetail.updatePlan (lines 73-123)
  found: Plan editing DELETES ALL plan_days (cascade deletes plan_day_exercises too) and reinserts them with NEW UUIDs. If a trainee has an in-progress workout or pending sync with old plan_day_id, the FK reference becomes invalid.
  implication: This is the root design flaw. Coach editing a plan invalidates all in-flight plan_day_id references.

- timestamp: 2026-03-18T00:40:00Z
  checked: RLS policies on workout_sessions, session_exercises, set_logs
  found: All policies correctly allow trainee to INSERT/UPDATE their own data. No blocking policies for plan-based sessions specifically.
  implication: RLS is not the blocker.

- timestamp: 2026-03-18T00:45:00Z
  checked: Sync queue test assertion (tests/workout/sync-queue.test.ts:208)
  found: Test asserts operation is 'insert' but actual code uses 'upsert'. Test is out of date.
  implication: Test needs updating (fixed).

- timestamp: 2026-03-18T01:00:00Z
  checked: Full test suite after fix applied
  found: All 47 workout tests pass, including 2 new FK-retry tests and 2 new plan-session e2e tests.
  implication: Fix is correct and does not regress existing behavior.

## Resolution

root_cause: Two-part issue. (1) The sync queue's flushSyncQueue silently swallows DB errors (FK violations, etc.) with only a console.warn. When a workout_sessions upsert fails due to a stale plan_day_id (referencing a deleted plan_day), the entire session and all its exercises/sets remain stuck in the failed queue forever. The user sees "Workout Complete" but the data never reaches the database. (2) The plan editing flow in usePlanDetail.updatePlan deletes and recreates all plan_days with new UUIDs on every save, which invalidates any in-flight plan_day_id references from active or pending workout sessions.
fix: Three-part fix: (A) Added FK-violation detection in flushSyncQueue -- when a workout_sessions upsert fails with a FK violation, automatically retries with plan_id and plan_day_id set to null, ensuring the workout data is never lost even if the plan reference is stale. (B) Fixed stale test assertion in sync-queue.test.ts (expected 'insert' but actual is 'upsert'). (C) Added comprehensive tests: FK-retry success/failure tests in sync-queue.test.ts and full plan-session e2e flow test in plan-session-e2e.test.ts.
verification: All 47 tests pass across 7 test suites (workout-store, sync-queue, plan-session-e2e, workout-session-hook, pr-detection, set-logging, previous-performance).
files_changed:
  - src/features/workout/hooks/useSyncQueue.ts
  - tests/workout/sync-queue.test.ts
  - tests/workout/plan-session-e2e.test.ts
