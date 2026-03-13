---
status: complete
phase: 16-push-notifications
source: [16-01-SUMMARY.md, 16-02-SUMMARY.md, 16-03-SUMMARY.md]
started: 2026-03-13T18:45:00Z
updated: 2026-03-13T18:45:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Cold Start Smoke Test
expected: Kill any running server/service. Clear ephemeral state (temp DBs, caches, lock files). Start the application from scratch. App boots without errors, any seed/migration completes, and a primary query (health check, homepage load, or basic API call) returns live data.
result: pass

### 2. Bell Badge in Dashboard Header
expected: Open the app and go to the Dashboard tab. A bell icon is visible in the header. If there are unread notifications, a numeric badge appears on the bell (showing count, or "99+" if over 99). If there are no unread notifications, the bell shows no badge.
result: pass

### 3. Notification Inbox
expected: Tap the bell badge in the Dashboard header. The Notifications screen opens showing a list of notifications. Each item shows the notification type icon (colored), title, body text, and a relative timestamp (e.g. "2m ago", "3h ago"). Unread notifications have a visible unread indicator (dot or highlight). If there are no notifications, an empty state with an icon is shown.
result: issue
reported: "header doesn't match the headers in the rest of the app, otherwise pass"
severity: cosmetic

### 4. Pull-to-Refresh Inbox
expected: In the Notification Inbox, pull down to refresh the list. The list refreshes and shows any new notifications. The pull-to-refresh indicator appears and disappears after loading completes.
result: issue
reported: "WARN  Failed to fetch notifications: Could not find the table 'public.notifications' in the schema cache"
severity: blocker

### 5. Mark All as Read
expected: In the Notification Inbox, tap the "Mark all read" button (or equivalent). All notification unread indicators clear. The bell badge count in the Dashboard header drops to zero (badge disappears).
result: skipped

### 6. Notification Tap - Deep Link Routing
expected: Tap any notification in the inbox. The app navigates to the appropriate screen based on notification type (e.g. workout_complete → workout history, pr_achieved → workout history, plan_update → coaching plans screen, weekly_summary → progress/dashboard, alarm/nudge → relevant screen). The tapped notification is marked as read.
result: skipped
reason: no notifications to test with (notifications table not yet in Supabase)

### 7. Dev Tools Access
expected: Go to Settings. Long-press the version text (app version number) for about 2 seconds. The Dev Tools screen opens without navigating through normal navigation — it appears as a hidden/developer screen.
result: pass

### 8. Dev Tools - Trigger Notifications
expected: In the Dev Tools screen, 6 buttons are visible (one for each notification type: workout_complete, pr_achieved, plan_update, weekly_summary, alarm, nudge). Tapping a button sends a local test notification. A debug log below the buttons shows received notification events in real-time.
result: issue
reported: "see debug but see no actual notifs on phone, local or push"
severity: major

## Summary

total: 8
passed: 3
issues: 3
pending: 0
skipped: 2

## Gaps

- truth: "Fetching notifications succeeds (Supabase notifications table exists and is accessible)"
  status: failed
  reason: "User reported: WARN  Failed to fetch notifications: Could not find the table 'public.notifications' in the schema cache"
  severity: blocker
  test: 4
  artifacts: []
  missing: []

- truth: "Notification Inbox header matches the style of other screen headers in the app"
  status: failed
  reason: "User reported: header doesn't match the headers in the rest of the app, otherwise pass"
  severity: cosmetic
  test: 3
  artifacts: []
  missing: []

- truth: "Dev tools notification triggers deliver actual notifications to the device (local and push)"
  status: failed
  reason: "User reported: see debug but see no actual notifs on phone, local or push"
  severity: major
  test: 8
  artifacts: []
  missing: []

- truth: "Dev Tools screen header matches the style of other screen headers in the app"
  status: failed
  reason: "User reported: also dev tools header doesn't match the other headers in the app"
  severity: cosmetic
  test: 8
  artifacts: []
  missing: []
