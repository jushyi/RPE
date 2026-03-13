---
phase: 16-push-notifications
plan: "02"
subsystem: notifications
tags: [notifications, bell-badge, deep-link, inbox, edge-functions]
dependency_graph:
  requires: [16-01]
  provides: [notification-inbox-ui, bell-badge, deep-link-routing, edge-function-persistence]
  affects: [dashboard, app-layout, root-layout, send-push, weekly-summary]
tech_stack:
  added: []
  patterns: [zustand-store-read-in-component, useLastNotificationResponse-cold-start, fire-and-forget-insert]
key_files:
  created:
    - src/features/notifications/hooks/useUnreadCount.ts
    - src/features/notifications/components/BellBadge.tsx
    - src/features/notifications/components/EmptyInbox.tsx
    - src/features/notifications/components/NotificationItem.tsx
    - src/features/notifications/components/NotificationInbox.tsx
    - app/(app)/notifications.tsx
  modified:
    - app/(app)/_layout.tsx
    - app/(app)/(tabs)/dashboard.tsx
    - app/_layout.tsx
    - supabase/functions/send-push/index.ts
    - supabase/functions/weekly-summary/index.ts
    - tests/notifications/bellBadge.test.ts
decisions:
  - "[Phase 16]: BellBadge reads unreadCount directly from notificationStore; useUnreadCount in dashboard drives refresh-on-foreground cycle"
  - "[Phase 16]: from('notifications' as any) pattern for Edge Function inserts (notifications table not in generated Supabase types)"
  - "[Phase 16]: Cold-start deep links handled in app/(app)/_layout.tsx via useLastNotificationResponse; foreground taps in root app/_layout.tsx"
metrics:
  duration: 4min
  completed_date: "2026-03-13"
  tasks: 2
  files: 12
---

# Phase 16 Plan 02: Notification Inbox UI and Edge Function Persistence Summary

One-liner: Bell badge in dashboard header with full notification inbox, deep link routing from push taps (foreground and cold-start), and Edge Function persistence writing notification records after push delivery.

## Tasks Completed

| # | Task | Commit | Key Files |
|---|------|--------|-----------|
| 1 | BellBadge, NotificationItem, NotificationInbox, EmptyInbox, inbox route | 7f1f9b9 | BellBadge.tsx, NotificationInbox.tsx, notifications.tsx, dashboard.tsx, _layout.tsx |
| 2 | Extend Edge Functions + foreground deep link handler | dfe0391 | send-push/index.ts, weekly-summary/index.ts, app/_layout.tsx |

## What Was Built

### Notification Inbox UI

- `useUnreadCount` hook: subscribes to AppState changes, calls `refreshUnreadCount()` on mount and every time the app returns to foreground
- `BellBadge`: Pressable bell icon with numeric badge overlay (accent background). Count 0 hides badge, count >= 10 shows "9+". Navigates to `/(app)/notifications` on press. Exports `formatBadgeCount` utility function.
- `EmptyInbox`: Centered placeholder with notifications-off-outline icon and "No notifications yet" label
- `NotificationItem`: Row layout with unread dot, type icon (from NOTIFICATION_ICONS), title (bold if unread), body (2-line truncate), relative timestamp, and chevron. Pressable with onPress callback.
- `NotificationInbox`: FlatList with pull-to-refresh, "Mark all read" header (hidden when unread count is 0), per-item deep link navigation via `getDeepLinkRoute`, `EmptyInbox` as ListEmptyComponent

### Route and Layout Changes

- `app/(app)/notifications.tsx`: Minimal stack route wrapping `NotificationInbox`
- `app/(app)/_layout.tsx`: Added `<Stack.Screen name="notifications" />` registration and cold-start deep link handler using `useLastNotificationResponse` + `getDeepLinkRoute`
- `app/(app)/(tabs)/dashboard.tsx`: Imports `BellBadge` and `useUnreadCount`, calls hook in component body, adds `<BellBadge />` to right of header Animated.View

### Edge Function Extensions

- `send-push/index.ts`: After push delivery succeeds, bulk-inserts one notification record per recipient_id into the `notifications` table. Wrapped in try/catch so table write failure never blocks push delivery.
- `weekly-summary/index.ts`: After sending each coach's push, inserts a `weekly_summary` notification record for that coach. Also wrapped in try/catch (fire-and-forget).

### Foreground Deep Link Handler

- `app/_layout.tsx`: Added `else if (actionId === DEFAULT_ACTION_IDENTIFIER)` branch in the existing `addNotificationResponseReceivedListener`. Extracts `data` from notification content, calls `getDeepLinkRoute`, and routes via `router.push` if a route exists.

## Deviations from Plan

None — plan executed exactly as written.

## Test Results

All notification tests pass:
- `bellBadge.test.ts`: 6 tests activated and passing (formatBadgeCount: null for 0, count strings for 1-9, "9+" for >= 10)
- All other notification test files: 35 tests passing, 4 todo stubs

Pre-existing unrelated failures (not caused by this plan):
- `tests/settings/csvExport.test.ts`: 2 failures (Hips column header mismatch — pre-existing before this plan)
- `tests/workout/sync-queue.test.ts`: 1 failure (pre-existing before this plan)

## Self-Check: PASSED

All created files exist on disk. Both task commits (7f1f9b9, dfe0391) verified in git log.
