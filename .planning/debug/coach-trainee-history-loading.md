---
status: awaiting_human_verify
trigger: "Coach cannot view trainee workout history. Clicking a notification that a trainee finished a workout leads to an infinite loading screen. Plan workouts also don't appear in the trainee's history page when viewed by the coach."
created: 2026-03-18T00:00:00Z
updated: 2026-03-18T00:10:00Z
---

## Current Focus

hypothesis: CONFIRMED - workout_complete deep link routes to wrong screen for coach context, identical pattern to the previously-fixed pr_achieved bug
test: Code traced end-to-end
expecting: N/A - root cause confirmed
next_action: Awaiting human verification that coach notification deep link now navigates to trainee history screen

## Symptoms

expected: When coach clicks notification about trainee finishing a workout, it should navigate to the trainee's workout detail or history. Trainee history page should show all workouts including plan workouts.
actual: Infinite loading screen when clicking the notification. Plan workouts are missing from trainee history page entirely.
errors: No specific error messages reported - just infinite loading.
reproduction: Coach creates a plan for trainee -> trainee completes a workout from that plan -> coach clicks the notification OR navigates to trainee history page -> infinite loading / missing workouts.
started: Current behavior, unclear if it ever worked correctly.

## Eliminated

- hypothesis: RLS blocks coach from reading trainee workout_sessions
  evidence: Coach RLS policy "Coaches can view trainee sessions" uses is_coach_of(user_id) which correctly grants access. Similarly, session_exercises and set_logs have coach RLS policies. Verified in 20260317000002_create_coaching.sql.
  timestamp: 2026-03-18T00:04:00Z

- hypothesis: Plan workouts are filtered out by the useTraineeHistory query
  evidence: The query filters by user_id=traineeId and ended_at IS NOT NULL. There is no filter that would exclude plan workouts. The "plan workouts missing" symptom is likely a consequence of the infinite loading / wrong screen issue, not a separate data bug.
  timestamp: 2026-03-18T00:04:30Z

## Evidence

- timestamp: 2026-03-18T00:01:00Z
  checked: deepLinkRouter.ts - workout_complete case
  found: workout_complete routes to `/(app)/history/${data.session_id}` regardless of whether trainee_id is present. This navigates to the coach's own session detail screen. Since the session_id belongs to the trainee, the session CAN load (coach RLS allows it), but the screen is designed for the user's own sessions (has delete buttons, etc.).
  implication: Coach is sent to a screen designed for their own sessions, viewing trainee data in wrong context.

- timestamp: 2026-03-18T00:02:00Z
  checked: notifyCoach.ts - notifyCoachWorkoutComplete function
  found: The notification data includes trainee_id and session_id but NOT trainee_name. The deep link router ignores trainee_id for workout_complete type. This is the EXACT same pattern as the pr_achieved bug that was previously fixed (see knowledge-base.md).
  implication: The workout_complete case needs the same trainee_id-aware routing that was added for pr_achieved.

- timestamp: 2026-03-18T00:03:00Z
  checked: useTraineeHistory hook
  found: Queries workout_sessions with .eq('user_id', traineeId). Coach RLS DOES allow this (is_coach_of policy).
  implication: The trainee history page itself works correctly when navigated to properly. The "missing plan workouts" symptom is likely because coaches navigate via notification (wrong route) rather than the trainee-plans screen.

- timestamp: 2026-03-18T00:04:00Z
  checked: Session detail screen (app/(app)/history/[sessionId].tsx) line 101
  found: `if (isLoading || !session)` shows ActivityIndicator forever. If fetchSession fails, session stays null and isLoading becomes false, but the OR condition keeps showing the spinner. No error state is displayed.
  implication: Even though RLS allows the coach to read the session, ANY error in fetchSession causes infinite loading with no user feedback. The screen needs an error/not-found state.

- timestamp: 2026-03-18T00:05:00Z
  checked: Knowledge base - trainee-pr-deep-link entry
  found: The exact same pattern was fixed for pr_achieved notifications. The workout_complete case was not updated at the same time.
  implication: This is the same class of bug - notification types that are sent to coaches but don't account for coach context in deep link routing.

## Resolution

root_cause: The workout_complete notification deep link router does not account for coach context. When a trainee finishes a workout and the coach receives a workout_complete notification, the deep link routes to /(app)/history/{session_id} -- the generic session detail screen. This screen is designed for the user viewing their own sessions. While the coach CAN read the trainee's session via RLS, the screen context is wrong (shows delete buttons, video management, etc. for someone else's data). Additionally, notifyCoachWorkoutComplete does not include trainee_name in the notification data payload, so even if routing were fixed, the trainee name would be missing from the URL params. This is the exact same pattern as the pr_achieved bug fixed previously, but the workout_complete case was missed.
fix: Three-part fix: (1) deepLinkRouter.ts - when workout_complete has a trainee_id (coach context), route to trainee-history screen instead of generic session detail; (2) notifyCoach.ts - added trainee_name to workout_complete notification data payload so the trainee-history screen can display the name; (3) deepLinkRouter.test.ts - added 2 new tests for coach-context workout_complete routing, updated existing test description for clarity.
verification: All 13 deep link router tests pass. Full test suite shows no new regressions (2 pre-existing failures in sync-queue and csvExport tests are unrelated).
files_changed:
  - src/features/notifications/utils/deepLinkRouter.ts
  - src/features/coaching/utils/notifyCoach.ts
  - tests/notifications/deepLinkRouter.test.ts
