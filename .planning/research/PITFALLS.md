# Pitfalls Research

**Domain:** Gym / Fitness Tracking Mobile App (React Native + Supabase)
**Researched:** 2026-03-09
**Confidence:** HIGH (critical pitfalls verified across multiple sources)

---

## Critical Pitfalls

### Pitfall 1: Active Workout Session State Lost When App Backgrounds or Crashes

**What goes wrong:**
A user is mid-workout, sets their phone down (screen locks), gets a call, or the OS kills the app to reclaim memory. When they return, the in-progress workout session is gone — sets logged, timer running, current exercise position all reset to zero. They either re-log from memory (inaccurate) or give up logging that session entirely.

**Why it happens:**
Developers store active workout state only in React component state or a Redux/Zustand store without persistence. The React Native JS thread can be paused or terminated by the OS at any time. Without explicit persistence on every state change, the data exists only in memory.

**How to avoid:**
Persist active workout state to AsyncStorage (or MMKV for speed) on every meaningful change — every set logged, every exercise advance, every timer tick. On app launch, check for an in-progress session before routing to the home screen and offer to resume. Treat the active workout screen as a recoverable checkpoint, not an ephemeral form.

**Warning signs:**
- Active workout screen is a plain React component with local `useState`
- No `AppState` listener that saves session when app backgrounds
- No "resume in-progress workout" check on app startup
- Timer implemented as `setInterval` without persistence

**Phase to address:**
Active Workout / Focus Mode phase — persistence must be part of the initial implementation, not a retrofit.

---

### Pitfall 2: Supabase RLS Disabled or Misconfigured — Every User Can Read/Write All Data

**What goes wrong:**
All workout logs, body metrics, and user data for every user are readable and writable by any authenticated user. In the worst case (RLS entirely disabled), the Supabase API exposes the full database to anyone with the anon key.

**Why it happens:**
Supabase creates tables with RLS disabled by default. Developers build the feature, see data flowing, and move on without enabling security. Even when RLS is enabled, a common secondary mistake is enabling it with no policies — which denies all access and causes mysterious empty query results — prompting developers to add an overly permissive `true` policy to "fix" it.

**How to avoid:**
Enable RLS on every table immediately when it is created, before writing any application code. For this app, every table with user data needs a policy like `auth.uid() = user_id`. Test RLS by running queries in the Supabase Table Editor as a specific user role (not the SQL Editor, which runs as postgres superuser and bypasses RLS entirely). Add `user_id` indexes on all policy columns to prevent sequential scans.

**Warning signs:**
- RLS toggle is OFF in Supabase table settings
- SQL Editor queries work but app queries return empty results (RLS enabled, no policies)
- A single `SELECT` policy with expression `true` exists
- `user_id` column has no index

**Phase to address:**
Auth + Backend Setup phase — RLS must be configured as tables are created, not after features are built.

---

### Pitfall 3: Alarm / Notification System Brittle Across iOS and Android

**What goes wrong:**
Alarms that work perfectly in development stop firing on real devices. On Android 12+, exact-time alarms require the `SCHEDULE_EXACT_ALARM` permission or they silently drift/fail in Doze mode. On iOS, there is no true "alarm" API — local notifications are best-effort and will not play sound if the device is in Do Not Disturb or Low Power Mode. The "alarm with mandatory dismiss" behavior described in the project requirements is a native alarm manager capability, not something standard push notifications provide.

**Why it happens:**
Developers reach for `expo-notifications` for everything notification-related. It is a good library, but it is a notification scheduler, not an alarm manager. The distinction matters: notifications can be silenced by the OS, muted by user settings, or dropped in Doze mode. Native alarm managers (Android `AlarmManager` with exact scheduling, iOS `UNUserNotificationCenter` with critical alerts entitlement) are separate APIs with stricter permissions but stronger delivery guarantees.

**How to avoid:**
Use `notifee` instead of `expo-notifications` for alarm-style notifications — it provides full-screen intent support on Android (the "pop over everything" alarm behavior) and high-priority channels. For iOS, apply for the Critical Alerts entitlement (requires Apple review) or accept that iOS notifications cannot guarantee sound through DND. Test on physical devices, not simulators. Add `SCHEDULE_EXACT_ALARM` and `RECEIVE_BOOT_COMPLETED` permissions to AndroidManifest so alarms survive device reboots.

