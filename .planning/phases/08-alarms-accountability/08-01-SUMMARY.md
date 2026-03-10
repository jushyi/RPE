---
phase: 08-alarms-accountability
plan: 01
subsystem: notifications
tags: [expo-notifications, expo-device, datetimepicker, alarms, zustand, mmkv]

requires:
  - phase: 03-plan-builder
    provides: PlanDay type and plan structure
provides:
  - Alarm data layer (migration, types, constants, utils)
  - Notification infrastructure (permissions, channels, categories)
  - Alarm scheduler (schedule/cancel weekly alarms and nudges)
  - AlarmStore with MMKV persistence
  - Jest mocks for expo-notifications, expo-device, datetimepicker
affects: [08-02, 08-03]

tech-stack:
  added: [expo-notifications, expo-device, "@react-native-community/datetimepicker"]
  patterns: [deterministic notification IDs from plan_day_id, weekday conversion formula]

key-files:
  created:
    - supabase/migrations/20260315000001_add_alarm_columns_to_plan_days.sql
    - src/features/alarms/types.ts
    - src/features/alarms/constants.ts
    - src/features/alarms/utils/notificationIds.ts
    - src/features/alarms/utils/weekdayConversion.ts
    - src/features/alarms/utils/nudgeMessages.ts
    - src/features/alarms/utils/notificationSetup.ts
    - src/features/alarms/hooks/useAlarmScheduler.ts
    - src/stores/alarmStore.ts
    - tests/__mocks__/expo-notifications.ts
    - tests/__mocks__/expo-device.ts
    - tests/__mocks__/@react-native-community/datetimepicker.js
  modified:
    - jest.config.js
    - src/features/plans/types.ts

key-decisions:
  - "Migration timestamp adjusted to 20260315000001 to avoid collision with existing 20260315000000"
  - "Alarm scheduler exported as pure async functions (not a React hook) for testability"
  - "Nudge messages use no emojis per CLAUDE.md project convention"

patterns-established:
  - "Deterministic notification IDs: alarm_{planDayId} and nudge_{planDayId}"
  - "Weekday conversion formula: ((weekday + 1) % 7) + 1 for plan-to-expo mapping"
  - "Snooze handler pattern: one-shot timeInterval trigger on SNOOZE action"

requirements-completed: [ALRM-01, ALRM-02]

duration: 3min
completed: 2026-03-10
---

# Phase 08 Plan 01: Alarm Data Layer Summary

**Alarm scheduling infrastructure with expo-notifications, deterministic IDs, weekday conversion, nudge messages, and 30 passing unit tests**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-10T20:28:51Z
- **Completed:** 2026-03-10T20:32:18Z
- **Tasks:** 2
- **Files modified:** 23

## Accomplishments
- Migration adds alarm_time and alarm_enabled columns to plan_days table
- Pure utility functions: deterministic notification IDs, weekday conversion, nudge message pool
- Notification setup: permission requests, Android channels (alarm MAX + nudge HIGH), alarm category with Snooze/Dismiss
- Alarm scheduler: schedule/cancel weekly alarms and nudges, sync active plan alarms
- AlarmStore with Zustand + MMKV for pause toggle persistence
- 30 unit tests passing across 6 test files with zero regressions (239 total)

## Task Commits

Each task was committed atomically:

1. **Task 1: Install deps, migration, types, pure utils, Jest mocks, and unit tests** - `02ac13d` (feat)
2. **Task 2: Notification setup, alarm scheduler hook, alarm store, and integration tests** - `98b6884` (feat)

## Files Created/Modified
- `supabase/migrations/20260315000001_add_alarm_columns_to_plan_days.sql` - Alarm columns on plan_days
- `src/features/alarms/types.ts` - AlarmConfig and AlarmState interfaces
- `src/features/alarms/constants.ts` - Channel IDs, category ID, snooze/nudge timing
- `src/features/alarms/utils/notificationIds.ts` - Deterministic alarm/nudge ID generation
- `src/features/alarms/utils/weekdayConversion.ts` - Plan weekday to expo weekday conversion
- `src/features/alarms/utils/nudgeMessages.ts` - Nudge message pool with random selection
- `src/features/alarms/utils/notificationSetup.ts` - Permissions, channels, categories
- `src/features/alarms/hooks/useAlarmScheduler.ts` - Schedule/cancel/sync alarm functions
- `src/stores/alarmStore.ts` - MMKV-persisted pause state
- `src/features/plans/types.ts` - PlanDay extended with alarm_time and alarm_enabled
- `jest.config.js` - Added mock entries for notification libraries
- `tests/__mocks__/expo-notifications.ts` - Full expo-notifications mock
- `tests/__mocks__/expo-device.ts` - Device mock (isDevice = true)
- `tests/__mocks__/@react-native-community/datetimepicker.js` - DateTimePicker mock
- `tests/alarms/notificationIds.test.ts` - ID generation tests
- `tests/alarms/weekdayConversion.test.ts` - All 7 weekday conversions tested
- `tests/alarms/nudgeMessages.test.ts` - Message pool and placeholder tests
- `tests/alarms/alarmScheduler.test.ts` - Schedule/cancel/sync integration tests
- `tests/alarms/notificationSetup.test.ts` - Permission/channel/category tests
- `tests/alarms/snoozeHandler.test.ts` - Snooze and dismiss action tests

## Decisions Made
- Migration timestamp adjusted to 20260315000001 to avoid collision with existing body_measurements migration
- Alarm scheduler exported as pure async functions rather than a React hook for better testability
- Nudge messages written without emojis per CLAUDE.md project convention
- Nudge scheduling handles hour overflow past midnight by advancing weekday

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Migration filename collision**
- **Found during:** Task 1
- **Issue:** Plan specified `20260315000000` but that timestamp is already used by `create_body_measurements.sql`
- **Fix:** Used `20260315000001` instead
- **Files modified:** supabase/migrations/20260315000001_add_alarm_columns_to_plan_days.sql
- **Verification:** File exists with correct content

**2. [Rule 2 - Missing Critical] Added SchedulableTriggerInputTypes and AndroidNotificationPriority to mock**
- **Found during:** Task 2
- **Issue:** expo-notifications mock lacked enums used by scheduler
- **Fix:** Added both enum mocks to tests/__mocks__/expo-notifications.ts
- **Verification:** All alarm tests pass

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 missing critical)
**Impact on plan:** Both fixes necessary for correctness. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Alarm data layer complete, ready for Plan 02 to wire into plan builder UI
- All scheduling functions tested and available for integration
- PlanDay type already extended with alarm fields

---
*Phase: 08-alarms-accountability*
*Completed: 2026-03-10*
