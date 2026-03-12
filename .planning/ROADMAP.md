# Roadmap: GymApp

## Overview

Build a React Native gym companion app for a small friend group using Expo SDK 55 and Supabase. The journey starts with a solid foundation (auth + schema) that every other feature depends on, layers in exercise library and plan builder as the structural dependencies, then delivers the core daily-use surface (active workout focus mode with offline-first logging), followed by history, charts, body metrics, and accountability alarms. The final two phases harden and distribute the app to the friend group. All 29 v1 requirements land in Phases 1-8; Phases 9-10 are delivery gates with no orphaned requirements.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Expo project scaffold, Supabase schema, RLS, auth screens, offline session handling, PR baseline setup (completed 2026-03-09)
- [x] **Phase 2: Exercise Library** - Pre-loaded exercise database, custom exercise creation, searchable exercise picker (completed 2026-03-09)
- [x] **Phase 3: Plan Builder** - Named plans, day assignment, per-day exercise configuration with full detail, plan CRUD (completed 2026-03-09)
- [x] **Phase 4: Active Workout** - Focus mode screen, set logging, previous performance reference, PR detection, offline-first writes (completed 2026-03-10)
- [x] **Phase 5: Workout History** - Past session list, session detail view, estimated 1RM calculation (completed 2026-03-10)
- [x] **Phase 6: Progress Charts + Dashboard** - Per-exercise progress charts, bodyweight chart, dashboard home screen (1/3 plans complete) (completed 2026-03-10)
- [x] **Phase 7: Body Metrics** - Body measurements (chest, waist, biceps, quad, body fat %), combined dashboard card, detail screen with charts and history (gap closure in progress) (completed 2026-03-12)
- [ ] **Phase 8: Alarms + Accountability** - Plan-day-tied alarms, real alarm delivery, missed workout nudge
- [x] **Phase 9: Polish** - Dark/bold theme refinement, edge case handling, app icon, splash screen, OTA pipeline (completed 2026-03-11)
- [ ] **Phase 10: Distribution** - EAS Build, TestFlight (iOS only), physical device verification

## Phase Details

### Phase 1: Foundation
**Goal**: The project compiles and runs, users can create accounts, log in, and stay logged in — even offline — with a database schema that correctly separates plan templates from logged actuals and enforces per-user data isolation.
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06
**Success Criteria** (what must be TRUE):
  1. User can create an account with email and password and reach the app home screen
  2. User can close and reopen the app and remain logged in without re-entering credentials
  3. User can log out from any screen and return to the login screen
  4. User data automatically syncs to Supabase when the device is online
  5. The app opens and is usable (no crash, no forced logout) when the device has no network connectivity
  6. During account setup, user can enter current 1RM values for key lifts and see them saved as PR baselines
**Plans:** 4/4 plans complete

Plans:
- [ ] 01-00-PLAN.md — Wave 0: Test infrastructure (Jest + RNTL install, global mocks, 5 behavioral test stubs)
- [ ] 01-01-PLAN.md — Project scaffold, dependencies, NativeWind config, Supabase client, Zustand/MMKV store, database migrations, Expo Router file structure
- [ ] 01-02-PLAN.md — Auth screens (sign-in/sign-up toggle), session persistence, route guards, connectivity indicators (cloud icon + toast banner)
- [ ] 01-03-PLAN.md — PR baseline entry flow (Big 3 lifts with unit selector), empty state dashboard shell

### Phase 2: Exercise Library
**Goal**: Users can browse and search a pre-loaded exercise database and add custom exercises — the foundational data that all plans and workout sessions reference.
**Depends on**: Phase 1
**Requirements**: EXER-01, EXER-02
**Success Criteria** (what must be TRUE):
  1. App launches with a pre-populated library of common exercises (bench press, squat, deadlift, etc.) searchable by name and muscle group
  2. User can create a custom exercise by providing a name, muscle group, and equipment type, and it immediately appears in the library
  3. Custom exercises persist across app restarts and sync to Supabase
