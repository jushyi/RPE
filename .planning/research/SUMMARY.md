# Project Research Summary

**Project:** Gym App — Strength Training Workout Tracker
**Domain:** Mobile fitness/gym tracking app (React Native + Supabase)
**Researched:** 2026-03-09
**Confidence:** HIGH (stack and architecture HIGH; features and pitfalls HIGH based on cross-referenced sources)

## Executive Summary

This is a personal strength-tracking mobile app targeting a small friend group, built with React Native (Expo SDK 55) and Supabase as the backend. The industry-proven approach for this type of product is a layered architecture: file-based navigation via Expo Router, a clear split between client state (Zustand for the active workout session) and server state (TanStack Query for cached history and plan data), with Supabase providing authentication, PostgreSQL with Row Level Security, and Storage for progress photos. The recommended stack is mature, well-documented, and validated for this exact use case. The most important design commitment is offline-first workout logging — gym connectivity is unreliable, and the active workout screen must function in airplane mode.

The app has two clear product differentiators versus established competitors (Strong, Hevy): a focus-mode workout screen that shows one exercise at a time (reducing cognitive load during training), and a plan-day-tied real alarm system integrated directly into plan creation (not a separate reminders setup). These are not incremental improvements — they are the reason to build this app rather than recommending users download Hevy. All other features (exercise library, set logging, rest timer, PR detection, progress charts, body metrics) are table stakes that must be executed well but are not differentiating.

The highest-risk areas are the offline sync strategy, the alarm delivery reliability across iOS and Android, and the database schema design for separating planned workout templates from logged actuals. These are not implementation details — they are architectural decisions that are expensive or impossible to retrofit. Getting the schema right at the start (plans as templates, sessions as independent snapshots of actual performance) and implementing local-first writes from day one will determine whether the app is trustworthy at the gym. The alarm system requires `notifee` (not just `expo-notifications`) for reliable full-screen alarm behavior on Android, and the iOS story is best-effort without Apple's Critical Alerts entitlement.

---

## Key Findings

### Recommended Stack

