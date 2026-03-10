---
phase: quick-11
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/features/workout/components/ActiveWorkoutBar.tsx
  - app/(app)/(tabs)/_layout.tsx
  - src/features/history/components/InProgressCard.tsx
  - src/features/history/components/HistoryList.tsx
autonomous: true
requirements: [QUICK-11]

must_haves:
  truths:
    - "User sees a compact resume bar above the tab bar when a workout is active"
    - "Tapping the resume bar navigates back to the active workout screen"
    - "Resume bar shows workout title and live elapsed timer"
    - "History list shows an in-progress card at the top when a workout is active"
    - "Tapping the in-progress card navigates to the active workout screen"
    - "Back-swipe dismisses the workout screen without confirmation"
  artifacts:
    - path: "src/features/workout/components/ActiveWorkoutBar.tsx"
      provides: "Compact resume bar component"
      min_lines: 40
    - path: "src/features/history/components/InProgressCard.tsx"
      provides: "In-progress session card for history list"
      min_lines: 25
  key_links:
    - from: "app/(app)/(tabs)/_layout.tsx"
      to: "src/features/workout/components/ActiveWorkoutBar.tsx"
      via: "rendered above Tabs component"
      pattern: "ActiveWorkoutBar"
    - from: "src/features/history/components/HistoryList.tsx"
      to: "src/features/history/components/InProgressCard.tsx"
      via: "ListHeaderComponent on FlatList"
      pattern: "InProgressCard"
    - from: "ActiveWorkoutBar"
      to: "useWorkoutStore"
      via: "reads activeSession for visibility and title"
      pattern: "useWorkoutStore"
---

<objective>
Add resume UI for in-progress workouts that were dismissed via back-swipe. Create a compact "now playing" bar above the tab bar visible on all tabs, and an in-progress card at the top of the history list.

Purpose: Users can freely swipe away from a workout and easily resume it from any tab via the bar, or from the history tab via a distinct in-progress card.
Output: ActiveWorkoutBar component, InProgressCard component, updated tabs layout and history list.
</objective>

<execution_context>
@C:/Users/maser/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/maser/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@src/stores/workoutStore.ts
@app/(app)/(tabs)/_layout.tsx
@src/features/history/components/HistoryList.tsx
@src/features/history/components/SessionCard.tsx
@src/constants/theme.ts

<interfaces>
From src/stores/workoutStore.ts:
```typescript
interface WorkoutState {
  activeSession: WorkoutSession | null;
  currentExerciseIndex: number;
}
// activeSession has: id, title, started_at, ended_at, exercises[], plan_id, plan_day_id, user_id
// activeSession is persisted to MMKV automatically via zustand/persist
```

From src/constants/theme.ts:
```typescript
export const colors = {
  background: '#0a0a0a',
  surface: '#1a1a1a',
  surfaceElevated: '#252525',
  accent: '#3b82f6',
  accentBright: '#60a5fa',
  textPrimary: '#f5f5f5',
  textSecondary: '#a3a3a3',
  textMuted: '#737373',
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
};
```

From app/(app)/(tabs)/_layout.tsx:
```typescript
// Uses <Tabs> from expo-router with 3 tabs: dashboard, exercises, plans
// tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.surfaceElevated, borderTopWidth: 1 }
```