**Warning signs:**
- Using `expo-notifications` without `notifee` for alarm use case
- No `SCHEDULE_EXACT_ALARM` permission in AndroidManifest
- Testing only in Expo Go or simulator (alarm behavior differs significantly in production)
- No handling of device reboot — scheduled notifications disappear when the phone restarts

**Phase to address:**
Alarm + Notifications phase — verify on physical iOS and Android devices before considering this feature done.

---

### Pitfall 4: No Offline Support Causes Data Loss at the Gym

**What goes wrong:**
Gyms frequently have poor cell coverage. If the app requires an active Supabase connection to save workout sets, every `INSERT` during poor connectivity either fails silently, throws an error, or hangs. Users lose their logged sets and stop trusting the app.

**Why it happens:**
Supabase is a remote Postgres database accessed over HTTPS. There is no built-in offline mode. Developers build the happy path (good connectivity) and never test in airplane mode or with a throttled connection.

**How to avoid:**
For this app's scale (small friend group), the simplest approach is write-to-local-first + sync-on-restore: use AsyncStorage or SQLite (via `expo-sqlite`) as a local write buffer for active workout sessions. Persist sets locally immediately on log, then sync to Supabase when connectivity is confirmed. Use `NetInfo` from `@react-native-community/netinfo` to detect connectivity state and queue syncs. Do not block the UI on network operations during an active workout.

**Warning signs:**
- Every set log is a direct `supabase.from('sets').insert()` with no local fallback
- No connectivity check before writes
- No loading/error handling on workout log actions
- The active workout screen shows a spinner while waiting for Supabase response

**Phase to address:**
Active Workout / Focus Mode phase — the sync strategy must be decided before building the logging UI, not after.

---

### Pitfall 5: Workout Plan Schema Too Rigid — Plan Changes Break History

**What goes wrong:**
A user creates a workout plan, logs 10 sessions against it, then edits the plan (changes an exercise, adjusts target weight). All 10 historical sessions now show the updated plan details instead of what was actually done, making progress tracking useless. Alternatively, the developer adds exercise immutability and users can't edit plans at all, causing frustration.

**Why it happens:**
Developers use a single `plans` table with a FK from `workout_sessions` to `plan_id`. When a plan is edited, the join returns the new plan data for all historical sessions. The correct model is to snapshot plan details at log time — what was prescribed vs. what was actually done are different records.

**How to avoid:**
Separate "planned" from "actual" at the schema level. Workout sessions store their own copies of exercise name, target sets/reps/weight at the time of logging, independent of the current plan definition. The plan is a template; the log is a record. Use a schema like: `plans → plan_days → plan_exercises` (templates) and `sessions → session_sets` (actual logged data that copies relevant fields from the plan at log time, then allows override).

**Warning signs:**
- `session_sets` table only has a FK to `plan_exercise_id` with no copied/override fields
- "Edit plan" mutates existing rows rather than creating versioned records
- Progress charts pull directly from plan targets rather than logged actuals

**Phase to address:**
Database Schema + Backend phase — this is a schema design decision that is extremely costly to refactor once workout history exists.

---

### Pitfall 6: Progress Charts Show Meaningless Data Without Proper Aggregation

**What goes wrong:**
The progress chart for "Bench Press weight over time" is jagged and confusing because it plots every individual set (including warm-up sets at 50% weight) rather than best set per session. A user who did 5 warm-up sets at 60kg and 3 working sets at 100kg sees their "progress" chart show 60kg–60kg–60kg–60kg–60kg–100kg–100kg–100kg, which looks like they are barely progressing.

**Why it happens:**
Developers plot raw set data without defining what "progress" means for a given exercise. The meaningful metric for strength progress is typically the best set per session (highest weight × reps combination), not all sets.

**How to avoid:**
Define progress metrics before building charts: for strength, use best estimated 1RM per session (Epley formula: `weight × (1 + reps/30)`), or max weight at a given rep range. Store a `set_type` field (`warmup`, `working`, `failure`) so warm-ups can be excluded from progress calculations. Use Supabase's PostgreSQL aggregation (window functions, `MAX()` per session) server-side rather than fetching all rows and computing in JS.

