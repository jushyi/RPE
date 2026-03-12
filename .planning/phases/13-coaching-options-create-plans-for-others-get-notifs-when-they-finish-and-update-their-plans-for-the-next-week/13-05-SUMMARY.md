---
phase: 13-coaching-options
plan: 05
subsystem: notifications, api
tags: [push-notifications, expo-push, edge-function, deno, coaching, cron, supabase]

requires:
  - phase: 13-coaching-options plan 02
    provides: send-push Edge Function for dispatching Expo push notifications
  - phase: 13-coaching-options plan 04
    provides: useCoachPlans hook for coach plan CRUD
provides:
  - Notification utilities for workout completion, PR, and plan update triggers
  - Weekly coaching summary Edge Function with adherence aggregation
  - Push token registration on app startup
affects: []

tech-stack:
  added: []
  patterns:
    - "Fire-and-forget notification calls via .catch(() => {}) on all trigger points"
    - "Weekly summary Edge Function with service_role auth and direct Expo Push dispatch"
    - "pg_cron scheduling via SQL comments for manual setup"

key-files:
  created:
    - src/features/coaching/utils/notifyCoach.ts
    - src/features/coaching/utils/notifyTrainee.ts
    - supabase/functions/weekly-summary/index.ts
  modified:
    - src/features/workout/hooks/useWorkoutSession.ts
    - src/features/workout/hooks/usePRDetection.ts
    - src/features/coaching/hooks/useCoachPlans.ts
    - app/(app)/_layout.tsx

key-decisions:
  - "Weekly summary dispatches directly to Expo Push API (no nested Edge Function call to send-push)"
  - "Push token registered in app layout (top-level) for every launch after auth"

patterns-established:
  - "Coaching notification pattern: query coaching_relationships, invoke send-push, fire-and-forget"
  - "Weekly summary: service_role auth, per-coach trainee aggregation, truncated body at 200 chars"

requirements-completed: [COACH-13, COACH-14, COACH-15, COACH-16]

duration: 2min
completed: 2026-03-12
---

# Phase 13 Plan 05: Notification Triggers & Weekly Summary

**Fire-and-forget notification wiring for workout/PR/plan-update triggers plus weekly coaching adherence summary Edge Function**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-12T19:48:03Z
- **Completed:** 2026-03-12T19:50:30Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Workout completion and PR detection now notify all linked coaches via push notification
- Plan create/update by coach triggers push notification to trainee with optional note text
- Weekly summary Edge Function aggregates sessions, exercises, PRs, and adherence per trainee
- Push token registered on every app launch via usePushToken hook in app layout

## Task Commits

Each task was committed atomically:

1. **Task 1: Notification utility functions and workout/PR trigger wiring** - `0ca9bb6` (feat)
2. **Task 2: Weekly summary Edge Function** - `420ee05` (feat)

## Files Created/Modified
- `src/features/coaching/utils/notifyCoach.ts` - Notify coaches on workout completion and PR detection
- `src/features/coaching/utils/notifyTrainee.ts` - Notify trainee on plan update with optional note
- `supabase/functions/weekly-summary/index.ts` - Cron-triggered weekly adherence summary per coach
- `src/features/workout/hooks/useWorkoutSession.ts` - Added notifyCoachWorkoutComplete call in finishWorkout
- `src/features/workout/hooks/usePRDetection.ts` - Added notifyCoachPR call on PR detection
- `src/features/coaching/hooks/useCoachPlans.ts` - Added notifyTraineePlanUpdate on create/update
- `app/(app)/_layout.tsx` - Added usePushToken hook for push token registration on startup

## Decisions Made
- Weekly summary Edge Function dispatches directly to Expo Push API instead of calling send-push Edge Function (avoids nested function calls)
- Push token registration placed in app layout (top-level) so it runs on every authenticated app launch
- All notification calls use fire-and-forget pattern (try/catch with console.warn, never throw)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
External services require manual configuration per plan frontmatter:
- EXPO_ACCESS_TOKEN: Store as Supabase Edge Function secret for authenticated push dispatch
- pg_cron + pg_net: Enable extensions in Supabase Dashboard, then run the SQL schedule query from the weekly-summary comments

## Next Phase Readiness
- All notification triggers wired and functional
- Phase 13 coaching features complete (plans 00-05)
- Weekly summary requires pg_cron setup in Supabase Dashboard for automated Sunday dispatch

---
*Phase: 13-coaching-options*
*Completed: 2026-03-12*
