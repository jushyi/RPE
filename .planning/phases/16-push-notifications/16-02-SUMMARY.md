---
phase: 16-push-notifications
plan: 02
subsystem: notifications
tags: [react-native, expo-notifications, deep-link, zustand, ionicons, flatlist, bell-badge]

requires:
  - phase: 16-push-notifications
    plan: 01
    provides: NotificationRecord types, notificationStore, deepLinkRouter, NOTIFICATION_ICONS, relativeTime, bellBadge test stubs

provides:
  - BellBadge component with formatBadgeCount utility (exported, tested)
  - NotificationItem, NotificationInbox, EmptyInbox UI components
  - useUnreadCount hook driving refresh-on-foreground cycle
  - Notification inbox route at /(app)/notifications
  - Cold-start deep link routing via useLastNotificationResponse
  - Foreground notification tap routing via DEFAULT_ACTION_IDENTIFIER handler
  - send-push Edge Function persists notification records per recipient
  - weekly-summary Edge Function persists notification record per coach

affects:
  - 16-03 (dev tools, if any additional notification UI needed)

tech-stack:
  added: []
  patterns:
    - "useLastNotificationResponse for cold-start deep link routing in app layout"
    - "DEFAULT_ACTION_IDENTIFIER handler for foreground notification tap routing in root layout"
    - "Fire-and-forget notification insert in Edge Functions after push delivery (try/catch wrapping)"

key-files:
  created:
    - src/features/notifications/components/BellBadge.tsx
    - src/features/notifications/components/NotificationItem.tsx
    - src/features/notifications/components/NotificationInbox.tsx
    - src/features/notifications/components/EmptyInbox.tsx
    - src/features/notifications/hooks/useUnreadCount.ts
    - app/(app)/notifications.tsx
  modified:
    - app/(app)/(tabs)/dashboard.tsx
    - app/(app)/_layout.tsx
    - app/_layout.tsx
    - supabase/functions/send-push/index.ts
    - supabase/functions/weekly-summary/index.ts
    - tests/notifications/bellBadge.test.ts

key-decisions:
  - "BellBadge reads unreadCount directly from notificationStore; useUnreadCount in dashboard drives refresh-on-foreground cycle"
  - "from('notifications' as any) pattern for Edge Function inserts (notifications table not in generated Supabase types)"
  - "Cold-start deep links handled in app/(app)/_layout.tsx via useLastNotificationResponse; foreground taps in root app/_layout.tsx"

patterns-established:
  - "Cold-start deep link: useLastNotificationResponse + getDeepLinkRoute in app layout"
  - "Foreground tap: DEFAULT_ACTION_IDENTIFIER check in root layout notification response listener"

requirements-completed: [NOTIF-01, NOTIF-02, NOTIF-04]

duration: 3min
completed: 2026-03-13
---

# Phase 16 Plan 02: Notification Inbox UI and Deep Link Routing Summary

**Bell badge in dashboard header with full notification inbox, deep link routing from push taps (foreground and cold-start), and Edge Function persistence writing notification records after push delivery**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-13T18:35:50Z
- **Completed:** 2026-03-13T18:38:54Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments
- BellBadge component with numeric unread badge in dashboard header, useUnreadCount hook driving refresh-on-foreground
- Full notification inbox with FlatList, pull-to-refresh, mark-all-read, type icons, relative timestamps, and deep link routing on item tap
- Cold-start notification taps route to correct screen via useLastNotificationResponse in app layout
- Foreground notification taps route to correct screen via DEFAULT_ACTION_IDENTIFIER handler in root layout
- send-push and weekly-summary Edge Functions persist notification records after push delivery
- All 6 bellBadge tests activated and passing (upgraded from it.todo stubs)

## Task Commits

1. **Task 1: BellBadge, NotificationItem, NotificationInbox, EmptyInbox components and inbox route** - `7f1f9b9` (feat)
2. **Task 2: Extend Edge Functions to persist notifications + foreground deep link handler** - `dfe0391` (feat)

## Files Created/Modified
- `src/features/notifications/components/BellBadge.tsx` - Bell icon with unread count badge, exports formatBadgeCount
- `src/features/notifications/components/NotificationItem.tsx` - Single notification row with unread dot, type icon, title/body/timestamp
- `src/features/notifications/components/NotificationInbox.tsx` - FlatList inbox with mark-all-read and pull-to-refresh
- `src/features/notifications/components/EmptyInbox.tsx` - Empty state with notifications-off icon
- `src/features/notifications/hooks/useUnreadCount.ts` - Hook refreshing unread count on mount and AppState foreground
- `app/(app)/notifications.tsx` - Notification inbox route
- `app/(app)/(tabs)/dashboard.tsx` - Added BellBadge to header, useUnreadCount hook call
- `app/(app)/_layout.tsx` - Registered notifications screen, cold-start deep link handler
- `app/_layout.tsx` - Foreground notification tap handler (DEFAULT_ACTION_IDENTIFIER)
- `supabase/functions/send-push/index.ts` - Notification record insert per recipient after push
- `supabase/functions/weekly-summary/index.ts` - Notification record insert per coach after push
- `tests/notifications/bellBadge.test.ts` - Activated 6 tests for formatBadgeCount

## Decisions Made
- BellBadge reads unreadCount directly from notificationStore; useUnreadCount in dashboard drives refresh-on-foreground cycle
- Cold-start deep link uses useLastNotificationResponse in app/(app)/_layout.tsx alongside usePushToken (co-located auth-dependent hooks)
- Foreground tap handler extends existing addNotificationResponseReceivedListener with else-if branch for DEFAULT_ACTION_IDENTIFIER
- Edge Function notification inserts use `as any` type cast since notifications table is not in generated Supabase types yet

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing test failure in tests/settings/csvExport.test.ts (expects "Hips" column header but Phase 15 migration replaced Hips with Biceps/Quad). Out of scope -- not caused by this plan's changes.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Full notification system operational: data layer, inbox UI, bell badge, deep link routing, and Edge Function persistence all wired
- Notification system ready for any future notification types (just add to NotificationType union and NOTIFICATION_ICONS)

## Self-Check: PENDING

---
*Phase: 16-push-notifications*
*Completed: 2026-03-13*