**Warning signs:**
- No `set_type` or `is_warmup` field in the sets table
- Progress charts fetch all sets for an exercise and plot each point
- No definition of "best performance per session" in the data model

**Phase to address:**
Progress Charts + Analytics phase — but the `set_type` field must be added in the schema phase.

---

### Pitfall 7: Supabase Auth Session Lost When App Opened Offline

**What goes wrong:**
A user opens the app in the gym with no internet. Supabase's `startAutoRefresh()` attempts to refresh the JWT token, fails, and clears the session, logging the user out. They are now locked out of their own workout history while offline, even though the session was valid when the app was last used.

**Why it happens:**
The Supabase JS client's default behavior is to auto-refresh tokens on a timer. When the refresh request fails (network unavailable), some versions of the client treat the failure as an expired/invalid session and clear it.

**How to avoid:**
Detect offline state before starting auth refresh. Use `NetInfo` to check connectivity before initializing Supabase's auto-refresh, or configure a custom `storage` adapter that persists the session to secure storage so it survives the app being closed. The session should only be cleared on an explicit 401 from the server, not on a network timeout. Consider using `expo-secure-store` for session storage rather than AsyncStorage for auth tokens.

**Warning signs:**
- Users report being logged out after opening the app in the gym
- Session handling has no `NetInfo` check
- Auth token stored in plain AsyncStorage (not `expo-secure-store`)
- No error differentiation between "network unavailable" and "token expired"

