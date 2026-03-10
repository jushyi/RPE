---
phase: quick-11
plan: 01
subsystem: workout-resume-ui
tags: [workout, navigation, resume, tab-bar, history]
dependency_graph:
  requires: [workoutStore, tabs-layout, history-list]
  provides: [active-workout-bar, in-progress-card]
  affects: [tab-bar, history-list]
tech_stack:
  added: []
  patterns: [custom-tabBar-prop, live-timer-useEffect-setInterval]
key_files:
  created:
    - src/features/workout/components/ActiveWorkoutBar.tsx
    - src/features/history/components/InProgressCard.tsx
  modified:
    - app/(app)/(tabs)/_layout.tsx
    - src/features/history/components/HistoryList.tsx
decisions:
  - Used BottomTabBar custom tabBar prop to render ActiveWorkoutBar directly above native tab bar
  - InProgressCard uses inline styling instead of Card component (Card omits style prop)
  - Shared formatElapsed helper pattern between both components for consistent timer display
metrics:
  duration: 3min
  completed: "2026-03-10"
---

# Quick Task 11: Persist Active Workout on Swipe-Back Dismiss Summary

ActiveWorkoutBar renders above tab bar on all tabs with live MM:SS timer using custom tabBar prop; InProgressCard with accent border shows at top of history list with exercise/set stats.

## What Was Built

### ActiveWorkoutBar (src/features/workout/components/ActiveWorkoutBar.tsx)
- Compact 52px bar with accent background rendered above tab bar on all tabs
- Shows play icon, workout title, live elapsed timer (MM:SS updated every second), and chevron
- Reads `activeSession` from workoutStore; renders null when no active session
- Pressable navigates to `/workout` to resume the session

### InProgressCard (src/features/history/components/InProgressCard.tsx)
- Distinct card with `borderColor: accent` and `borderWidth: 1.5` for visual differentiation
- Shows "In Progress" label, workout title, live timer, exercise count, and sets logged count
- Reads `activeSession` from workoutStore; renders null when no active session
- Pressable navigates to `/workout` to resume the session

### Tabs Layout Update (app/(app)/(tabs)/_layout.tsx)
- Custom `tabBar` prop renders `TabBarWithWorkoutBar` wrapper
- Stacks ActiveWorkoutBar above the native BottomTabBar
- No absolute positioning needed; natural stacking in a View

### HistoryList Update (src/features/history/components/HistoryList.tsx)
- InProgressCard added as `ListHeaderComponent` on FlatList
- Also shown above empty state when no history exists but workout is active

## Task Commits

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Create ActiveWorkoutBar and wire into tabs layout | 5bef5bc | ActiveWorkoutBar.tsx, _layout.tsx |
| 2 | Create InProgressCard and add to HistoryList header | dc58dbb | InProgressCard.tsx, HistoryList.tsx |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Card component does not accept style prop**
- **Found during:** Task 2
- **Issue:** The plan suggested using the existing Card component with custom styling, but Card uses `Omit<ViewProps, 'style'>` preventing style overrides
- **Fix:** Used inline View with matching card styling plus accent border instead of Card component
- **Files modified:** src/features/history/components/InProgressCard.tsx

## Verification

- TypeScript compiles with no new errors (pre-existing dashboard.tsx tabPress error unrelated)
- ActiveWorkoutBar conditionally renders based on activeSession state
- InProgressCard conditionally renders based on activeSession state
- Both components use live timer with 1-second interval
- Both tap targets navigate to /workout
- No emojis used in any UI component
