# Architecture Research

**Domain:** Mobile fitness tracking app (React Native + Supabase)
**Researched:** 2026-03-09
**Confidence:** HIGH (multiple verified sources, official documentation confirmed)

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                         │
│                     (React Native + Expo)                         │
├──────────────┬──────────────┬──────────────┬─────────────────────┤
│   Dashboard  │  Workout     │  Plan        │  Body Metrics        │
│   Screen     │  Active      │  Builder     │  + Progress          │
│              │  (Focus)     │              │  Charts              │
├──────────────┴──────────────┴──────────────┴─────────────────────┤
│                       BUSINESS LOGIC LAYER                        │
│                       (Custom Hooks)                              │
│  useWorkout  │  usePlan     │  useMetrics  │  useAlarms           │
│  useAuth     │  useExercise │  useProgress │  useSync             │
├──────────────┴──────────────┴──────────────┴─────────────────────┤
│                         STATE LAYER                               │
├───────────────────────────┬──────────────────────────────────────┤
│   CLIENT STATE (Zustand)  │     SERVER STATE (TanStack Query)     │
│   - UI state              │     - Workout history cache           │
│   - Active workout session│     - Exercise library                │
│   - Navigation state      │     - Progress data                   │
│   - User preferences      │     - Body metrics                    │
├───────────────────────────┴──────────────────────────────────────┤
│                        SERVICE LAYER                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  Supabase    │  │  Notifications│  │  Local Storage       │   │
│  │  Client      │  │  Service     │  │  (MMKV / AsyncStore) │   │
│  │  (Auth +     │  │  (expo-      │  │                      │   │
│  │   Database)  │  │  notifications)│ │                      │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                     BACKEND (Supabase)                           │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────────────┐    │
│  │ PostgreSQL  │  │  Auth        │  │  Storage             │    │
│  │ + RLS       │  │  (email/pw)  │  │  (progress photos)   │    │
│  └────────────┘  └──────────────┘  └──────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Screen components | Render UI, handle user events, read from hooks | React Native + Expo Router file-based routes |
| Custom hooks | Orchestrate state + server queries, business logic | useWorkoutSession, usePlanBuilder, useAlarmScheduler |
| Zustand stores | Client-side ephemeral state, UI flags, session data | workoutStore (active session), authStore (user) |
| TanStack Query | Server state, caching, mutations, optimistic updates | Query keys per entity: workouts, exercises, metrics |
| Supabase client | Auth + PostgreSQL CRUD via PostgREST, realtime | Singleton client initialized once at app entry |
| Notification service | Schedule/cancel local alarms, handle dismiss events | expo-notifications with scheduled triggers |
| Local storage | Persist user preferences, cache tokens securely | expo-secure-store for auth tokens, MMKV for prefs |

## Recommended Project Structure

