# Roadmap: GymApp

## Overview

Build a React Native gym companion app for a small friend group using Expo SDK 55 and Supabase. The journey starts with a solid foundation (auth + schema) that every other feature depends on, layers in exercise library and plan builder as the structural dependencies, then delivers the core daily-use surface (active workout focus mode with offline-first logging), followed by history, charts, body metrics, and accountability alarms. The final two phases harden and distribute the app to the friend group. All 29 v1 requirements land in Phases 1-8; Phases 9-10 are delivery gates with no orphaned requirements.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation** - Expo project scaffold, Supabase schema, RLS, auth screens, offline session handling, PR baseline setup
- [ ] **Phase 2: Exercise Library** - Pre-loaded exercise database, custom exercise creation, searchable exercise picker
- [ ] **Phase 3: Plan Builder** - Named plans, day assignment, per-day exercise configuration with full detail, plan CRUD
- [ ] **Phase 4: Active Workout** - Focus mode screen, set logging, previous performance reference, PR detection, offline-first writes
- [ ] **Phase 5: Workout History** - Past session list, session detail view, estimated 1RM calculation
- [ ] **Phase 6: Progress Charts + Dashboard** - Per-exercise progress charts, bodyweight chart, dashboard home screen
- [ ] **Phase 7: Body Metrics** - Body measurements, progress photos, Supabase Storage integration
- [ ] **Phase 8: Alarms + Accountability** - Plan-day-tied alarms, real alarm delivery, missed workout nudge
- [ ] **Phase 9: Polish** - Dark/bold theme refinement, edge case handling, app icon, splash screen, OTA pipeline
- [ ] **Phase 10: Distribution** - EAS Build, TestFlight, APK/AAB, physical device checklist verification

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
**Plans:** 3 plans

Plans:
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
**Plans**: TBD

Plans:
- [ ] 02-01: Exercise seed data (Supabase migration with common lifts) and exercise library screen with search/filter
- [ ] 02-02: Custom exercise creation form and CRUD operations

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
**Plans**: TBD

Plans:
- [ ] 03-01: Plan creation flow (name, day assignment) and plan list screen
- [ ] 03-02: Per-day exercise assignment with full detail (sets/reps/weight/RPE/notes)
- [ ] 03-03: Plan edit and delete operations

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
**Plans**: TBD

Plans:
- [ ] 04-01: Active workout session state (Zustand store, MMKV persistence, crash recovery on app launch)
- [ ] 04-02: Focus mode screen (one exercise at a time, oversized tap targets, set logging UI)
- [ ] 04-03: Previous performance reference (last session inline display) and PR detection
- [ ] 04-04: Offline-first sync (MMKV write buffer, NetInfo connectivity detection, TanStack Query mutation queue)

### Phase 5: Workout History
**Goal**: Users can review every past workout session in a scrollable log and see estimated 1RM calculations — the foundation that makes progress charts meaningful.
**Depends on**: Phase 4
**Requirements**: HIST-01, HIST-06
**Success Criteria** (what must be TRUE):
  1. User can view a chronological list of past sessions showing date, exercises performed, and total volume
  2. User can tap a session to see full detail (every set logged, weight, reps)
  3. Estimated 1RM is shown for each logged set (calculated via the Epley formula) and stored for chart use
**Plans**: TBD

Plans:
- [ ] 05-01: Workout history list and session detail screens (TanStack Query with Supabase nested select)
- [ ] 05-02: Epley 1RM calculation, storage, and display in session detail

### Phase 6: Progress Charts + Dashboard
**Goal**: Users can see their strength trending upward on per-exercise charts and arrive at a dashboard home screen showing today's plan and recent stats — the motivational feedback loop that makes the app worth opening every day.
**Depends on**: Phase 5
**Requirements**: HIST-02, HIST-03, DASH-01, DASH-02
**Success Criteria** (what must be TRUE):
  1. User can open any exercise and see a chart of estimated 1RM, max weight, and total volume over time using working sets only
  2. User can log their bodyweight and view a bodyweight trend chart over time
  3. Home screen shows a progress summary including recent PRs, streak count, and recent stats
  4. Home screen shows today's planned workout (from the active plan) with a quick-start button that launches the active workout screen
**Plans**: TBD