**Plans:** 2/2 plans complete

Plans:
- [ ] 02-01-PLAN.md — Exercise data layer (Supabase migration with ~35 seed exercises, types, Zustand store) and library screen with search/filter
- [ ] 02-02-PLAN.md — Custom exercise CRUD via bottom sheet modal, edit/delete via long-press, human verification

### Phase 3: Plan Builder
**Goal**: Users can create structured workout plans that assign specific exercises (with full detail) to days of the week — the template layer that drives alarms and the active workout screen.
**Depends on**: Phase 2
**Requirements**: PLAN-01, PLAN-02, PLAN-03, PLAN-04, PLAN-05
**Success Criteria** (what must be TRUE):
  1. User can create a named workout plan and assign it to specific days of the week (e.g., Mon/Wed/Fri)
  2. User can add exercises from the library to each training day with target sets, reps, weight, RPE, and notes
  3. User can view all created plans and navigate to any plan's detail
  4. User can edit an existing plan (change exercises, days, or targets) and delete a plan entirely
  5. Plan edits do not alter previously logged workout sessions (plans and actuals remain separate)
**Plans:** 3/3 plans complete

Plans:
- [ ] 03-01-PLAN.md — Schema (3 tables + RLS + active trigger), types, planStore, usePlans hook, Plans tab with list screen and empty state
- [ ] 03-02-PLAN.md — Plan creation screen (name + day slots + weekday mapping), exercise picker bottom sheet, inline set editing, drag-to-reorder, plan detail with collapsible day sections
- [ ] 03-03-PLAN.md — Edit mode (view/edit toggle, save/cancel, draft isolation), delete with confirmation, active plan toggle, human verification

### Phase 4: Active Workout
**Goal**: Users can run a live workout session in focus mode — logging sets with large tap targets, seeing their previous performance inline, getting instant PR flags — with every set saved locally the moment it's logged regardless of network state.
**Depends on**: Phase 3
**Requirements**: WORK-01, WORK-02, WORK-03, WORK-04, WORK-05
**Success Criteria** (what must be TRUE):
  1. User can start a workout from a plan day or as a freestyle session with no plan
  2. Active workout shows exactly one exercise at a time filling the screen with oversized weight and reps inputs
  3. User can log weight and reps for each set, advance to the next exercise, and finish the session
  4. Previous session's weight and reps for the current exercise are displayed inline while logging
  5. When a logged set exceeds the user's stored PR, the app immediately flags it as a personal record
  6. All set logging writes to local storage instantly and syncs to Supabase in the background — logging never waits for a network response
**Plans:** 6/6 plans complete

Plans:
- [ ] 04-01-PLAN.md — Database schema (workout_sessions, session_exercises, set_logs + RLS), TypeScript types, workoutStore with MMKV persistence
- [ ] 04-02-PLAN.md — Focus mode screen (PagerView exercise navigation, swipe-to-log set cards, oversized inputs, freestyle picker)
- [ ] 04-03-PLAN.md — Previous performance inline display and PR detection with celebration overlay
- [ ] 04-04-PLAN.md — Offline sync queue, session summary, weight target prompts, crash recovery, human verification

### Phase 5: Workout History
**Goal**: Users can review every past workout session in a scrollable log and see estimated 1RM calculations — the foundation that makes progress charts meaningful.
**Depends on**: Phase 4
**Requirements**: HIST-01, HIST-06
**Success Criteria** (what must be TRUE):
  1. User can view a chronological list of past sessions showing date, exercises performed, and total volume
  2. User can tap a session to see full detail (every set logged, weight, reps)
  3. Estimated 1RM is shown for each logged set (calculated via the Epley formula) and stored for chart use
**Plans:** 2 plans

Plans:
- [ ] 05-01-PLAN.md — Data layer: migration (estimated_1rm column), types, Epley utils, volume calc, historyStore, useHistory/useSessionDetail hooks, unit tests
- [ ] 05-02-PLAN.md — UI layer: PagerView sub-tabs (Plans | History), session list with filter, session detail with exercise cards, 1RM display, delta indicators, delete, human verification