The stack is built on Expo SDK 55 (React Native 0.83, React 19.2), which mandates the New Architecture — this is not optional and affects every native module choice. Expo Router v7 provides file-based navigation. Supabase JS v2.98+ covers all backend needs: auth, PostgreSQL queries, Storage, and real-time. State is split across Zustand (active workout session, UI flags) and TanStack Query v5 (cached server data). UI is handled by NativeWind v4 (pinned to 4.1.23 + tailwindcss 3.4.17 — do not use v5). Charts use Victory Native XL with Skia rendering (GPU-accelerated, not SVG). Local storage uses MMKV for app state and AsyncStorage only for the Supabase Auth session adapter (per Supabase's own recommendation). All peer dependencies for charts and gestures are bundled with Expo SDK 55. Version pinning matters: Reanimated v4 (not v3), NativeWind 4.1.23 (not v5), MMKV v4+ (TurboModule, requires New Architecture).

**Core technologies:**
- **Expo SDK 55**: App framework — New Architecture mandatory, EAS Build for distribution, no Mac required
- **Expo Router v7**: Navigation — file-based routing, typed routes, tab+stack layout
- **Supabase JS ^2.98.0**: Backend — auth, PostgreSQL, Storage, real-time in one SDK
- **Zustand ^5.0.11**: Client state — synchronous reads, 2.7KB, persisted to MMKV
- **TanStack Query v5**: Server state — caching, offline mutation queuing, deduplication
- **react-native-mmkv ^4.2.0**: Local storage — 30x faster than AsyncStorage, required for Zustand persistence
- **NativeWind 4.1.23**: Styling — Tailwind utility classes, dark mode support, stable pairing with tailwindcss 3.4.17
- **react-native-reanimated v4**: Animations — New Architecture only, GPU-thread animations for focus mode transitions
- **Victory Native XL ^41.20.2**: Charts — Skia-rendered progress charts (not SVG-based)
- **expo-notifications**: Local alarm scheduling — but `notifee` is needed for true alarm behavior on Android
- **react-hook-form + Zod**: Forms and validation — minimal re-renders, type-safe schema validation

### Expected Features

The feature set divides clearly into P1 (must ship), P2 (add after validation), and P3 (defer). The feature dependency chain is strict: auth enables everything; exercise library enables plans; plans enable alarms and the missed workout nudge; logged sessions enable history and progress charts.

**Must have (table stakes — P1):**
- User authentication (Supabase email/password)
- Exercise library (pre-loaded common lifts + custom exercise creation)
- Plan builder (days mapped to exercises with sets/reps/target weight/RPE/notes)
- Focus mode active workout screen (one exercise at a time, oversized tap targets)
- Set logging with previous performance reference (last session's numbers shown inline)
- Rest timer (auto-start on set completion, configurable duration)
- Workout history log (date, exercises, total volume)
- PR detection (inline during active workout)
- Progress charts per exercise (estimated 1RM, max weight, total volume over time)
- Body weight tracking (date + weight + chart)
- Plan-day-tied alarms (real alarms with sound/vibration, integrated into plan creation)
- Missed workout nudge (inactivity detection against plan days)
- Cloud sync via Supabase
- Offline-first active workout logging

**Should have (differentiators — P2):**
- RPE per set (serious lifters use this; neither Strong nor Hevy support it)
- Estimated 1RM display on charts
- Body measurements + progress photos (high retention value)
- Dashboard home screen (today's plan + recent stats)
- Plate calculator (low complexity, high perceived value)

**Defer (v2+):**
- Social feed / activity sharing (explicit out of scope; shared notifications cover accountability)
- Pre-made program templates (useful once plan builder is validated)
- Apple Watch / wearable integration (mobile-first first)
- AI workout recommendations (requires training data, premature)
- Video exercise demos (storage/CDN complexity not justified for friend group)

### Architecture Approach

The architecture is a 4-layer stack: Presentation (Expo Router screens) → Business Logic (custom hooks that compose all state and side effects) → State (Zustand for client, TanStack Query for server) → Services (Supabase client, notification service, MMKV). Screens never import Supabase or Zustand directly — they call only custom hooks. This boundary makes screens trivially thin and hooks independently testable. Supabase Row Level Security enforces per-user data isolation at the database level, meaning application code never needs to filter by user ID. The notification system is an isolated service module with deterministic notification IDs (alarm-${planDayId}) for reliable cancel/reschedule when plans change.

**Major components:**
1. **Expo Router file-based routes** (`app/`) — route files only; screens import from `features/`
2. **Feature modules** (`features/auth`, `features/workouts`, `features/plans`, `features/metrics`, `features/alarms`) — hooks, components, types colocated per feature
3. **Zustand activeWorkoutStore** — holds live session state (current exercise index, logged sets, timer); persisted to MMKV on every change
4. **TanStack Query cache** — caches all Supabase responses; invalidated on mutations; source of truth for screens
5. **Supabase singleton client** (`lib/supabase/client.ts`) — initialized once; RLS auto-scopes all queries to the authenticated user
6. **Notification service** (`lib/notifications/setup.ts`) — schedules/cancels alarms using deterministic plan-day IDs
7. **Database schema** — `exercises` → `plans` → `plan_days` → `plan_exercises` (templates); `workout_sessions` → `session_sets` (actuals, snapshotted at log time)

### Critical Pitfalls

1. **Active session state lost on app background/crash** — Store all active workout state (current exercise index, logged sets, timer) to MMKV on every change. Check for in-progress session on app launch. Never use component-local state for workout data. Recovery cost if ignored: MEDIUM (retrofit adds persistence but cannot recover lost data).

2. **Supabase RLS disabled or misconfigured** — Enable RLS on every table the moment it is created, before writing application code. Test by logging in as a second user and attempting to query the first user's data via the app client (not SQL Editor — that bypasses RLS). Add `user_id` indexes on all policy columns. Recovery cost if ignored: LOW to fix the policy, but any data breach cannot be undone.

3. **Workout plan schema too rigid — plan edits corrupt history** — Separate plan templates (`plans → plan_days → plan_exercises`) from logged actuals (`sessions → session_sets`). Session sets must snapshot exercise name and target weight at log time, not just store a FK to `plan_exercise_id`. Recovery cost if ignored: HIGH — schema migration with potential unrecoverable history corruption.

4. **Alarm system brittle on real devices** — `expo-notifications` alone is insufficient for true alarm behavior. Use `notifee` for full-screen intent on Android. Add `SCHEDULE_EXACT_ALARM` and `RECEIVE_BOOT_COMPLETED` permissions. Test on physical iOS and Android devices, not simulators. iOS alarms are best-effort (DND/Low Power Mode can silence them). Recovery cost if ignored: MEDIUM — migration to `notifee` requires a new native build.

5. **No offline support causes data loss at the gym** — All set logging must write to MMKV (local) immediately and sync to Supabase only when connectivity is confirmed. Never block the workout logging UI on a network operation. Use `@react-native-community/netinfo` to detect connectivity. Recovery cost if ignored: MEDIUM — retro-fitting requires architectural change; logged data cannot be recovered.

6. **Auth session cleared when app opened offline** — Supabase's auto-refresh can clear the JWT session on network failure, logging the user out at the gym. Use `expo-secure-store` for token storage and detect offline state before triggering token refresh. Recovery cost if ignored: LOW (data is safe; it's a UX regression, but fixable quickly).

7. **Progress charts show misleading data without proper aggregation** — Add `set_type` field (`warmup`, `working`, `failure`) to the sets schema. Charts should plot best working-set per session (estimated 1RM via Epley formula), not all raw sets. Use Supabase server-side aggregation, not client-side filtering of large datasets. Recovery cost if ignored: LOW to update the chart query; the `set_type` field migration is straightforward.

---

## Implications for Roadmap

Research points to a clear 10-phase build order driven by feature dependencies. The schema and auth foundation must precede everything. The active workout screen is the core daily-use surface and must be built early with offline support baked in — retrofitting offline is expensive. Alarms and nudges depend on plans existing, so they naturally land near the end.

### Phase 1: Foundation — Database Schema + Auth + Project Setup
**Rationale:** Nothing works without auth and a correct schema. RLS and the plan/session split are schema-level decisions that are extremely costly to change after data exists. This phase must happen before any feature work.
**Delivers:** Expo project scaffolded (SDK 55, Expo Router, TypeScript, NativeWind, Zustand, TanStack Query), Supabase project with full schema, RLS on all user-data tables, auth screens (email/password), expo-secure-store session persistence, offline-safe auth session handling.
**Addresses pitfalls:** RLS misconfiguration, rigid plan schema, auth session lost offline.
**Research flag:** Standard patterns — well-documented Supabase + Expo auth setup. Skip deeper research.

### Phase 2: Exercise Library
**Rationale:** Exercise library is a hard dependency for plan builder and active workout screen. Must exist before either can be built. Pre-loading seed data now avoids a code-deploy requirement for exercise additions.
**Delivers:** Pre-loaded exercise database (common lifts seeded to Supabase on first auth), custom exercise creation (name + muscle group + equipment), searchable exercise picker component.
**Addresses pitfalls:** Hardcoding exercises in code (must be database-driven to support custom creation).
**Research flag:** Standard patterns — CRUD feature with static seed data. Skip deeper research.

### Phase 3: Plan Builder
**Rationale:** Plans are a dependency for the alarm system and the missed workout nudge. The plan builder is the highest-complexity table-stakes feature (rated HIGH complexity in FEATURES.md). Building it before the active workout screen means the workout screen can immediately use real plan data.
**Delivers:** Plan creation (name, days of week), per-day exercise assignment (exercise, sets, reps, target weight, RPE, notes), plan list and edit views, plan storage in Supabase (`plans → plan_days → plan_exercises`).
**Uses:** TanStack Query mutations for plan save/update, Zustand for draft plan state during creation.
**Research flag:** Standard patterns — form-driven CRUD with nested data. Skip deeper research.

### Phase 4: Active Workout — Focus Mode (Core Loop)
**Rationale:** This is the highest-value screen in the app and the daily-use surface. It must be built with offline support from the start (retrofitting is architectural). Session state persistence to MMKV is non-negotiable and must be part of initial implementation. This phase validates the core product.
**Delivers:** Focus mode screen (one exercise at a time, oversized tap targets), set logging (weight + reps + RPE), previous performance reference (last session's numbers shown inline), rest timer (auto-start on set completion), PR detection (inline during active workout), estimated 1RM calculation, offline-first writes (MMKV → Supabase sync on restore), in-progress session recovery on app launch.
**Addresses pitfalls:** Active session state lost, no offline support, UI re-render performance.
**Research flag:** Needs attention — offline sync strategy (MMKV buffer + NetInfo connectivity detection + mutation queue) should be validated before implementation. Consider a brief research phase.

### Phase 5: Workout History Log
**Rationale:** Depends on Phase 4 (sessions must be logged before history is meaningful). Required by progress charts (Phase 6). Low complexity — straightforward read from Supabase with TanStack Query.
**Delivers:** Workout history list (date, exercises, total volume), session detail view, searchable/filterable by date.
**Uses:** TanStack Query for cached history fetches; Supabase nested select for session + sets in one query (avoids N+1).
**Addresses pitfalls:** N+1 query trap in history loading.
**Research flag:** Standard patterns. Skip deeper research.

### Phase 6: Progress Charts + Dashboard
**Rationale:** Depends on workout history (Phase 5). Charts need historical data. This phase delivers the core motivational feedback loop: users see their strength trending upward.
**Delivers:** Per-exercise progress charts (estimated 1RM, max weight, total volume over time using working sets only), body weight chart, PR markers on charts, basic dashboard (today's planned workout + recent stats), estimated 1RM display.
**Uses:** Victory Native XL (Skia-rendered), Supabase server-side aggregation (MAX, window functions — not client-side filtering).
**Addresses pitfalls:** Misleading progress charts (working-set filtering, Epley formula, server-side aggregation).
**Research flag:** Standard patterns for charts. The aggregation query design warrants care but follows PostgreSQL window function patterns.

### Phase 7: Body Metrics — Bodyweight + Measurements + Progress Photos
**Rationale:** Partially independent of the workout tracking loop. Bodyweight is low complexity (P1 in FEATURES.md). Body measurements and progress photos add high retention value and can be shipped together.
**Delivers:** Bodyweight log (date + weight + chart), body measurements (circumference entries), progress photos (capture via expo-image-picker, upload to private Supabase Storage bucket, display with expo-image), side-by-side photo comparison.
**Addresses pitfalls:** Progress photos in public bucket (must use private bucket + signed URLs).
**Research flag:** Progress photo storage pattern is well-documented with Supabase Storage. Skip deeper research.

### Phase 8: Alarms + Missed Workout Nudge
**Rationale:** Depends on plans (Phase 3) — alarms are meaningless without plan days. This is the app's most distinctive differentiator. Alarm reliability requires `notifee` for true Android alarm behavior; must be verified on physical devices.
**Delivers:** Plan-day-tied alarm setup (integrated into plan day creation flow, not buried in settings), real alarms (sound + vibration, using `notifee` for full-screen intent on Android), alarm persistence across device reboots (`RECEIVE_BOOT_COMPLETED`), missed workout nudge (background task via expo-task-manager checks for planned days with no logged session, fires notification at end of day).
**Addresses pitfalls:** Alarm brittleness on real devices, notification duplicate accumulation (deterministic IDs).
**Research flag:** Needs research phase — `notifee` integration with Expo managed workflow, Android 14 `USE_FULL_SCREEN_INTENT` restrictions, iOS Critical Alerts entitlement feasibility, and background task reliability all warrant validation before implementation.

### Phase 9: Polish + P2 Features
**Rationale:** Once the core tracking loop is working and the friend group is using the app daily, add the high-value P2 features and quality-of-life improvements.
**Delivers:** RPE trend charts, plate calculator, dark/bold theme refinement, body fat % entry, partial body metric updates (allow logging weight without requiring all measurements), app icon and splash screen, EAS Update OTA pipeline.
**Research flag:** Standard patterns. Skip deeper research.

### Phase 10: Testing + Distribution
**Rationale:** Final validation before sharing with the friend group. EAS Build for TestFlight (iOS) and APK/AAB (Android). Physical device testing for alarms, offline behavior, and RLS.
**Delivers:** EAS Build pipeline, TestFlight distribution, "looks done but isn't" checklist verification (alarm delivery after reboot, offline set logging, RLS cross-user isolation, plan edit history isolation, progress chart working-set filtering, progress photo private bucket access).
**Research flag:** Standard EAS Build patterns. Skip deeper research.

### Phase Ordering Rationale

- **Schema first (Phase 1):** The plan/session separation and RLS setup are architectural decisions. Every subsequent phase builds on top of them — changing them after data exists is high cost.
- **Exercise library before plans (Phase 2 before 3):** You cannot create a plan without exercises to assign. This is a hard dependency.
- **Active workout before history and charts (Phase 4 before 5-6):** Charts have nothing to render without logged sessions. The focus mode screen is the source of all training data.
- **Offline-first in Phase 4, not later:** The PITFALLS research is explicit that retrofitting offline support is an architectural change. It must be part of the first workout logging implementation.
- **Alarms late (Phase 8):** Alarms depend on plans; plans depend on exercises. The alarm system is also the most technically fragile feature — building it last means the simpler features are validated first and the team has a full understanding of the notification infrastructure before tackling real-alarm complexity.

### Research Flags

**Needs deeper research during planning:**
- **Phase 4 (Active Workout):** Offline sync strategy — specifically the MMKV write buffer + NetInfo connectivity detection + TanStack Query offline mutation queue. The patterns exist but require careful sequencing to avoid race conditions on sync restore.
- **Phase 8 (Alarms):** `notifee` integration with Expo managed workflow (or bare workflow requirement), Android 14 `USE_FULL_SCREEN_INTENT` restrictions, iOS Critical Alerts entitlement process, and background task scheduling reliability across OS versions. This is the highest-risk implementation phase.

**Standard patterns (skip research-phase):**
- **Phase 1 (Foundation):** Supabase + Expo auth is officially documented with quickstart guides.
- **Phase 2 (Exercise Library):** Standard CRUD with static seed data.
- **Phase 3 (Plan Builder):** Standard nested form and CRUD patterns.
- **Phase 5 (Workout History):** Standard TanStack Query list + detail pattern.
- **Phase 6 (Charts):** Victory Native XL documentation covers the patterns; aggregation SQL is standard PostgreSQL.
- **Phase 7 (Body Metrics):** Supabase Storage photo upload is well-documented.
- **Phases 9-10 (Polish + Distribution):** EAS Build is standard Expo workflow.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Core stack (Expo SDK 55, Supabase, Zustand, TanStack Query, MMKV) verified via official documentation and changelogs. Version compatibility matrix cross-checked. NativeWind v4 / tailwindcss 3.4.17 pin is MEDIUM — stable as of March 2026 but pinning reflects known instability in v5 transition. |
| Features | HIGH | Cross-referenced across Strong, Hevy, MacroFactor competitor analysis and multiple fitness app development sources. Feature dependencies verified. MVP scope is well-defined. |
| Architecture | HIGH | Layered state pattern (Zustand + TanStack Query) is verified across multiple React Native architecture guides and a reference implementation. RLS, notification service module, and file-based structure are all officially documented. |
| Pitfalls | HIGH | All 7 critical pitfalls sourced from documented real-world failures (GitHub issues, developer post-mortems, official Supabase discussions). Recovery costs assessed. Phase-to-pitfall mapping is actionable. |

**Overall confidence:** HIGH

### Gaps to Address

- **`notifee` + Expo managed workflow compatibility:** PITFALLS.md recommends `notifee` over `expo-notifications` for true alarm behavior, but `notifee` traditionally requires ejecting from Expo managed workflow. The exact integration path (config plugin, bare workflow migration, or EAS Build config plugin) needs validation before Phase 8 planning begins. If `notifee` is incompatible with managed workflow, a bare workflow migration is required — this affects the entire project structure.

- **iOS Critical Alerts entitlement:** For true alarm behavior on iOS (sound through DND), Apple's Critical Alerts entitlement requires review and approval. The timeline and approval likelihood are unknown. The fallback position (best-effort notifications) should be communicated to stakeholders before Phase 8.

- **Offline sync conflict resolution:** The PITFALLS research recommends MMKV-buffered local writes with sync-on-restore, but does not address conflict resolution if the same session is somehow opened on two devices simultaneously. For a friend-group app this is an edge case, but the sync logic should handle it gracefully (last-write-wins by session ID is probably sufficient).

- **Background task reliability on iOS:** `expo-task-manager` background tasks for the missed workout nudge are not guaranteed to run on iOS. iOS aggressively restricts background execution. The nudge may need to be implemented as a server-side scheduled function (Supabase Edge Function with a cron trigger) rather than a device-side background task for reliable delivery.

---

## Sources

### Primary (HIGH confidence)
- [Expo SDK 55 Changelog](https://expo.dev/changelog/sdk-55) — SDK version, RN 0.83, New Architecture mandatory
- [Expo SDK 55 Upgrade Guide](https://expo.dev/blog/upgrading-to-sdk-55) — Breaking changes, Reanimated v4 requirement
- [Supabase Expo React Native Quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/expo-react-native) — Official Supabase + Expo setup
- [Supabase Row Level Security Docs](https://supabase.com/docs/guides/database/postgres/row-level-security) — RLS implementation
- [expo-notifications Docs](https://docs.expo.dev/versions/latest/sdk/notifications/) — Scheduling, SCHEDULE_EXACT_ALARM, sticky notifications
- [react-native-mmkv GitHub](https://github.com/mrousavy/react-native-mmkv) — v4.2.0, New Architecture requirement
- [Zustand GitHub Releases](https://github.com/pmndrs/zustand/releases) — v5.0.11, React Native compatibility
- [Expo App Folder Structure Best Practices](https://expo.dev/blog/expo-app-folder-structure-best-practices) — Official Expo structure guidance
- [Supabase Auth session lost when starting app offline](https://github.com/orgs/supabase/discussions/36906) — Offline auth pitfall

### Secondary (MEDIUM confidence)
- [NativeWind v4 Announcement](https://www.nativewind.dev/blog/announcement-nativewind-v4) — v4 stable, v5 pre-release
- [Victory Native XL GitHub](https://github.com/FormidableLabs/victory-native-xl) — v41.20.2, Skia + Reanimated peer deps
- [TanStack Query v5 Docs](https://tanstack.com/query/latest) — v5 current, React Native support
- [Zustand + TanStack Query Architecture Guide](https://dev.to/neetigyachahar/architecture-guide-building-scalable-react-or-react-native-apps-with-zustand-react-query-1nn4) — layered state pattern
- [Strong vs Hevy Comparison 2026](https://www.prpath.app/blog/strong-vs-hevy-2026.html) — competitor feature analysis
- [Notifee React Native Notifications](https://notifee.app/) — full-screen intent, Android alarm behavior
- [Making Expo Notifications Actually Work](https://medium.com/@gligor99/making-expo-notifications-actually-work-even-on-android-12-and-ios-206ff632a845) — Android 12+ alarm pitfalls
- [Designing a Data Structure to Track Workouts](https://1df.co/designing-data-structure-to-track-workouts/) — schema design guidance
- [Expo Router + TanStack + Supabase Sample](https://github.com/aaronksaunders/expo-router-supabase-tanstack) — reference implementation

### Tertiary (MEDIUM-LOW confidence, needs validation)
- [Developing an Offline-First Fitness App with React Native](https://dev.to/sathish_daggula/developing-an-offline-first-fitness-app-with-react-native-the-journey-of-gym-tracker-5a2h) — offline patterns, specific implementation details need verification
- [Run React Native Background Tasks 2026](https://dev.to/eira-wexford/run-react-native-background-tasks-2026-for-optimal-performance-d26) — background task reliability on iOS, needs validation against expo-task-manager specifically

---

*Research completed: 2026-03-09*
*Ready for roadmap: yes*
