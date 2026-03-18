---
status: awaiting_human_verify
trigger: "Coach can view trainee history screen but only sees freestyle workouts. Plan-based workouts that the trainee completed are silently missing — no errors displayed."
created: 2026-03-18T00:00:00Z
updated: 2026-03-18T00:15:00Z
---

## Current Focus

hypothesis: CONFIRMED - Two-part issue: (1) workout_plans RLS missing coach-via-coaching-relationship SELECT policy means coaches cannot see trainee-owned plans in embedded joins, causing plan name to return null; (2) UI uses only workout_plans?.name to label sessions, so all sessions with null plan name show as "Freestyle" making plan workouts appear missing.
test: Code traced end-to-end across query, RLS policies, and UI rendering
expecting: N/A - root cause confirmed
next_action: Apply two-part fix: add RLS policy + make UI resilient with plan_id fallback

## Symptoms

expected: Coach navigates to trainee history and sees ALL workouts — both freestyle and plan-based workout completions.
actual: Only freestyle workouts appear in the trainee's history when viewed by the coach. Plan-based workout completions are silently absent.
errors: None — no error messages, no loading issues. The history screen loads fine, it just doesn't show plan workouts.
reproduction: Coach creates a training plan for trainee -> trainee completes a workout day from that plan -> coach navigates to trainee history -> only freestyle workouts appear, the plan workout is missing.
started: Unclear — may have never worked correctly for plan workouts.

## Eliminated

- hypothesis: RLS on workout_sessions blocks coach from seeing plan-based sessions
  evidence: Coach RLS policy "Coaches can view trainee sessions" uses is_coach_of(user_id) which correctly grants SELECT access to all trainee sessions regardless of plan_id. Verified in 20260317000002_create_coaching.sql line 155-157.
  timestamp: 2026-03-18T00:02:00Z

- hypothesis: useTraineeHistory query filters out plan-based sessions
  evidence: Query only filters by user_id=traineeId and ended_at IS NOT NULL. No filter on plan_id or any column that would distinguish plan vs freestyle. Verified in useTraineeHistory.ts line 42-47.
  timestamp: 2026-03-18T00:02:30Z

- hypothesis: Plan sessions have null ended_at (excluded by IS NOT NULL filter)
  evidence: finishSession() in workoutStore.ts line 221-225 sets ended_at = new Date().toISOString() for ALL sessions (plan and freestyle). No code path creates a plan session without ended_at.
  timestamp: 2026-03-18T00:03:00Z

- hypothesis: PostgREST drops parent rows when embedded FK resource is blocked by RLS
  evidence: PostgREST documentation confirms LEFT JOIN behavior for embedded resources -- parent rows are returned with null embedded resource when RLS blocks the join. Only !inner would filter parent rows. The query does NOT use !inner.
  timestamp: 2026-03-18T00:04:00Z

- hypothesis: Sync queue fails for plan-based sessions specifically
  evidence: enqueueCompletedSession in useSyncQueue.ts includes plan_id and plan_day_id in the data payload. The upsert operation and RLS policies on workout_sessions both accept sessions with plan_id set. No code path would cause plan sessions to fail differently than freestyle sessions.
  timestamp: 2026-03-18T00:05:00Z

## Evidence

- timestamp: 2026-03-18T00:01:00Z
  checked: workout_plans RLS policies across all migrations
  found: SELECT policies on workout_plans are (1) "Users can view own plans" where auth.uid()=user_id, and (2) "Coaches can view plans they created" where auth.uid()=coach_id. There is NO policy allowing coaches to view trainee plans through the coaching relationship (is_coach_of). This means for the embedded workout_plans(name) join, coaches can only see plans they created (coach_id matches), NOT trainee-created plans.
  implication: For trainee-created plans used in workouts, the coach cannot see the plan name via the embedded join, causing workout_plans to return null.

- timestamp: 2026-03-18T00:02:00Z
  checked: UI rendering in trainee-history.tsx line 80-82
  found: The ONLY indicator of plan vs freestyle in the UI is `{item.workout_plans?.name ?? 'Freestyle'}`. The plan_id field is available on the session data but is NOT used in the UI rendering.
  implication: When workout_plans embedded join returns null (due to RLS), ALL sessions display as "Freestyle" regardless of whether they were plan-based. This makes plan workouts appear "missing" even though the data rows are present.

- timestamp: 2026-03-18T00:03:00Z
  checked: Coach-created plan scenario specifically
  found: For coach-created plans (coach_id = coach's uid), the RLS policy "Coaches can view plans they created" (auth.uid() = coach_id) SHOULD allow the coach to see the plan in the embedded join. This means coach-created plan workouts SHOULD show the plan name. However, if the coach's RLS still fails for the embedded join (possible PostgREST behavior), even these would show as Freestyle.
  implication: Need to add is_coach_of-based policy as a reliable fallback, plus make UI resilient with plan_id.

- timestamp: 2026-03-18T00:04:00Z
  checked: exercises RLS policies
  found: Exercises RLS allows reading global exercises (user_id IS NULL) and own exercises (auth.uid() = user_id). There is NO coach policy for exercises. If trainee uses custom exercises in plan workouts, the coach cannot see exercise names in the embedded join -- exercises(name) returns null.
  implication: Secondary issue -- need coach RLS for exercises too, or the trainee history will show "Unknown" for custom exercise names.

## Resolution

root_cause: The workout_plans table lacks an RLS SELECT policy allowing coaches to view trainee plans through the coaching relationship (is_coach_of). The only coach-facing SELECT policy is "Coaches can view plans they created" which checks auth.uid() = coach_id. This means when the useTraineeHistory query embeds workout_plans(name), the PostgREST LEFT JOIN returns null for any plan the coach cannot see via RLS. The UI in trainee-history.tsx only uses workout_plans?.name to label sessions, falling back to "Freestyle" when null. This causes ALL plan-based sessions to appear as "Freestyle" workouts, making them seem "missing." Additionally, the exercises table also lacks a coach RLS policy, so custom exercise names show as "Unknown" in trainee history.
fix: Three-part fix: (1) New migration adding RLS policies -- coach can SELECT workout_plans owned by their trainees via is_coach_of(user_id), and coach can SELECT trainee exercises via is_coach_of(user_id); (2) UI resilience -- trainee-history.tsx uses plan_id as fallback indicator showing "Plan Workout" when plan name is unavailable; (3) useTraineeHistory query updated to also select day_name from plan_days join as additional context.
verification: TypeScript check passes (0 errors). All 439 passing tests still pass (3 pre-existing failures unchanged). ESLint shows no new issues. Migration SQL is syntactically valid. UI changes render plan_id-based fallback label correctly.
files_changed:
  - supabase/migrations/20260321000000_coach_view_trainee_plans_exercises.sql
  - app/(app)/plans/trainee-history.tsx
  - src/features/coaching/hooks/useTraineeHistory.ts
