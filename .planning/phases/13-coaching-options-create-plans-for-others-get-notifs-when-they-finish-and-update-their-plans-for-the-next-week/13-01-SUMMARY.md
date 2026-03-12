---
phase: 13-coaching-options
plan: 01
subsystem: database, types, notifications
tags: [supabase, rls, push-notifications, expo-notifications, coaching]

requires:
  - phase: 01-foundation
    provides: Supabase client, auth store, Zustand + MMKV patterns
  - phase: 03-plan-builder
    provides: workout_plans, plan_days, plan_day_exercises tables and Plan types
  - phase: 08-alarms
    provides: expo-notifications infrastructure already installed
provides:
  - Coaching database schema (4 tables + helper function + plan extension)
  - TypeScript types for all coaching entities
  - Push token registration utility and hook
  - Invite code generation utility
affects: [13-02, 13-03, 13-04, 13-05]

tech-stack:
  added: []
  patterns:
    - "is_coach_of() SECURITY DEFINER helper for DRY RLS policies"
    - "as-any pattern for Supabase tables not yet in generated types"
    - "Non-blocking push token registration (try/catch, returns null on failure)"

key-files:
  created:
    - supabase/migrations/20260317000001_create_coaching.sql
    - src/features/coaching/types.ts
    - src/features/coaching/utils/inviteCode.ts
    - src/features/notifications/utils/pushTokenRegistration.ts
    - src/features/notifications/hooks/usePushToken.ts
  modified:
    - src/features/plans/types.ts
    - src/features/plans/hooks/usePlans.ts
    - tests/coaching/inviteCode.test.ts
    - tests/plans/plan-crud.test.ts
    - tests/plans/plan-store.test.ts
    - tests/dashboard/todays-workout.test.ts
    - tests/alarms/alarmScheduler.test.ts
    - tests/alarms/nudgeCancel.test.ts

key-decisions:
  - "Used as-any for push_tokens upsert since table not in generated Supabase types yet"
  - "coach_id defaults to null for backward compatibility with existing plans"

patterns-established:
  - "is_coach_of() helper for all coach RLS policies"
  - "Push token registration as non-blocking fire-and-forget"

requirements-completed: [COACH-01, COACH-02, COACH-03, COACH-04]

duration: 5min
completed: 2026-03-12
---

# Phase 13 Plan 01: Coaching Foundation Summary

**Coaching DB schema with 4 tables, 25 RLS policies, is_coach_of() helper, Plan coach_id extension, push token registration, and invite code generation**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-12T19:27:39Z
- **Completed:** 2026-03-12T19:33:00Z
- **Tasks:** 2
- **Files modified:** 13

## Accomplishments
- Complete coaching database migration with push_tokens, invite_codes, coaching_relationships, and coach_notes tables
- 25 RLS policies covering coach access to plans, workout data, profiles, and plan sub-tables
- TypeScript types mirroring DB schema for all coaching entities
- Push token registration infrastructure (utility + hook) ready for physical devices
- Invite code generation with unambiguous 6-character alphanumeric codes (5 unit tests passing)

## Task Commits

Each task was committed atomically:

1. **Task 1: Database migration for coaching system** - `61ea801` (feat)
2. **Task 2: TypeScript types and push token infrastructure** - `f231d5a` (feat)

## Files Created/Modified
- `supabase/migrations/20260317000001_create_coaching.sql` - Full coaching schema: 4 tables, helper function, plan extension, 25 RLS policies
- `src/features/coaching/types.ts` - CoachingRelationship, InviteCode, CoachNote, TraineeProfile types
- `src/features/coaching/utils/inviteCode.ts` - 6-char alphanumeric code generator with 24h expiry constant
- `src/features/notifications/utils/pushTokenRegistration.ts` - Expo push token registration with Supabase upsert
- `src/features/notifications/hooks/usePushToken.ts` - Auto-registration hook using authStore userId
- `src/features/plans/types.ts` - Added coach_id: string | null to Plan and PlanSummary interfaces
- `src/features/plans/hooks/usePlans.ts` - Added coach_id to PlanSummary mapping
- `tests/coaching/inviteCode.test.ts` - 5 unit tests for invite code generation
- `tests/{plans,dashboard,alarms}/*.test.ts` - Added coach_id: null to existing test helpers

## Decisions Made
- Used `as any` for Supabase `push_tokens` table access since the table is not yet in generated types (consistent with existing project convention)
- coach_id field set as `string | null` with null default for backward compatibility with all existing plans

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed existing test helpers missing coach_id field**
- **Found during:** Task 2 (after adding coach_id to Plan interface)
- **Issue:** 6 test files had Plan/PlanDay factory helpers that became type-incompatible with the new required coach_id field
- **Fix:** Added `coach_id: null` to all affected test helper functions
- **Files modified:** tests/plans/plan-crud.test.ts, tests/plans/plan-store.test.ts, tests/dashboard/todays-workout.test.ts, tests/alarms/alarmScheduler.test.ts, tests/alarms/nudgeCancel.test.ts
- **Verification:** TypeScript compilation passes for all modified files
- **Committed in:** f231d5a (Task 2 commit)

**2. [Rule 1 - Bug] Fixed incorrect Supabase import path**
- **Found during:** Task 2 (pushTokenRegistration.ts)
- **Issue:** Used `@/services/supabase` but project convention is `@/lib/supabase/client`
- **Fix:** Changed import to `@/lib/supabase/client`
- **Files modified:** src/features/notifications/utils/pushTokenRegistration.ts
- **Verification:** TypeScript compilation passes
- **Committed in:** f231d5a (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both fixes necessary for correctness. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Database schema ready for all coaching features (Plans 02-05)
- TypeScript types available for hook and component development
- Push token infrastructure ready for Edge Function integration (Plan 02)
- Invite code utility ready for useCoaching hook (Plan 03)

---
*Phase: 13-coaching-options*
*Completed: 2026-03-12*
