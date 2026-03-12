---
status: diagnosed
phase: 13-coaching-options
source: 13-00-SUMMARY.md, 13-01-SUMMARY.md, 13-02-SUMMARY.md, 13-03-SUMMARY.md, 13-04-SUMMARY.md, 13-05-SUMMARY.md
started: 2026-03-12T20:00:00Z
updated: 2026-03-12T20:15:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Person-Add Icon in Plans Tab
expected: Open the Plans tab. A person-add icon is visible in the header. Tapping it opens the Invite Code modal.
result: issue
reported: "works fine. the button doesn't make it obvious that its coaching. the animation is also off. it should slide up but the background overlay that darkens should fade in not slide up like the rest"
severity: minor

### 2. Generate Invite Code
expected: In the Invite Code modal, tap Generate. A 6-character alphanumeric code appears. A copy button lets you copy it to clipboard.
result: issue
reported: "should also be able to tap above the sheet to dismiss"
severity: minor

### 3. Enter Invite Code
expected: In the Invite Code modal, switch to the Enter Code tab. You can type a 6-character code and tap Redeem to establish a coaching relationship.
result: issue
reported: "doesn't slide up to clear keyboard cannot type in code easily or paste it in easily"
severity: major

### 4. Coach/Trainee Toggle Appears
expected: After establishing at least one coaching relationship (as coach or trainee), the Plans tab shows a segmented toggle with "My Plans" and "Trainees" options at the top.
result: pass

### 5. Trainee List Display
expected: When toggled to "Trainees" view, trainee cards appear showing each trainee's name/avatar with a disconnect option.
result: pass

### 6. Navigate to Trainee Plans
expected: Tapping a trainee card navigates to a trainee-plans screen showing that trainee's plan list with coach edit/delete controls.
result: pass