### Phase 6: Progress Charts + Dashboard
**Goal**: Users can see their strength trending upward on per-exercise charts and arrive at a dashboard home screen showing today's plan and recent stats — the motivational feedback loop that makes the app worth opening every day.
**Depends on**: Phase 5
**Requirements**: HIST-02, HIST-03, DASH-01, DASH-02
**Success Criteria** (what must be TRUE):
  1. User can open any exercise and see a chart of estimated 1RM, max weight, and total volume over time using working sets only
  2. User can log their bodyweight and view a bodyweight trend chart over time
  3. Home screen shows a progress summary including recent PRs, streak count, and recent stats
  4. Home screen shows today's planned workout (from the active plan) with a quick-start button that launches the active workout screen
**Plans:** 3/3 plans complete

Plans:
- [x] 06-01-PLAN.md — Data layer: Victory Native XL + Skia install, types, chartHelpers, bodyweight migration, chart RPC aggregation, bodyweightStore, all data hooks (chart data, bodyweight, today's workout, progress summary), unit tests (completed 2026-03-10)
- [x] 06-02-PLAN.md — Chart UI: exercise progress chart screen (metric tabs, time ranges, empty states), Sparkline component, BodyweightCard with inline logging (completed 2026-03-10)
- [ ] 06-03-PLAN.md — Dashboard refactor: TodaysWorkoutCard (3 states), ProgressSummaryCard (streak + PRs + stats + sparklines), compose cards in locked order, remove Sign Out

### Phase 7: Body Metrics
**Goal**: Users can track body composition changes via body measurements (chest, waist, biceps, quad, body fat %) with a combined dashboard card and full detail screen featuring charts and history. Progress photos (HIST-05) deferred per user decision.
**Depends on**: Phase 6
**Requirements**: HIST-04, HIST-05
**Success Criteria** (what must be TRUE):
  1. User can log body measurements (chest, waist, biceps, quad, body fat %) with a date and view past entries
  2. Dashboard shows a combined Body card with latest bodyweight + measurements, tappable to open detail screen
  3. Detail screen has Charts tab (entry form + per-measurement trend charts) and History tab (reverse-chronological list with edit/delete)
**Plans:** 4/4 plans complete

Plans:
- [x] 07-01-PLAN.md — Data layer: body_measurements migration + RLS, types, unit conversion utils, bodyMeasurementStore (Zustand + MMKV), CRUD hooks, chart data hook, combined BodyCard on dashboard
- [x] 07-02-PLAN.md — Full body metrics detail screen: PagerView Charts/History tabs, measurement entry form (4 fields + bodyweight, per-input unit toggles, date picker), per-measurement trend charts, history list with edit/delete, human verification
- [ ] 07-03-PLAN.md — Gap closure: replace hips with biceps/quad across entire vertical slice (migration, types, form, charts, history, dashboard, CSV)
- [ ] 07-04-PLAN.md — Gap closure: fix bodyweight date picker bug, show bodyweight in history items

### Phase 8: Alarms + Accountability
**Goal**: Users are woken up for planned training days by a real alarm that must be dismissed, and receive a nudge notification any time they skip a planned session — the accountability loop that makes the app a training partner, not just a logger.
**Depends on**: Phase 3
**Requirements**: ALRM-01, ALRM-02, ALRM-03
**Success Criteria** (what must be TRUE):
  1. When creating or editing a plan day, user is prompted to set an alarm time for that day — alarm setup is part of plan creation, not a separate settings screen
  2. On a scheduled training day, the alarm fires at the set time with sound and vibration, displays a full-screen notification, and requires explicit dismissal before it stops
  3. If a planned training day passes without a logged workout session, the user receives a nudge notification before the end of that day
**Plans:** 4 plans (3 executed + 1 gap closure)

Plans:
- [ ] 08-01-PLAN.md — Data layer: expo-notifications install, migration (alarm columns on plan_days), alarm types/constants/utils, notification setup, alarm scheduler, alarmStore, Jest mocks, unit tests
- [ ] 08-02-PLAN.md — Alarm UI: time picker row in DaySlotEditor (toggle + picker when weekday mapped), alarm scheduling wired into plan save/delete/activate, notification category + snooze handler on app startup
- [ ] 08-03-PLAN.md — Missed workout nudge: auto-cancel on workout completion, settings screen with global alarm pause toggle
- [ ] 08-04-PLAN.md — Gap closure: show alarm time in read-only plan details view (PlanDaySection)

### Phase 9: Polish
**Goal**: The app looks and feels like a deliberate, dark-and-bold tool -- not a prototype -- with consistent magenta theming, branded icon/splash, and the OTA update pipeline in place for rapid iteration once the friend group is using it.
**Depends on**: Phase 8
**Requirements**: (no unassigned v1 requirements -- delivery quality gate)
**Success Criteria** (what must be TRUE):
  1. App applies the dark/bold design language consistently across all screens (dark background, clean typography, accent colors that pop -- no default white/light screens remaining)
  2. App icon and splash screen are set and display correctly on both iOS and Android
  3. EAS Update OTA pipeline is configured and a test update successfully reaches a device without a new store submission
**Plans:** 3/3 plans complete

Plans:
- [ ] 09-01-PLAN.md -- Theme accent swap (blue to magenta) and centralize all hardcoded colors into theme.ts
- [ ] 09-02-PLAN.md -- App icon/splash screen generation, app rename to "RPE", navigation transitions
- [ ] 09-03-PLAN.md -- EAS Update OTA pipeline configuration, Skeleton loading component

### Phase 10: Distribution
**Goal**: The app is installable by the friend group on real iOS devices via TestFlight and all critical behaviors (offline logging, alarm delivery, RLS isolation, plan-history separation) are verified on physical hardware before distribution. Android distribution deferred.
**Depends on**: Phase 9
**Requirements**: (no unassigned v1 requirements -- distribution gate)
**Success Criteria** (what must be TRUE):
  1. App builds successfully via EAS Build and installs on a physical iOS device via TestFlight
  2. On a physical iOS device: alarm fires with sound and vibration and requires dismissal
  3. On a physical device with no network: user can log a full workout session, reconnect, and see it appear in history
  4. A second test account cannot read or modify the first account's workout data (RLS isolation confirmed)
  5. Editing a plan does not alter previously logged workout sessions (plan-history isolation confirmed)
**Plans:** 2 plans

Plans:
- [ ] 10-01-PLAN.md — EAS Build config fixes (expo-notifications plugin, submit config, EAS secrets), App Store Connect listing, build + auto-submit to TestFlight
- [ ] 10-02-PLAN.md — Interactive device verification script, physical device testing checkpoint

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9 -> 10 -> 11 -> 12 -> 13 -> 14

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 4/4 | Complete   | 2026-03-09 |
| 2. Exercise Library | 2/2 | Complete   | 2026-03-09 |
| 3. Plan Builder | 3/3 | Complete   | 2026-03-09 |
| 4. Active Workout | 6/6 | Complete   | 2026-03-10 |
| 5. Workout History | 0/2 | Not started | - |
| 6. Progress Charts + Dashboard | 3/3 | Complete   | 2026-03-10 |
| 7. Body Metrics | 4/4 | Complete   | 2026-03-12 |
| 8. Alarms + Accountability | 3/4 | In Progress|  |
| 9. Polish | 3/3 | Complete   | 2026-03-11 |
| 10. Distribution | 0/2 | Not started | - |
| 11. Settings + Account Management | 3/3 | Complete    | 2026-03-11 |
| 12. Proper Onboarding | 1/2 | In Progress|  |
| 13. Coaching Options | 0/6 | Planned | - |

### Phase 11: Add settings tab, move sign out to it and have a delete account option with data export

**Goal:** Users have a dedicated Settings tab for account management -- unit preferences, alarm controls, data export (CSV via share sheet), sign out with confirmation, and account deletion with password re-entry, 7-day grace period, and server-side cleanup via Supabase Edge Function.
**Requirements**: SETT-01, SETT-02, SETT-03, SETT-04, SETT-05, SETT-06, SETT-07
**Depends on:** Phase 10
**Plans:** 3/3 plans complete

Plans:
- [ ] 11-01-PLAN.md — Settings tab route (4th tab), profile header, preference toggles (weight/measurement units), notifications section, account section with sign out confirmation
- [ ] 11-02-PLAN.md — CSV data export: generation utilities with tests, Supabase queries for all data categories, share sheet integration
- [ ] 11-03-PLAN.md — Delete account: migration, Edge Function, password re-entry, 7-day grace period banner on dashboard, wire all Settings actions together

### Phase 12: Proper Onboarding

**Goal:** New users experience a 4-step onboarding flow (Unit Preferences > PR Baselines > Body Stats Baseline > First Plan Prompt) that collects preferences and baseline data via PagerView with swipe navigation, replacing the old single-screen PR-only onboarding. Existing users are unaffected.
**Requirements**: OB-01, OB-02, OB-03, OB-04, OB-05, OB-06
**Depends on:** Phase 11
**Plans:** 1/2 plans executed

Plans:
- [ ] 12-01-PLAN.md — OnboardingPager structure (PagerView + StepDots), UnitPreferencesStep, PRBaselineStep, route guard update
- [ ] 12-02-PLAN.md — BodyStatsStep, FirstPlanPromptStep, full flow wiring, human verification

### Phase 13: Coaching Options

**Goal:** One user (coach) can create and manage workout plans for another user (trainee), receive push notifications when trainees complete workouts or hit PRs, get a weekly adherence summary, and update trainee plans with inline performance data. This is the app's first multi-user interaction feature.
**Requirements**: COACH-01, COACH-02, COACH-03, COACH-04, COACH-05, COACH-06, COACH-07, COACH-08, COACH-09, COACH-10, COACH-11, COACH-12, COACH-13, COACH-14, COACH-15, COACH-16
**Depends on:** Phase 12
**Success Criteria** (what must be TRUE):
  1. Coach can generate an invite code and a trainee can enter it to establish a coaching relationship
  2. Coach can create and edit workout plans targeting a specific trainee, with inline last-week performance data
  3. Coach receives push notifications when trainee completes a workout or hits a PR
  4. Trainee receives push notification when coach updates their plan (with optional note)
  5. Coach receives a weekly adherence summary for all trainees every Sunday evening
  6. Coach-assigned plans are visually distinguished and read-only in trainee's Plans tab
  7. Either party can disconnect the coaching relationship unilaterally
**Plans:** 6 plans


Plans:
- [ ] 13-00-PLAN.md — Wave 0: Test stubs for coaching logic modules (inviteCode, useCoaching, coachPlans, pushToken)
- [ ] 13-01-PLAN.md — Database schema (coaching_relationships, invite_codes, push_tokens, coach_notes, plan extension), TypeScript types, push token registration
- [ ] 13-02-PLAN.md — send-push Edge Function (generic push notification dispatch via Expo Push API)
- [ ] 13-03-PLAN.md — Coaching relationship management: coachingStore, invite code flow, Plans tab toggle, coach/trainee UI components
- [ ] 13-04-PLAN.md — Coach plan management: plan CRUD targeting trainee, inline performance, coach notes, trainee plans screen, trainee workout history
- [ ] 13-05-PLAN.md — Notification triggers (workout complete, PR, plan update), weekly summary Edge Function, push token registration on startup

### Phase 14: feature to add and save videos of a certain set. can be viewed in history and in seperate tab in settings.

**Goal:** [To be planned]
**Requirements**: TBD
**Depends on:** Phase 13
**Plans:** 0 plans

Plans:
- [ ] TBD (run /gsd:plan-phase 14 to break down)