```
src/
├── app/                      # Expo Router file-based routes
│   ├── (auth)/               # Auth screens (login, signup)
│   │   ├── login.tsx
│   │   └── signup.tsx
│   ├── (tabs)/               # Main tab navigator
│   │   ├── dashboard.tsx     # Home with charts + today's plan
│   │   ├── plans.tsx         # Plan list + builder entry
│   │   ├── history.tsx       # Past workout sessions
│   │   └── metrics.tsx       # Body metrics + progress photos
│   ├── workout/
│   │   ├── [sessionId].tsx   # Active workout focus mode
│   │   └── complete.tsx      # Post-workout summary
│   └── _layout.tsx           # Root layout, auth guard
│
├── features/                 # Feature-based organization
│   ├── auth/
│   │   ├── hooks/            # useAuth, useSession
│   │   ├── components/       # LoginForm, SignupForm
│   │   └── types.ts
│   ├── exercises/
│   │   ├── hooks/            # useExerciseLibrary, useCustomExercise
│   │   ├── components/       # ExerciseCard, ExercisePicker
│   │   ├── data/             # Seed data: pre-loaded exercises
│   │   └── types.ts
│   ├── plans/
│   │   ├── hooks/            # usePlanBuilder, usePlanList
│   │   ├── components/       # PlanCard, DayBuilder, ExerciseRow
│   │   └── types.ts
│   ├── workouts/
│   │   ├── hooks/            # useActiveWorkout, useWorkoutHistory
│   │   ├── components/       # SetLogger, ExerciseFocusCard, RestTimer
│   │   ├── stores/           # activeWorkoutStore (Zustand)
│   │   └── types.ts
│   ├── metrics/
│   │   ├── hooks/            # useBodyMetrics, useProgressPhotos
│   │   ├── components/       # MetricForm, MetricChart, PhotoGallery
│   │   └── types.ts
│   ├── alarms/
│   │   ├── hooks/            # useAlarmScheduler, useAlarmList
│   │   ├── services/         # notificationService.ts
│   │   └── types.ts
│   └── dashboard/
│       ├── hooks/            # useDashboardData
│       └── components/       # ProgressChart, TodayPlan, StatsCard
│
├── lib/                      # Shared infrastructure
│   ├── supabase/
│   │   ├── client.ts         # Singleton Supabase client
│   │   ├── queries/          # Typed query functions per entity
│   │   └── types/            # Generated database types
│   ├── query/
│   │   └── client.ts         # TanStack Query client config
│   └── notifications/
│       └── setup.ts          # expo-notifications initialization
│
├── components/               # Shared UI components
│   ├── ui/                   # Generic: Button, Input, Card, Modal
│   ├── charts/               # Recharts or Victory wrappers
│   └── layout/               # Screen wrapper, SafeArea, KeyboardAvoid
│
├── hooks/                    # Shared cross-feature hooks
│   ├── useNetworkStatus.ts
│   └── useAppState.ts
│
├── stores/                   # Global Zustand stores
│   └── authStore.ts          # User session, auth state
│
├── constants/                # App-wide constants
│   ├── exercises.ts          # Pre-loaded exercise seed data
│   ├── theme.ts              # Dark/bold color palette
│   └── queryKeys.ts          # TanStack Query key registry
│
└── types/                    # Shared TypeScript types
    └── database.ts           # Supabase-generated schema types
```

### Structure Rationale

- **features/:** Groups all code for a feature (hooks, components, types) together — reducing cross-file navigation and making features independently testable
- **app/:** Only route files live here (Expo Router file-based routing); screen components import from features/
- **lib/supabase/:** Single client instance prevents connection proliferation; typed query functions enforce type safety at the data layer
- **stores/:** Global Zustand stores (auth) at root; feature-specific stores colocated in features/
- **constants/exercises.ts:** Pre-loaded exercise library lives as static data, seeded to Supabase on first auth or kept local

## Architectural Patterns

### Pattern 1: Layered State — Zustand for Client, TanStack Query for Server

**What:** Zustand manages ephemeral client state (active workout session in progress, UI flags, user preferences). TanStack Query manages all server-sourced data with automatic caching, background refresh, and optimistic mutation support.

**When to use:** Any time you have a mix of "in-flight" local state (mid-workout logging) and persisted server data (historical sessions). The boundary is: if it needs to survive a server round-trip, it's server state.

**Trade-offs:** Adds two libraries, but eliminates all manual cache invalidation logic and race conditions that plague useEffect + useState approaches.

**Example:**
```typescript
// stores/activeWorkoutStore.ts — Zustand for live session
const useActiveWorkoutStore = create<ActiveWorkoutState>((set) => ({
  currentExerciseIndex: 0,
  sets: [],
  startedAt: null,
  addSet: (set) => set((s) => ({ sets: [...s.sets, set] })),
  advance: () => set((s) => ({ currentExerciseIndex: s.currentExerciseIndex + 1 })),
}));

// features/workouts/hooks/useWorkoutHistory.ts — TanStack Query for server data
export function useWorkoutHistory(userId: string) {
  return useQuery({
    queryKey: queryKeys.workouts.history(userId),
    queryFn: () => supabase
      .from('workout_sessions')
      .select('*, sets(*), exercises(*)')
      .eq('user_id', userId)
      .order('started_at', { ascending: false }),
  });
}
```