From src/features/history/components/HistoryList.tsx:
```typescript
// FlatList with renderItem for SessionCard
// Uses useHistory() hook for data, useRouter() for navigation
// Has handleStartWorkout that pushes to '/workout'
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create ActiveWorkoutBar and wire into tabs layout</name>
  <files>src/features/workout/components/ActiveWorkoutBar.tsx, app/(app)/(tabs)/_layout.tsx</files>
  <action>
Create `src/features/workout/components/ActiveWorkoutBar.tsx`:
- A compact bar (height ~52px) that renders ONLY when `useWorkoutStore(s => s.activeSession)` is non-null AND `ended_at` is null.
- Layout: horizontal row with `colors.accent` background, borderRadius 0 (flush with tab bar).
- Left side: Ionicons "play" icon (size 18, white).
- Center: workout title (`activeSession.title` — e.g. "Push Day" or "Quick Workout"), white, bold, fontSize 14, numberOfLines 1. Below or beside it, a live elapsed timer showing "MM:SS" computed from `activeSession.started_at` to now, updated every second via `useEffect` with `setInterval(1000)`. Timer text in white with slight opacity (0.85), fontSize 12.
- Right side: Ionicons "chevron-forward" icon (size 16, white, opacity 0.7).
- Entire bar is a Pressable. onPress calls `router.push('/workout')`.
- Use StyleSheet.create, import colors from @/constants/theme, Ionicons from @expo/vector-icons, useRouter from expo-router.
- No emojis anywhere (per CLAUDE.md).

Update `app/(app)/(tabs)/_layout.tsx`:
- Import ActiveWorkoutBar.
- Wrap the return in a fragment or View with flex:1.
- Render `<ActiveWorkoutBar />` AFTER the `<Tabs>` component but visually it needs to appear ABOVE the tab bar. To achieve this: wrap the entire return in a `<View style={{ flex: 1 }}>`, put `<Tabs>` first, then use absolute positioning OR leverage the Tabs `tabBar` prop. The simplest approach: render `<ActiveWorkoutBar />` and use the Tabs `sceneContainerStyle` to add bottom padding when active, AND position the bar absolutely just above the tab bar.

RECOMMENDED APPROACH for tabs layout: The cleanest way in Expo Router is to wrap `<Tabs>` in a View and render ActiveWorkoutBar as a sibling. ActiveWorkoutBar should position itself with `position: 'absolute', bottom: TAB_BAR_HEIGHT, left: 0, right: 0` where TAB_BAR_HEIGHT is approximately 49-50px (standard iOS tab bar). Alternatively, use a simpler approach: render the bar inside a wrapper View and DON'T use absolute positioning — instead use the `tabBar` custom render prop on `<Tabs>` to render the default tab bar plus the ActiveWorkoutBar stacked above it. Choose whichever is simpler; the key is the bar sits directly above the tab bar visually.
  </action>
  <verify>
    <automated>cd /c/Users/maser/Desktop/Gym-App && npx tsc --noEmit --pretty 2>&1 | head -30</automated>
  </verify>
  <done>ActiveWorkoutBar appears above tab bar on all tabs when an active workout session exists, shows title and live timer, navigates to /workout on tap. Hidden when no active session.</done>
</task>

<task type="auto">
  <name>Task 2: Create InProgressCard and add to HistoryList header</name>
  <files>src/features/history/components/InProgressCard.tsx, src/features/history/components/HistoryList.tsx</files>
  <action>
Create `src/features/history/components/InProgressCard.tsx`:
- Reads `useWorkoutStore(s => s.activeSession)`. If null or `ended_at` is not null, renders null.
- Uses the existing `Card` component from `@/components/ui/Card` as base but with custom styling for distinction.
- Wrap Card in a Pressable that calls `router.push('/workout')` on press.
- Card styling: add `borderColor: colors.accent` and `borderWidth: 1.5` to make it visually distinct from regular history cards.
- Top row: left side shows "In Progress" text in `colors.accent`, fontSize 13, fontWeight '700'. Right side shows a live elapsed timer "MM:SS" (same pattern as ActiveWorkoutBar — useEffect + setInterval every 1s, compute diff from `started_at`).
- Title row: show `activeSession.title` in `colors.textPrimary`, fontSize 16, fontWeight '700'.
- Bottom row: show exercise count as "{N} exercises" with Ionicons "barbell-outline" icon, and set count as "{N} sets logged" with Ionicons "checkmark-circle-outline" icon. Compute sets logged by summing `exercise.logged_sets.length` across all exercises. Use `colors.textMuted` for these stats.
- Use StyleSheet.create. No emojis.

Update `src/features/history/components/HistoryList.tsx`:
- Import InProgressCard.
- Add `ListHeaderComponent` prop to the FlatList: `ListHeaderComponent={<InProgressCard />}`.
- Wrap InProgressCard in a View with `marginBottom: 12` and same `paddingHorizontal: 16` as the list.
- ALSO show InProgressCard in the empty state — before the HistoryEmptyState, check if activeSession exists and if so render InProgressCard above it (so even with no history, the in-progress workout is visible).
  </action>
  <verify>
    <automated>cd /c/Users/maser/Desktop/Gym-App && npx tsc --noEmit --pretty 2>&1 | head -30</automated>
  </verify>
  <done>History tab shows a distinct in-progress card at the top of the list (or above empty state) when a workout is active. Card shows "In Progress" label, workout title, live timer, exercise/set counts. Tapping navigates to /workout.</done>
</task>

</tasks>

<verification>
1. Start a workout (plan-based or freestyle)
2. Swipe back to dismiss the workout screen — no confirmation dialog
3. On any tab (Home, Exercises, Plans), the ActiveWorkoutBar appears above the tab bar with workout name and ticking timer
4. Tap the bar — returns to the active workout with all progress intact
5. Navigate to Plans tab, swipe to History — InProgressCard shows at the top with accent border, "In Progress" label, title, timer, and exercise/set counts
6. Tap the InProgressCard — returns to the active workout
7. Finish or discard the workout — both the bar and card disappear
</verification>

<success_criteria>
- ActiveWorkoutBar visible on all tabs when workout is active, hidden otherwise
- Live timer ticking every second on both bar and history card
- Both tap targets navigate to /workout and resume the session
- In-progress card visually distinct from completed session cards (accent border)
- No confirmation dialog on back-swipe from workout screen
- TypeScript compiles with no errors
</success_criteria>

<output>
After completion, create `.planning/quick/11-persist-active-workout-on-swipe-back-dis/11-SUMMARY.md`
</output>
