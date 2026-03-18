---
status: awaiting_human_verify
trigger: "Weekly summary notification appears but clicking/tapping it does nothing — no navigation, no screen change."
created: 2026-03-18T00:00:00Z
updated: 2026-03-18T00:05:00Z
---

## Current Focus

hypothesis: CONFIRMED and FIXED — weekly_summary case in deepLinkRouter returned null, now returns dashboard route
test: all 13 deepLinkRouter tests pass including updated weekly_summary test
expecting: tapping weekly summary notification now navigates to dashboard with ProgressSummaryCard
next_action: awaiting human verification

## Symptoms

expected: Tapping the weekly summary notification should navigate to a screen showing weekly workout stats (workouts completed, volume, PRs, etc.)
actual: Clicking the notification does nothing — no navigation occurs, no screen opens
errors: No errors visible in UI or console
reproduction: Receive a weekly summary notification, tap it, nothing happens
started: Not sure if it ever worked correctly

## Eliminated

## Evidence

- timestamp: 2026-03-18T00:01:00Z
  checked: deepLinkRouter.ts line 30-31
  found: case 'weekly_summary' falls through to default which returns null
  implication: this is the direct cause — null return means no navigation in all three tap handlers

- timestamp: 2026-03-18T00:01:30Z
  checked: NotificationInbox.tsx line 27-32 (handleItemPress)
  found: getDeepLinkRoute returns null for weekly_summary; the if(route) guard skips router.push
  implication: tapping weekly summary in notification inbox does nothing

- timestamp: 2026-03-18T00:01:45Z
  checked: app/_layout.tsx line 61-67 (foreground notification tap handler)
  found: same pattern — getDeepLinkRoute returns null, if(route) guard skips navigation
  implication: tapping push notification while app is open also does nothing

- timestamp: 2026-03-18T00:02:00Z
  checked: app/(app)/_layout.tsx line 30-38 (cold-start deep link handler)
  found: same pattern — useLastNotificationResponse + getDeepLinkRoute returns null
  implication: tapping notification to cold-start the app also fails to navigate

- timestamp: 2026-03-18T00:02:15Z
  checked: deepLinkRouter.test.ts line 50-53
  found: test explicitly asserts weekly_summary returns null ("no deep target")
  implication: this was intentionally coded as no-op, not an accidental omission

- timestamp: 2026-03-18T00:02:30Z
  checked: dashboard.tsx — ProgressSummaryCard component
  found: dashboard already shows weekly stats (workouts count, volume, PRs, streak) via ProgressSummaryCard
  implication: the natural navigation target for weekly_summary is the dashboard at /(app)/(tabs)/dashboard

- timestamp: 2026-03-18T00:04:00Z
  checked: ran npx jest tests/notifications/deepLinkRouter.test.ts
  found: all 13 tests pass including updated "returns dashboard route for weekly_summary"
  implication: fix is correct, no regressions in other notification types

## Resolution

root_cause: The deepLinkRouter.ts explicitly returns null for 'weekly_summary' notification type (line 30-31), causing all three notification tap handlers (inbox press, foreground push tap, cold-start push tap) to skip navigation. The test suite even asserts this null return as expected behavior, meaning it was coded as a deliberate no-op rather than an oversight — but the user expectation is that tapping should navigate to weekly stats.
fix: Changed deepLinkRouter to return '/(app)/(tabs)/dashboard' for weekly_summary type, so tapping navigates to the dashboard which already displays the ProgressSummaryCard with weekly workout count, volume, PRs, and streak. Updated the test to expect the dashboard route instead of null.
verification: All 13 deepLinkRouter tests pass (0 failures). The fix covers all three tap paths: (1) notification inbox item press, (2) foreground push notification tap, (3) cold-start push notification tap — all use getDeepLinkRoute and all now receive '/(app)/(tabs)/dashboard' instead of null.
files_changed: [src/features/notifications/utils/deepLinkRouter.ts, tests/notifications/deepLinkRouter.test.ts]