### Pattern 2: Custom Hook as Orchestrator

**What:** Screen components call only custom hooks — never Zustand or Supabase directly. Hooks compose client state + server state + side effects into a single interface the UI consumes.

**When to use:** Always. This is the boundary that keeps screens thin and business logic testable.

**Trade-offs:** One extra indirection, but screens become trivially simple and hooks are independently testable.

**Example:**
```typescript
// features/workouts/hooks/useActiveWorkout.ts
export function useActiveWorkout(planDayId: string) {
  const session = useActiveWorkoutStore();       // Zustand
  const { data: planDay } = usePlanDay(planDayId); // TanStack Query
  const { mutate: saveSession } = useSaveWorkout(); // TanStack Mutation

  const finishWorkout = useCallback(async () => {
    await saveSession({ sets: session.sets, planDayId, startedAt: session.startedAt });
    session.reset();
  }, [session, saveSession, planDayId]);

  return {
    currentExercise: planDay?.exercises[session.currentExerciseIndex],
    sets: session.sets,
    addSet: session.addSet,
    advance: session.advance,
    finishWorkout,
  };
}

// app/workout/[sessionId].tsx — Screen is just a view
export default function WorkoutScreen() {
  const { currentExercise, sets, addSet, advance } = useActiveWorkout(sessionId);
  return <ExerciseFocusCard exercise={currentExercise} onLog={addSet} onNext={advance} />;
}
```

### Pattern 3: Postgres-First + RLS for Authorization

**What:** Row Level Security policies in PostgreSQL enforce that users only access their own data. The app client never filters by user ID manually — the database handles it automatically.

**When to use:** Every table with user-owned data: workout_sessions, sets, plan_days, body_metrics, progress_photos.

**Trade-offs:** Logic lives in the database rather than application code. Slightly harder to debug but eliminates an entire class of data leakage bugs.

**Example:**
```sql
-- Every user-owned table follows this pattern
CREATE TABLE workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  plan_day_id UUID REFERENCES plan_days(id),
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ
);

ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users own their sessions"
  ON workout_sessions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### Pattern 4: Notification Service as Isolated Module

**What:** All alarm scheduling logic lives in a dedicated notification service. Alarms are scheduled when a plan is saved, cancelled when a plan changes, and identified by plan-day-specific IDs for reliable management.

**When to use:** Required for "real alarm" behavior (sound + vibration + dismiss). expo-notifications supports scheduled triggers natively without a server.

**Trade-offs:** Local notifications only — cannot send pushes when app is completely uninstalled. For a friend-group app this is acceptable. Missed workout nudges require background task registration.

**Example:**
```typescript
// lib/notifications/setup.ts
export async function schedulePlanAlarm(planDayId: string, weekday: number, time: string) {
  const [hour, minute] = time.split(':').map(Number);
  await Notifications.scheduleNotificationAsync({
    identifier: `alarm-${planDayId}`,  // deterministic ID for cancellation
    content: {
      title: "Gym Time",
      body: "Your workout is scheduled. Time to train.",
      sound: true,
    },
    trigger: {
      weekday,   // 1=Sun ... 7=Sat
      hour,
      minute,
      repeats: true,
    },
  });
}

export async function cancelPlanAlarm(planDayId: string) {
  await Notifications.cancelScheduledNotificationAsync(`alarm-${planDayId}`);
}
```

## Data Flow

### Request Flow — Logging a Set

```
User taps "Log Set" in Focus Mode Screen
    ↓
useActiveWorkout hook receives call
    ↓
Zustand activeWorkoutStore.addSet() → updates local state immediately (no latency)
    ↓
Screen re-renders with new set count (instant)
    ↓
When "Finish Workout" pressed:
    ↓
TanStack Mutation fires → supabase.from('workout_sessions').insert(...)
    ↓
On success → invalidateQueries([queryKeys.workouts.history])
    ↓
History screen auto-refreshes from Supabase cache
```

### State Management Flow

```
Supabase (source of truth)
    ↓ (fetched by TanStack Query)
Query Cache (in-memory, keyed by user/entity)
    ↑↓ (invalidated on mutations)