**Phase to address:**
Auth + Backend Setup phase — configure offline-safe session handling before building any features.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Skip RLS and use service role key in the app | Faster to query, no policy debugging | Full database exposed publicly; catastrophic if anon key is extracted from the app bundle | Never |
| Store active workout only in component state (no persistence) | Simpler code, no AsyncStorage setup | Any background/crash wipes the workout in progress | Never for the active workout screen |
| Direct Supabase writes with no offline buffer | Simpler architecture | Silent data loss in the gym when connectivity drops | Never for workout logging |
| Flatten workout history into one table (no plan/session separation) | Simpler queries | Cannot distinguish what was planned vs. what was done; history is corrupted by plan edits | Never |
| Plot all set data raw (no aggregation for progress) | Faster to build | Charts are misleading and users stop trusting the app | MVP only if charts are clearly labeled as raw data |
| Use `expo-notifications` for alarms | Already in Expo SDK, no extra setup | Alarms silenced by DND, Doze mode, and device reboot without extra work | Acceptable only if "soft reminders" are acceptable, not true alarms |
| Hardcode exercise list in code rather than database | Simpler for v1 | Cannot add/edit exercises without a code deploy; breaks custom exercise creation feature | Never given the custom exercise requirement |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Supabase RLS | Testing queries in the SQL Editor (runs as postgres superuser, bypasses RLS) | Test via the app client or Supabase's "Row Level Security" simulator using a specific user JWT |
| Supabase RLS + upserts | Upserts without a primary key fail silently with RLS enabled | Always provide the primary key in upsert operations |
| `expo-notifications` on Android 12+ | Missing `SCHEDULE_EXACT_ALARM` permission causes silent drift in Doze mode | Add permission to `app.json` extra permissions array and request at runtime |
| `expo-notifications` reboot survival | Scheduled notifications are cleared on device reboot | Register `RECEIVE_BOOT_COMPLETED` and re-schedule notifications on app start |
| Supabase Realtime on mobile | Realtime subscriptions stay open in background and drain battery | Unsubscribe in `AppState` change handler when app backgrounds |
| Supabase storage (progress photos) | Storing photos in a public bucket without RLS | Use private buckets with signed URLs; apply storage RLS policies matching the `user_id` pattern |
| `notifee` full-screen intent (Android) | Full-screen alarm UI requires `USE_FULL_SCREEN_INTENT` permission; Android 14 further restricts this to system apps | Test on real Android 12+ devices; document that the "full alarm" experience is best-effort on newer Android |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Fetching all sets for an exercise to render a progress chart | Chart loads slowly; JS heap grows on users with 6+ months of history | Use Supabase aggregation queries server-side (`MAX`, window functions); paginate history | ~500+ logged sets per exercise (~6 months of consistent training) |
| N+1 queries in workout history list | History screen takes 2–5 seconds to load; visible janky scrolling | Fetch sessions with joined sets in one query using Supabase's nested select syntax | 50+ workout sessions |
| Storing progress photos as base64 in the database | Database size balloons; queries slow down; backups bloat | Use Supabase Storage for photos, store only the storage path/URL in the database | 1st progress photo upload |
| Re-rendering the active workout screen on every set log | Noticeable UI stutter during logging | Memoize exercise list components; keep active session state in a store outside the component tree | Noticeable at 5+ exercises with multiple sets |
| AsyncStorage for large workout history | AsyncStorage is synchronous-feel but slow for large blobs; reading history on app start blocks the main thread | Use AsyncStorage only for session tokens and small config; use `expo-sqlite` or Supabase for workout history | When the local AsyncStorage blob exceeds ~1MB |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| RLS disabled on any user-data table | Any authenticated user can read/write all rows in that table; anon key exposure = full data access | Enable RLS immediately on table creation; verify in Supabase dashboard before any feature ships |
| Supabase anon key embedded without RLS | App bundle can be extracted, anon key obtained, and used to query the entire database | RLS is the only real protection; the anon key is intentionally public — RLS is the security layer |
| Progress photos stored in a public Supabase Storage bucket | Anyone with the file URL can view any user's progress photos | Use private buckets; generate signed URLs for authenticated users only |
| Auth tokens in plain AsyncStorage | Tokens extractable from device via backup tools on non-encrypted Android devices | Use `expo-secure-store` for auth session storage |
| No `user_id` validation on plan/session writes | A malicious user could write session data attributed to another user's ID | WITH CHECK policies on INSERT/UPDATE ensure `auth.uid() = user_id` at the database level |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Requiring network connectivity to log a set during workout | Gym connectivity is poor; users see errors or spinners mid-set, breaking their focus | Log locally first, sync after; the logging action should always succeed immediately |
| Too many fields visible on the active workout screen | Users spend more time tapping fields than lifting; defeats the purpose of a gym companion | Focus mode: show only current exercise with weight/reps/RPE; collapse notes and next-exercise info |
| Navigating away from active workout loses context | User checks messages, comes back, has to find where they were in the workout | Persist workout position (current exercise index, completed sets) in background-safe storage |
| No confirmation before starting a workout that overwrites an incomplete previous session | User accidentally starts a new session on top of an unsaved one | Detect in-progress sessions on app open; prompt "resume" or "discard and start new" |
| Alarm setup buried in settings separate from plan creation | Users don't discover alarms or don't connect them to their plan days | Alarms should be part of the plan day creation flow: assign a day, immediately prompt for alarm time |
| Progress charts with no baseline context | User sees "100kg bench press" but doesn't know if that's their PR or a bad day | Always show personal record marker on progress charts |
| Body metrics require manually entering every measurement every session | High friction; users skip logging body metrics entirely | Allow partial updates — logging only weight without requiring measurements is valid |

---

## "Looks Done But Isn't" Checklist