Plans:
- [ ] 06-01: Per-exercise progress charts (Victory Native XL, Skia, working-set filtering, Supabase server-side aggregation)
- [ ] 06-02: Bodyweight log entry and bodyweight trend chart
- [ ] 06-03: Dashboard home screen (today's planned workout, PR summary, recent stats)

### Phase 7: Body Metrics
**Goal**: Users can track body composition changes — measurements and progress photos — with photos stored privately in Supabase Storage accessible only to the owning user.
**Depends on**: Phase 6
**Requirements**: HIST-04, HIST-05
**Success Criteria** (what must be TRUE):
  1. User can log body measurements (chest, waist, hips, body fat %) with a date and view past entries
  2. User can take or select a progress photo (front/side/back), save it with a date, and view past photos in a timeline
  3. Progress photos are stored in a private Supabase Storage bucket and are not publicly accessible
**Plans**: TBD

Plans:
- [ ] 07-01: Body measurements log (entry form, history list)
- [ ] 07-02: Progress photos (expo-image-picker, private Supabase Storage bucket, signed URL display, date-stamped timeline)

### Phase 8: Alarms + Accountability
**Goal**: Users are woken up for planned training days by a real alarm that must be dismissed, and receive a nudge notification any time they skip a planned session — the accountability loop that makes the app a training partner, not just a logger.
**Depends on**: Phase 3
**Requirements**: ALRM-01, ALRM-02, ALRM-03
**Success Criteria** (what must be TRUE):
  1. When creating or editing a plan day, user is prompted to set an alarm time for that day — alarm setup is part of plan creation, not a separate settings screen
  2. On a scheduled training day, the alarm fires at the set time with sound and vibration, displays a full-screen notification, and requires explicit dismissal before it stops
  3. If a planned training day passes without a logged workout session, the user receives a nudge notification before the end of that day
**Plans**: TBD

Plans:
- [ ] 08-01: Alarm setup integrated into plan day creation flow (notifee, deterministic notification IDs, SCHEDULE_EXACT_ALARM + RECEIVE_BOOT_COMPLETED permissions)
- [ ] 08-02: Real alarm delivery (full-screen intent on Android, best-effort on iOS, persistence across device reboot)
- [ ] 08-03: Missed workout nudge (Supabase Edge Function cron or expo-task-manager background check, end-of-day notification)

### Phase 9: Polish
**Goal**: The app looks and feels like a deliberate, dark-and-bold tool — not a prototype — with the OTA update pipeline in place for rapid iteration once the friend group is using it.
**Depends on**: Phase 8
**Requirements**: (no unassigned v1 requirements — delivery quality gate)
**Success Criteria** (what must be TRUE):
  1. App applies the dark/bold design language consistently across all screens (dark background, clean typography, accent colors that pop — no default white/light screens remaining)
  2. App icon and splash screen are set and display correctly on both iOS and Android
  3. EAS Update OTA pipeline is configured and a test update successfully reaches a device without a new store submission
**Plans**: TBD

Plans:
- [ ] 09-01: Dark/bold theme pass (NativeWind dark mode, typography, accent colors, consistent across all screens)
- [ ] 09-02: App icon, splash screen, and EAS Update OTA pipeline configuration

### Phase 10: Distribution
**Goal**: The app is installable by the friend group on real iOS and Android devices and all critical behaviors (offline logging, alarm delivery, RLS isolation, plan-history separation) are verified on physical hardware before distribution.
**Depends on**: Phase 9
**Requirements**: (no unassigned v1 requirements — distribution gate)
**Success Criteria** (what must be TRUE):
  1. App builds successfully via EAS Build and installs on a physical iOS device via TestFlight
  2. App builds successfully via EAS Build and installs on a physical Android device via APK or AAB
  3. On a physical Android device: alarm fires after device reboot with sound and vibration and requires dismissal
  4. On a physical device with no network: user can log a full workout session, reconnect, and see it appear in history
  5. A second test account cannot read or modify the first account's workout data (RLS isolation confirmed)
**Plans**: TBD

Plans:
- [ ] 10-01: EAS Build configuration (iOS + Android), TestFlight submission, APK/AAB distribution
- [ ] 10-02: Physical device checklist verification (alarm after reboot, offline logging + sync, RLS cross-user test, plan-edit history isolation, progress photo private bucket access)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9 -> 10

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 0/3 | Planning complete | - |
| 2. Exercise Library | 0/2 | Not started | - |
| 3. Plan Builder | 0/3 | Not started | - |
| 4. Active Workout | 0/4 | Not started | - |
| 5. Workout History | 0/2 | Not started | - |
| 6. Progress Charts + Dashboard | 0/3 | Not started | - |
| 7. Body Metrics | 0/2 | Not started | - |
| 8. Alarms + Accountability | 0/3 | Not started | - |
| 9. Polish | 0/2 | Not started | - |
| 10. Distribution | 0/2 | Not started | - |