Custom Hooks (compose cache + Zustand)
    ↓ (consumed by)
Screen Components (render only)

Zustand Store (client-only state)
    ↓ (consumed by)
Custom Hooks → Screen Components
    ↑
User interactions write back to Zustand directly
```

### Key Data Flows

1. **Plan Creation:** User builds plan → Zustand holds draft state → on save, TanStack mutation writes plan + plan_days + plan_exercises to Supabase → alarm scheduler called for each day with a time → scheduled notifications registered with deterministic IDs

2. **Active Workout:** Plan day loaded via TanStack Query → session begins → all set logging writes to Zustand only (zero latency) → on finish, full session POSTed to Supabase via mutation → query cache invalidated → history reflects new session

3. **Progress Charts:** TanStack Query fetches workout history and body metrics → custom hook computes aggregates (max weight per exercise, weekly volume) → chart component renders transformed data

4. **Auth + Sync:** Supabase Auth issues JWT stored in expo-secure-store → JWT auto-attached to all Supabase requests → RLS policies enforce per-user data isolation automatically → multi-device sync happens naturally since all writes go through Supabase

5. **Missed Workout Nudge:** expo-task-manager background task runs daily → checks Supabase for planned workout days with no matching session → fires local notification if gap detected

## Suggested Build Order

Dependencies flow upward. Build in this sequence:

```
1. Supabase schema + RLS           (foundation — all data flows from here)
       ↓
2. Supabase client + auth          (nothing works without auth)
       ↓
3. Exercise library (seed data)    (plans depend on exercises existing)
       ↓
4. Plan builder + plan_days        (workouts depend on plans)
       ↓
5. Active workout (Focus Mode)     (core value of the app)
       ↓
6. Workout history                 (depends on sessions being logged)
       ↓
7. Progress charts + dashboard     (aggregates history data)
       ↓
8. Body metrics tracking           (parallel track, independent feature)
       ↓
9. Alarms + notifications          (depends on plans existing)
       ↓