- [ ] **Active workout logging:** Works in Expo Go dev build — verify it persists state correctly when the app is backgrounded on a real device
- [ ] **Alarms:** Fires in the simulator — verify they fire after device reboot, in Doze mode, and with Do Not Disturb enabled on real iOS and Android hardware
- [ ] **RLS:** Data appears correctly in the app — verify by logging in as a different user and confirming they cannot access the first user's data
- [ ] **Progress charts:** Charts render with sample data — verify they use `working` set data only and handle the case of only 1 logged session gracefully
- [ ] **Offline behavior:** App works on WiFi — verify full flow (log sets, background app, kill app, restore connectivity) works correctly in airplane mode
- [ ] **Plan edit vs. history:** Plan changes look correct going forward — verify that editing a plan does not retroactively change logged session data
- [ ] **Missed workout nudge:** Notification sends in testing — verify it does NOT send when the user did log a workout that day, and DOES send at the correct time the following day
- [ ] **Progress photos:** Upload works — verify photos are stored in a private bucket and are not accessible via direct URL without authentication
- [ ] **Custom exercise creation:** Exercise saves — verify it appears in the exercise picker for plan creation and for active workout logging without a full data refresh

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| RLS not enabled (discovered after users have data) | LOW | Enable RLS and add policies; existing data is unaffected; test thoroughly before re-enabling in production |
| Workout session state not persisted (users report data loss) | MEDIUM | Add AsyncStorage persistence layer; existing lost data is unrecoverable; communicate change to users |
| Plan schema too rigid (history contaminated by plan edits) | HIGH | Requires schema migration; snapshot plan details into session records; existing history may be unrecoverable or require manual correction |
| Wrong set data in progress charts (warm-ups included) | LOW | Add `set_type` field migration; update chart query; re-render charts; historical data can be retroactively tagged if set weights are distinguishable |
| Auth session lost offline (users reporting logout at gym) | LOW | Update session persistence to `expo-secure-store`; add offline detection before auto-refresh; no data loss, only UX regression |
| Alarms not firing reliably (users miss workouts) | MEDIUM | Migrate from `expo-notifications` to `notifee`; requires new native build; test extensively on physical devices |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Active session state lost | Active Workout / Focus Mode | Test by backgrounding app mid-workout on real device, returning, and verifying all logged sets are present |
| RLS misconfigured | Auth + Backend Setup | Log in as User B and attempt to query User A's workout data via the app |
| Alarm brittleness | Alarm + Notifications | Test alarm delivery after device reboot, in Doze mode, with DND on — on real iOS and Android hardware |
| No offline support | Active Workout / Focus Mode | Log sets in airplane mode; restore connectivity; verify data synced to Supabase |
| Rigid plan schema | Database Schema / Backend | Edit a plan after logging 3 sessions; verify historical sessions show original data |
| Misleading progress charts | Progress Charts + Analytics | Verify charts use working sets only; verify PR markers; test with <3 sessions (sparse data edge case) |
| Auth session lost offline | Auth + Backend Setup | Open app in airplane mode; verify user remains logged in and can see cached data |
| Progress photos in public bucket | Body Metrics phase | Attempt to access photo URL directly in a browser without authentication |

---

## Sources

- [Developing an Offline-First Fitness App with React Native: The Journey of Gym Tracker](https://dev.to/sathish_daggula/developing-an-offline-first-fitness-app-with-react-native-the-journey-of-gym-tracker-5a2h)
- [Offline-first React Native Apps with Expo, WatermelonDB, and Supabase](https://supabase.com/blog/react-native-offline-first-watermelon-db)
- [Supabase Auth session lost when starting app offline](https://github.com/orgs/supabase/discussions/36906)
- [PowerSync: Bringing Offline-First To Supabase, The Right Way](https://www.powersync.com/blog/bringing-offline-first-to-supabase)
- [Fixing Row-Level Security (RLS) Misconfigurations in Supabase](https://prosperasoft.com/blog/database/supabase/supabase-rls-issues/)
- [Supabase Security: The Hidden Dangers of RLS](https://dev.to/fabio_a26a4e58d4163919a53/supabase-security-the-hidden-dangers-of-rls-and-how-to-audit-your-api-29e9)
- [Making Expo Notifications Actually Work (Even on Android 12+ and iOS)](https://medium.com/@gligor99/making-expo-notifications-actually-work-even-on-android-12-and-ios-206ff632a845)
- [Notifee — React Native Notifications](https://notifee.app/)
- [expo-notifications: Headless Notifications Fail to Trigger Tasks](https://github.com/expo/expo/issues/38223)
- [Efficiently Managing Timers in React Native Across Background/Foreground](https://dev.to/shivampawar/efficiently-managing-timers-in-a-react-native-app-overcoming-background-foreground-timer-state-issues-map)
- [Top Workout Tracking Mistakes — Jefit](https://www.jefit.com/wp/guide/top-workout-tracking-mistakes-and-how-to-avoid-them-for-better-results/)
- [Designing a Data Structure to Track Workouts](https://1df.co/designing-data-structure-to-track-workouts/)
- [Row Level Security — Supabase Official Docs](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Run React Native Background Tasks 2026](https://dev.to/eira-wexford/run-react-native-background-tasks-2026-for-optimal-performance-d26)

---

*Pitfalls research for: Gym / Fitness Tracking App (React Native + Supabase)*
*Researched: 2026-03-09*