### 7. Create Plan for Trainee
expected: From trainee-plans screen, create a new plan. The plan builder shows inline performance data (trainee's last-week best weight/reps per exercise) and a coach note input field (200-char limit). Alarm fields are hidden. Saving creates the plan.
result: issue
reported: "for adding notes, doesn't scroll to clear keyboard. on save of plan, the plans page for that trainee doesn't get updated immediately have to scroll to refresh to see new plan. everything else good"
severity: major

### 8. Coach Plan Badge on Trainee Side
expected: Plans assigned by a coach display a coach plan badge indicator, distinguishing them from self-created plans.
result: pass

### 9. Trainee Workout History
expected: From the trainee-plans screen, navigate to workout history. A paginated list of the trainee's past sessions appears. Tapping a session expands to show set-level detail.
result: issue
reported: "seems to constantly be loading stuck in a for loop"
severity: blocker

### 10. Disconnect Coaching Relationship
expected: From a trainee card, tap disconnect. The relationship is removed and the trainee no longer appears in the list.
result: pass

### 11. Push Token Registration on Startup
expected: After logging in and opening the app, no errors appear related to push notifications. The app silently registers a push token in the background (no visible UI change, but no crash or error).
result: pass

### 12. Coach-Created Plans Not in Coach's Own List
expected: Plans created by a coach for a trainee should only appear in the trainee's plan list, not in the coach's personal Plans tab.
result: issue
reported: "the plan i created for a trainee shows up in my own plan list with the coach tag. it should not appear in the coaches personal plan list only the trainees"
severity: major

## Summary

total: 12
passed: 6
issues: 6
pending: 0
skipped: 0

## Gaps

- truth: "Invite Code modal overlay should fade in while content slides up"
  status: failed
  reason: "User reported: works fine. the button doesn't make it obvious that its coaching. the animation is also off. it should slide up but the background overlay that darkens should fade in not slide up like the rest"
  severity: minor
  test: 1
  root_cause: "Modal uses animationType='slide' which slides entire content including overlay as one unit. Button uses generic person-add-outline icon with no coaching label."
  artifacts:
    - path: "src/features/coaching/components/InviteCodeModal.tsx"
      issue: "animationType='slide' on line 105 slides overlay and content together"
    - path: "app/(app)/(tabs)/plans.tsx"
      issue: "person-add-outline icon on lines 85-91 has no coaching label or context"
  missing:
    - "Switch to animationType='fade' or 'none' and manually animate sheet slide with Reanimated"
    - "Add coaching label or use more descriptive icon"
  debug_session: ""

- truth: "Invite Code modal can be dismissed by tapping outside/above the sheet"
  status: failed
  reason: "User reported: should also be able to tap above the sheet to dismiss"
  severity: minor
  test: 2
  root_cause: "Overlay View on line 108 has no onPress handler - it's a plain View, not Pressable"
  artifacts:
    - path: "src/features/coaching/components/InviteCodeModal.tsx"
      issue: "Overlay View has no press handler to dismiss modal"
  missing:
    - "Wrap overlay in Pressable that calls onClose, with inner Pressable to block propagation on content"
  debug_session: ""

- truth: "Enter Code tab slides up to clear keyboard for easy code entry and pasting"
  status: failed
  reason: "User reported: doesn't slide up to clear keyboard cannot type in code easily or paste it in easily"
  severity: major
  test: 3
  root_cause: "No KeyboardAvoidingView in InviteCodeModal. Modal content is static View tree that doesn't shift when keyboard opens."
  artifacts:
    - path: "src/features/coaching/components/InviteCodeModal.tsx"
      issue: "No KeyboardAvoidingView wrapping modal content"
  missing:
    - "Add KeyboardAvoidingView with behavior='padding' (iOS) wrapping modal content"
  debug_session: ""

- truth: "Coach note input scrolls to clear keyboard; trainee plans list updates immediately after saving a new plan"
  status: failed
  reason: "User reported: for adding notes, doesn't scroll to clear keyboard. on save of plan, the plans page for that trainee doesn't get updated immediately have to scroll to refresh to see new plan. everything else good"
  severity: major
  test: 7
  root_cause: "Two issues: (1) coach-create.tsx ScrollView has no KeyboardAvoidingView or automaticallyAdjustKeyboardInsets, paddingBottom only 60px. (2) trainee-plans.tsx and coach-create.tsx each create independent useCoachPlans instances with local useState - no shared state. trainee-plans useEffect only fires on traineeId change, not on focus return."
  artifacts:
    - path: "app/(app)/plans/coach-create.tsx"
      issue: "ScrollView missing KeyboardAvoidingView or automaticallyAdjustKeyboardInsets"
    - path: "app/(app)/plans/trainee-plans.tsx"
      issue: "No useFocusEffect to refetch plans when screen regains focus"
    - path: "src/features/coaching/hooks/useCoachPlans.ts"
      issue: "Local useState not shared between screen instances"
  missing:
    - "Add automaticallyAdjustKeyboardInsets={true} to ScrollView in coach-create.tsx"
    - "Add useFocusEffect in trainee-plans.tsx to refetch on screen focus"
  debug_session: ""

- truth: "Trainee workout history loads and displays paginated sessions"
  status: failed
  reason: "User reported: seems to constantly be loading stuck in a for loop"
  severity: blocker
  test: 9
  root_cause: "useTraineeHistory.ts fetchSessions has sessions.length in useCallback dependency array (line 62). Each fetch changes sessions.length, recreating fetchSessions, which recreates fetchMore. FlatList onEndReached fires eagerly on short/empty lists, calling fetchMore repeatedly in infinite cycle."
  artifacts:
    - path: "src/features/coaching/hooks/useTraineeHistory.ts"
      issue: "sessions.length in useCallback deps on line 62 causes infinite recreation"
  missing:
    - "Remove sessions.length from deps, use ref or functional state update for offset calculation"
  debug_session: ""

- truth: "Coach-created plans for trainees only appear in trainee's plan list, not coach's personal list"
  status: failed
  reason: "User reported: the plan i created for a trainee shows up in my own plan list with the coach tag. it should not appear in the coaches personal plan list only the trainees"
  severity: major
  test: 12
  root_cause: "usePlans.ts fetchPlans query has no user_id filter - relies on RLS which grants coaches SELECT on trainee plans, so coach sees trainee plans in their own list"
  artifacts:
    - path: "src/features/plans/hooks/usePlans.ts"
      issue: "fetchPlans query missing .eq('user_id', userId) filter on line 50-52"
  missing:
    - "Add .eq('user_id', userId) to the fetchPlans Supabase query"
  debug_session: ""
