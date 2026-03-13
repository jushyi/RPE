---
phase: quick-23
plan: 01
subsystem: navigation
tags: [bugfix, layout, tabs]
key-files:
  modified:
    - app/(app)/(tabs)/_layout.tsx
decisions: []
metrics:
  duration: 1min
  completed: "2026-03-12T14:07:00Z"
---

# Quick Task 23: Regression in Home Page Header Banner Summary

Remove duplicate "Home" system header from dashboard tab by deleting headerShown override -- dashboard uses its own animated welcome-back header.

## What Changed

The `app/(app)/(tabs)/_layout.tsx` file had three lines added to the dashboard `Tabs.Screen` options that enabled Expo Router's default tab header:

```typescript
headerShown: true,
headerStyle: { backgroundColor: colors.surface },
headerTintColor: colors.textPrimary,
```

This caused a "Home" banner to render above the dashboard's custom animated header. Removed these three lines so the dashboard inherits `headerShown: false` from `screenOptions`, matching the exercises and plans tabs. The settings tab retains its own `headerShown: true` as intended.

## Deviations from Plan

None - plan executed exactly as written.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | ebb87d9 | Remove headerShown from dashboard tab options |