10. Missed workout nudges          (depends on alarms + history)
```

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-50 users (friend group) | No adjustments needed — Supabase free tier, no caching layer required |
| 1k-10k users | Add indexes on user_id + date columns; consider Supabase connection pooling (PgBouncer, already built in) |
| 100k+ users | Extract heavy aggregations to database views or materialized views; add CDN for progress photos; consider read replicas |

### Scaling Priorities

1. **First bottleneck:** Progress chart queries scanning large workout history tables — fix with indexed views or pre-computed aggregates
2. **Second bottleneck:** Progress photo storage costs — Supabase Storage handles this, add lifecycle policies to compress on upload

For a friend group app, scaling is not a real concern. The architecture above is already appropriate for the lifetime of this project.

## Anti-Patterns

### Anti-Pattern 1: Calling Supabase Directly in Screen Components

**What people do:** `const { data } = await supabase.from('workouts').select(...)` inside component `useEffect`

**Why it's wrong:** Business logic is trapped in the UI layer, untestable, and duplicated across screens. No caching, no automatic refetching, no optimistic updates.

**Do this instead:** Always go through a custom hook that wraps a TanStack Query. The screen only calls `useWorkoutHistory()` and renders what it receives.

### Anti-Pattern 2: One Zustand Store for Everything

**What people do:** Single global store with user, workouts, plans, metrics, UI flags all in one object

**Why it's wrong:** Unrelated re-renders on every state change. Impossible to understand what owns what. Migrations become nightmares.

**Do this instead:** Feature-scoped stores (activeWorkoutStore for the live session), global store only for truly global state (authStore for the user). Server data never lives in Zustand.

### Anti-Pattern 3: Storing Supabase JWT in AsyncStorage

**What people do:** `AsyncStorage.setItem('token', jwt)` for session persistence

**Why it's wrong:** AsyncStorage is unencrypted plain text storage on the device — any app with file system access can read it.

**Do this instead:** Use `expo-secure-store` for tokens. Supabase's `@supabase/supabase-js` with a custom storage adapter pointing to `expo-secure-store` handles this transparently.

### Anti-Pattern 4: Scheduling Alarms Without Deterministic IDs

**What people do:** Schedule a new notification every time a plan is updated, without cancelling the old one

**Why it's wrong:** Users accumulate dozens of duplicate alarm notifications per day.

**Do this instead:** Use a deterministic notification identifier based on plan day ID (`alarm-${planDayId}`). Before scheduling, always call `cancelScheduledNotificationAsync(id)` first. Recreate on every plan save.

### Anti-Pattern 5: Fetching All Data Then Filtering Client-Side

**What people do:** Fetch entire workout history and filter in JavaScript: `sessions.filter(s => s.userId === currentUser.id)`

**Why it's wrong:** Transfers unnecessary data; wastes bandwidth; RLS already filters at the database — this filter is redundant noise.

**Do this instead:** Trust RLS. Supabase automatically scopes queries to the authenticated user. Query the table without user_id filters in application code.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Supabase Auth | Singleton client, JWT auto-managed | Use `expo-secure-store` adapter for token persistence |
| Supabase Database | PostgREST via `@supabase/supabase-js` client | All queries typed via generated database types |
| Supabase Storage | Direct upload via client SDK | Used for progress photos; set bucket to private + RLS |
| expo-notifications | Service module, scheduled triggers | Request permissions at plan creation, not app launch |
| expo-task-manager | Background task for nudge checks | Register once at app boot; poll Supabase for missed days |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Screen ↔ Hook | Hook return values only | Screens never import Supabase or Zustand directly |
| Hook ↔ Zustand | Direct store access within hook | Hooks own Zustand reads/writes |
| Hook ↔ TanStack Query | `useQuery` / `useMutation` within hook | Query keys centralized in `constants/queryKeys.ts` |
| Hook ↔ Notification Service | Function calls to service module | Alarm scheduling is a side effect of plan mutation |
| Features ↔ Features | Only through shared hooks or lib/ | Features do not import from each other's internals |

## Database Schema Outline

Core tables and their relationships (informs phase ordering):

```
auth.users (Supabase managed)
    ↓
exercises (global lookup table — pre-seeded + user-created)
    ↓
workout_plans (user-owned: id, user_id, name, created_at)
    ↓
plan_days (id, plan_id, weekday, alarm_time)
    ↓
plan_exercises (id, plan_day_id, exercise_id, sets, reps, target_weight, rpe, notes, order)

workout_sessions (id, user_id, plan_day_id, started_at, completed_at)
    ↓
session_sets (id, session_id, exercise_id, set_number, weight, reps, rpe, logged_at)

body_metrics (id, user_id, recorded_at, bodyweight, body_fat_pct, notes)
measurements (id, user_id, recorded_at, location, value_cm)
progress_photos (id, user_id, recorded_at, storage_path, notes)
```

## Sources

- [Supabase Offline-First with WatermelonDB](https://supabase.com/blog/react-native-offline-first-watermelon-db) — sync architecture patterns
- [Zustand + TanStack Query Architecture Guide](https://dev.to/neetigyachahar/architecture-guide-building-scalable-react-or-react-native-apps-with-zustand-react-query-1nn4) — layered state pattern
- [Expo App Folder Structure Best Practices](https://expo.dev/blog/expo-app-folder-structure-best-practices) — official Expo structure guidance
- [Supabase Row Level Security Docs](https://supabase.com/docs/guides/database/postgres/row-level-security) — RLS implementation
- [expo-notifications Docs](https://docs.expo.dev/versions/latest/sdk/notifications/) — local alarm scheduling
- [Supabase MVP Architecture 2026](https://www.valtorian.com/blog/supabase-mvp-architecture) — Postgres-first pattern
- [React Native Best Practices 2026](https://www.applighter.com/blog/react-native-best-practices) — security, component patterns
- [Expo Router + TanStack + Supabase Sample](https://github.com/aaronksaunders/expo-router-supabase-tanstack) — reference implementation

---
*Architecture research for: React Native + Supabase gym/fitness tracking app*
*Researched: 2026-03-09*
