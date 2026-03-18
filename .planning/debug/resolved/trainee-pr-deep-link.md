---
status: resolved
trigger: "Coach receives a push notification when a trainee hits a PR. Tapping the notification should deep link to that specific session in the trainee's history. Instead, it navigates to the wrong screen."
created: 2026-03-16T00:00:00Z
updated: 2026-03-18T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED and FIXED - Deep link router for pr_achieved was routing coaches to their own exercise progress chart instead of the trainee's history
test: All 11 deep link router tests pass, no regressions in full suite
expecting: User confirms the fix works end-to-end in real environment
next_action: Await human verification

## Symptoms

expected: When coach taps the PR notification for a trainee, the app should navigate to that specific workout session in the trainee's history screen.
actual: The app opens but navigates to the wrong screen (not the trainee's session).
errors: No specific error messages reported.
reproduction: Coach receives PR notification for trainee on production build, taps it, lands on wrong screen.
started: Not sure if it ever worked correctly.

## Eliminated

## Evidence

- timestamp: 2026-03-16T00:00:30Z
  checked: src/features/notifications/utils/deepLinkRouter.ts (line 13)
  found: pr_achieved case routes to `/(app)/progress/${data.exercise_id}` - the coach's OWN exercise progress chart, not the trainee's session
  implication: This is the wrong destination entirely. Coach tapping a trainee's PR notification sees their own progress chart for that exercise (or empty data if they don't track it)

- timestamp: 2026-03-16T00:00:35Z
  checked: src/features/coaching/utils/notifyCoach.ts (notifyCoachPR, lines 48-78)
  found: The PR notification payload sends { type: 'pr_achieved', trainee_id, exercise_id, exercise_name } but does NOT include trainee_name. The trainee_id is sent but completely ignored by the deep link router.
  implication: The trainee_id was already available in the payload but never used for routing.

- timestamp: 2026-03-16T00:00:40Z
  checked: src/features/workout/hooks/usePRDetection.ts (line 144)
  found: notifyCoachPR is called with (userId, userName, exerciseName, exerciseId) - no session_id parameter exists. PR detection fires mid-workout before session is finalized, so no session_id is available yet.
  implication: Cannot deep link to a specific session from PR notification. Best alternative is the trainee's history list.

- timestamp: 2026-03-16T00:00:45Z
  checked: app/(app)/plans/trainee-history.tsx
  found: Trainee history screen exists at /(app)/plans/trainee-history and accepts traineeId + traineeName as search params. This is the coach view of a trainee's workout history.
  implication: The correct deep link target for a coach tapping a trainee's PR should navigate here.

- timestamp: 2026-03-16T00:00:50Z
  checked: src/features/notifications/types.ts
  found: NotificationData type includes trainee_id field but not trainee_name.
  implication: Need to add trainee_name to type and payload.

- timestamp: 2026-03-16T00:01:30Z
  checked: Test suite run (npx jest --no-coverage)
  found: 11/11 deep link router tests pass (including 2 new coach-context tests). 2 pre-existing failures in sync-queue.test.ts and csvExport.test.ts are unrelated to this change.
  implication: Fix is verified at unit test level, no regressions introduced.

## Resolution

root_cause: The deep link router in deepLinkRouter.ts treated all pr_achieved notifications identically, routing them to `/(app)/progress/${exercise_id}` -- the current user's own exercise progress chart. When a coach taps a PR notification for a trainee, the trainee_id in the payload was ignored, so the coach was shown their own progress data (or an empty chart) instead of the trainee's workout history. Additionally, trainee_name was not included in the notification payload, so even with correct routing, the trainee history screen couldn't display the trainee's name.

fix: Three-part fix:
1. deepLinkRouter.ts: When pr_achieved has a trainee_id (coach context), route to /(app)/plans/trainee-history?traineeId=...&traineeName=... instead of the progress chart. Without trainee_id (trainee's own context), keep existing progress chart route.
2. notifyCoach.ts: Added trainee_name to the PR notification data payload so the trainee history screen can display the name.
3. types.ts: Added trainee_name as optional field to NotificationData interface.

verification: 11/11 unit tests pass including 2 new tests for coach context routing. No regressions in 61/63 test suites (2 pre-existing failures unrelated).

files_changed:
- src/features/notifications/utils/deepLinkRouter.ts
- src/features/coaching/utils/notifyCoach.ts
- src/features/notifications/types.ts
- tests/notifications/deepLinkRouter.test.ts
