---
phase: 16-push-notifications
plan: 01
subsystem: notifications
tags: [zustand, mmkv, supabase, expo-notifications, deep-link, typescript]

requires:
  - phase: 08-alarms-nudges
    provides: expo-notifications mock and alarm infrastructure already in place
  - phase: 13-coaching
    provides: push token registration utilities, Supabase as-any pattern for untyped tables

provides:
  - Supabase notifications table with RLS (SELECT/UPDATE own records)
  - NotificationType union and NotificationData/NotificationRecord TypeScript types
  - getDeepLinkRoute maps all 6 notification types to Expo Router paths
  - NOTIFICATION_ICONS maps types to Ionicons name + color
  - relativeTime utility for human-readable timestamps
  - useNotificationStore with Zustand+MMKV persistence and full CRUD
  - Wave 0 test stubs: deepLinkRouter, relativeTime, notificationTypes, bellBadge, notificationStore

affects:
  - 16-02 (inbox UI, BellBadge, deep link handler depend on all exports from this plan)

tech-stack:
  added: []
  patterns:
    - "fire-and-forget Supabase sync using async IIFE (void async () => {...}()) instead of .then().catch() chain"
    - "refreshUnreadCount as local computation from notifications array (no Supabase round-trip for local-only refresh)"

key-files:
  created:
    - supabase/migrations/20260318000000_create_notifications.sql
    - src/features/notifications/types.ts
    - src/features/notifications/utils/deepLinkRouter.ts
    - src/features/notifications/utils/notificationTypes.ts
    - src/features/notifications/utils/relativeTime.ts
    - src/stores/notificationStore.ts
    - tests/notifications/deepLinkRouter.test.ts
    - tests/notifications/relativeTime.test.ts
    - tests/notifications/notificationTypes.test.ts
    - tests/notifications/bellBadge.test.ts
    - tests/notifications/notificationStore.test.ts
  modified:
    - tests/__mocks__/expo-notifications.ts

key-decisions:
  - "Used async IIFE pattern (void async () => {...}()) for fire-and-forget Supabase calls in synchronous store actions — avoids .then() not being a function on the mock chain object"
  - "refreshUnreadCount computed locally from notifications array (no Supabase round-trip) — consistent with plan spec and simpler"
  - "addLocalNotification generates UUID client-side with timestamp+random suffix — avoids expo-crypto dependency"

patterns-established:
  - "Notification store: async IIFE for fire-and-forget Supabase syncs in synchronous Zustand actions"

requirements-completed: [NOTIF-01, NOTIF-03, NOTIF-04]

duration: 4min
completed: 2026-03-13
---

# Phase 16 Plan 01: Notification Data Layer Summary

**Supabase notifications table with RLS, TypeScript types, deep link router, relative time utility, and Zustand+MMKV notification store — all 6 notification types covered, 29 tests passing**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-13T18:28:33Z
- **Completed:** 2026-03-13T18:32:17Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments
- Supabase `notifications` table with composite index and RLS (users can only read/update their own records)
- All 6 notification types (workout_complete, pr_achieved, plan_update, weekly_summary, alarm, nudge) typed and covered by deep link router and icon mapping
- `useNotificationStore` provides fetchNotifications, markAsRead, markAllRead, refreshUnreadCount, addLocalNotification with MMKV persistence
- `markAllRead` correctly sets `read = true` (not false) and calls `setBadgeCountAsync(0)`
- Wave 0 test stubs for bellBadge (will activate in Plan 02 when BellBadge component is created)

## Task Commits

1. **Task 1: Migration, types, and utility functions** - `cbe70b7` (feat)
2. **Task 2: Notification store (Zustand + MMKV)** - `c42d422` (feat)

## Files Created/Modified
- `supabase/migrations/20260318000000_create_notifications.sql` - notifications table with RLS and composite index
- `src/features/notifications/types.ts` - NotificationType union, NotificationData, NotificationRecord interfaces
- `src/features/notifications/utils/deepLinkRouter.ts` - getDeepLinkRoute maps type+data to Expo Router path
- `src/features/notifications/utils/notificationTypes.ts` - NOTIFICATION_ICONS with Ionicons names and theme colors
- `src/features/notifications/utils/relativeTime.ts` - human-readable relative timestamp formatter
- `src/stores/notificationStore.ts` - Zustand+MMKV store with all CRUD operations
- `tests/notifications/deepLinkRouter.test.ts` - 9 tests for all routing cases
- `tests/notifications/relativeTime.test.ts` - 7 tests for all time ranges
- `tests/notifications/notificationTypes.test.ts` - 5 tests for icon mapping
- `tests/notifications/bellBadge.test.ts` - 6 todo stubs (Wave 0 compliance for Plan 02)
- `tests/notifications/notificationStore.test.ts` - 8 tests for store actions
- `tests/__mocks__/expo-notifications.ts` - Added setBadgeCountAsync mock

## Decisions Made
- Used async IIFE pattern `void (async () => { await supabase... })()` for fire-and-forget Supabase calls in synchronous Zustand actions — the test mock's chained methods don't expose `.then()` so the old `.then().catch()` pattern fails in tests
- `refreshUnreadCount` computed locally from the in-memory notifications array rather than making a Supabase round-trip — avoids async complexity and aligns with plan spec
- Local notification IDs generated via timestamp+random string rather than UUID v4 library to avoid adding a dependency

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Supabase fire-and-forget pattern for test compatibility**
- **Found during:** Task 2 (notification store tests)
- **Issue:** Store used `.then().catch()` chaining on Supabase query results; Jest mock's `mockReturnThis()` chain doesn't expose `.then()`, causing "TypeError: .then is not a function" in 7 of 8 tests
- **Fix:** Replaced all `.then().catch()` chains with `void (async () => { try { await ... } catch {} })()` pattern
- **Files modified:** `src/stores/notificationStore.ts`
- **Verification:** 8/8 notificationStore tests pass
- **Committed in:** `c42d422`

---

**Total deviations:** 1 auto-fixed (Rule 1 bug)
**Impact on plan:** Required for test correctness. The async IIFE pattern is also cleaner in production. No scope creep.

## Issues Encountered
- Pre-existing test failure in `tests/settings/csvExport.test.ts` (expects "Hips" column header, but Phase 15 migration replaced Hips with Biceps/Quad). Out of scope — not caused by this plan's changes. Logged as deferred.

## Next Phase Readiness
- All types, utilities, and store exported from their expected module paths — Plan 02 can import immediately
- bellBadge.test.ts stubs ready to be activated once `formatBadgeCount` is implemented in Plan 02
- notificationStore is ready for integration with inbox UI and bell badge in Plan 02

---
*Phase: 16-push-notifications*
*Completed: 2026-03-13*
