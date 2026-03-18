# Phase 20: Integration Gap Closure - Research

**Researched:** 2026-03-18
**Domain:** Cross-phase integration bug fixes (auth, notifications, video upload, deep linking, body metrics)
**Confidence:** HIGH

## Summary

Phase 20 closes five cross-phase integration gaps identified by the v1.0 milestone audit, plus generates two missing VERIFICATION.md files. All gaps are partial-satisfaction bugs in existing, shipped requirements -- no new features are introduced. Each fix is surgically scoped: adding store IDs to an array, adding switch cases to a router, extending a type with a retry counter, adding data payloads to alarm notifications, and replacing hardcoded defaults with store values.

The codebase is mature with consistent patterns across all six fix targets. Every change follows an established pattern already in use elsewhere in the project. The deep link router has comprehensive unit tests, the video upload queue has unit tests, and the alarm scheduler has unit tests -- all of which will need to be extended to cover the new behavior.

**Primary recommendation:** Implement each gap as an independent, self-contained task. No gap depends on another, so they can be planned and executed in any order. The VERIFICATION.md generation task should come last since it involves reading completed plan artifacts.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
1. **Sign-out data isolation (AUTH-03):** Add 4 missing MMKV store IDs to `clearAllUserData()`: `social-store`, `chat-store`, `friendship-store`, `notification-storage`
2. **Alarm notification deep link (ALRM-02):** Navigate to plan day detail screen with Start Workout button. Requires adding `plan_day_id` to alarm/nudge notification payload. Deep link route uses existing route structure. Fallback to dashboard `/(app)` if plan_day_id cannot be resolved. Nudge notifications get the same deep link behavior.
3. **Video upload queue retry (VID-03):** Auto-flush pending videos on app foreground when connectivity available. Matches `useSyncQueue` pattern. Retry limit: 3 attempts per video item. Add `retryCount` field to `VideoUploadItem` type. No periodic timer needed.
4. **Deep link router for social/chat types (NOTIF-02, NOTIF-04):** Add `group_share` and `chat_message` cases to `getDeepLinkRoute()`. `group_share` routes to group screen (requires `group_id`). `chat_message` routes to group chat screen (requires `group_id`).
5. **Body-metrics unit defaults:** Replace hardcoded `'in'` and `'lbs'` defaults with values from `authStore` preferences (`preferredUnit`, `preferredMeasurementUnit`). Fallback to `'lbs'`/`'in'` only if store has no preference.
6. **Missing verification reports (Phases 05, 10):** Generate from automated code analysis. No interactive re-verification. Output to respective phase directories.

### Claude's Discretion
- Exact route path format for plan day detail (use whatever route structure already exists)
- AppState listener implementation for foreground detection
- How to surface the "3 retries exceeded" error in the video management UI
- Verification report format and evidence depth

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-03 | User can log out from any screen (data isolation gap) | 4 MMKV store IDs confirmed: `social-store`, `chat-store`, `friendship-store`, `notification-storage`. `clearAllUserData()` in `src/stores/clearUserData.ts` needs array additions. |
| ALRM-02 | Alarms fire with sound and vibration and must be dismissed (deep link gap) | `scheduleAlarm()` and `scheduleNudge()` in `useAlarmScheduler.ts` currently do NOT include `data` in notification content. `AlarmConfig` needs `planId` field. Deep link router needs `plan_day_id` and `plan_id` in `NotificationData`. |
| VID-03 | Videos upload to Supabase Storage in background (offline-first queue) (retry gap) | `flushVideoQueue()` exists but is only called from `finishWorkout()`. Needs AppState foreground trigger (pattern in `useUnreadCount.ts` and `supabase/client.ts`). `VideoUploadItem` needs `retryCount` field. |
| NOTIF-02 | Tapping inbox items deep links to relevant screen (social/chat gap) | `getDeepLinkRoute()` switch statement needs `group_share` and `chat_message` cases. `NotificationType` union needs both types. `NotificationData` needs `group_id` field. |
| NOTIF-04 | Push notification taps deep link to correct screen (social/chat gap) | Same `getDeepLinkRoute()` fix covers both inbox tap and push notification tap since both code paths use the same function. Push payload already includes `{type, group_id}` from Edge Function. |
</phase_requirements>

## Standard Stack

No new dependencies needed. All fixes use existing libraries already in the project.

### Core (Already Installed)
| Library | Purpose | Relevance |
|---------|---------|-----------|
| `react-native-mmkv` | MMKV persistence | Store ID clearing, video queue persistence |
| `expo-notifications` | Local notification scheduling | Alarm/nudge data payload |
| `expo-router` | File-based routing | Deep link targets |
| `@react-native-community/netinfo` | Network state | Video queue connectivity check |
| `zustand` | State management | Auth store preferences |
| `react-native` (AppState) | App lifecycle | Foreground detection for video flush |

### No New Packages Required
All six fixes use existing project dependencies. No `npm install` needed.

## Architecture Patterns

### Existing Patterns to Follow

#### Pattern 1: MMKV Store ID Registration
**What:** All MMKV store IDs that hold user data must be registered in `MMKV_STORE_IDS` array in `src/stores/clearUserData.ts`.
**Current state:** 14 store IDs registered. 4 missing: `social-store`, `chat-store`, `friendship-store`, `notification-storage`.
**Verified store IDs from source:**
- `src/stores/socialStore.ts` line 8: `createMMKV({ id: 'social-store' })`
- `src/stores/chatStore.ts` line 15: `createMMKV({ id: 'chat-store' })`
- `src/stores/friendshipStore.ts` line 12: `createMMKV({ id: 'friendship-store' })`
- `src/stores/notificationStore.ts` line 9: `createMMKV({ id: 'notification-storage' })`

#### Pattern 2: Deep Link Router Switch-Case
**What:** `getDeepLinkRoute()` in `src/features/notifications/utils/deepLinkRouter.ts` uses a switch statement on `data.type` to return Expo Router path strings.
**Current cases:** `workout_complete`, `pr_achieved`, `plan_update`, `alarm`, `nudge`, `weekly_summary`
**Missing cases:** `group_share`, `chat_message`
**Route format:** `/(app)/social/group-feed?groupId=${data.group_id}`

#### Pattern 3: Notification Data Typing
**What:** `NotificationType` union and `NotificationData` interface in `src/features/notifications/types.ts` define the discriminated union for notification payloads.
**Current types:** 6 notification types, no `group_id` field
**Needed additions:** Add `'group_share' | 'chat_message'` to union, add `group_id?: string` to `NotificationData`

#### Pattern 4: AppState Foreground Detection
**What:** `AppState.addEventListener('change', callback)` pattern used in multiple places.
**Existing examples:**
- `src/lib/supabase/client.ts` line 37: Auth token refresh on foreground
- `src/features/notifications/hooks/useUnreadCount.ts` line 19: Refetch unread count on foreground
- `src/features/social/hooks/useTypingIndicator.ts` line 105: Clear typing on background

```typescript
// Pattern from useUnreadCount.ts
const subscription = AppState.addEventListener('change', (nextState) => {
  if (nextState === 'active') {
    // Do work on foreground
  }
});
return () => subscription.remove();
```

#### Pattern 5: Notification Content Data Payload
**What:** `expo-notifications` `scheduleNotificationAsync` can include a `data` field in `content` that is accessible via `content.data` on notification response.
**Current alarm/nudge issue:** Neither `scheduleAlarm()` nor `scheduleNudge()` include `data` in their `content` object. The `_layout.tsx` reads `lastResponse.notification.request.content.data` and passes it to `getDeepLinkRoute()`.
**Fix:** Add `data: { type: 'alarm', plan_day_id: config.planDayId, plan_id: config.planId }` to alarm content, similarly for nudge.

#### Pattern 6: Zustand Store Access in Screen Components
**What:** Screens import `useAuthStore` and read state via selector.
**Example for body-metrics fix:**
```typescript
const preferredUnit = useAuthStore((s) => s.preferredUnit);
const preferredMeasurementUnit = useAuthStore((s) => s.preferredMeasurementUnit);
```

### Route Structure for Deep Links

**Existing routes confirmed from `app/(app)/` directory:**
- `/(app)/plans/[id]` -- Plan detail (accepts plan_id as `id` param)
- `/(app)/social/group-feed` -- Group feed/chat screen (accepts `groupId` and `groupName` query params)
- `/(app)/social/group-detail` -- Group detail/settings (accepts `groupId` param)
- `/(app)/workout` -- Current alarm/nudge deep link target (just starts active workout)
- `/(app)/(tabs)/dashboard` -- Fallback target

**Alarm deep link route decision:**
The CONTEXT.md says "plan day detail screen with a Start Workout button." The existing plan detail route is `/(app)/plans/[id]` which shows all plan days with exercises and has a Start Workout button per day. Since there's no dedicated plan-day-detail route, the correct target is `/(app)/plans/${plan_id}` -- this already shows all days with start workout capability. Including `plan_day_id` in the data allows future scroll-to-day behavior if desired.

**Chat message deep link route:**
The `group-feed` screen at `/(app)/social/group-feed?groupId=${group_id}` contains `GroupTabs` which has Feed and Chat tabs. Currently there's no `initialTab` or `tab` query parameter support. For `chat_message` notifications, routing to the group-feed screen is correct. An optional `tab=chat` parameter could be added to `GroupTabs` to auto-select the chat tab. This is a Claude's Discretion item.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Foreground detection | Custom polling or timer | `AppState.addEventListener('change')` | Built-in React Native API; already used 3x in codebase |
| Network connectivity check | Manual fetch probe | `NetInfo.fetch()` / `NetInfo.addEventListener()` | Already used by `flushVideoQueue()` and `flushSyncQueue()` |
| Notification deep link routing | Per-screen notification handling | Centralized `getDeepLinkRoute()` switch | Single source of truth; already handles both inbox and push tap |
| MMKV store clearing | Individual store clear calls | `clearAllUserData()` loop pattern | Atomic, complete, already handles errors per store |

## Common Pitfalls

### Pitfall 1: Missing Type Updates for NotificationData
**What goes wrong:** Adding `group_share` and `chat_message` to the deep link router without updating `NotificationType` union and `NotificationData` interface causes TypeScript errors or silent `default` case fallthrough.
**Why it happens:** The type file is separate from the router.
**How to avoid:** Update `src/features/notifications/types.ts` FIRST: add types to union, add `group_id?: string` to interface. Then update the router.
**Warning signs:** `default: return null` catches the new types silently if the switch cases are wrong.

### Pitfall 2: Alarm Data Payload Missing After Reschedule
**What goes wrong:** Alarms/nudges are rescheduled when the active plan changes (`syncActiveAlarms`) or when a plan is updated. If the `data` payload is not included in ALL scheduling paths, some alarms will deep link correctly and others won't.
**Why it happens:** `schedulePlanAlarms()` calls `scheduleAlarm()` and `scheduleNudge()` -- both need the data. But `AlarmConfig` currently lacks `planId`.
**How to avoid:** Extend `AlarmConfig` to include `planId: string`. In `schedulePlanAlarms()`, `day.plan_id` is available on `PlanDay` type. Pass it through.
**Warning signs:** Alarms work after initial save but not after toggling active plan.

### Pitfall 3: Video Retry Count Not Persisted
**What goes wrong:** `retryCount` is tracked in memory but not persisted to MMKV. App restart resets retry counts, causing infinite retries.
**Why it happens:** The queue serialization via `JSON.stringify` will include `retryCount` automatically IF it's on the object. But failed items must be updated in the queue with incremented count.
**How to avoid:** In `flushVideoQueue()`, when an item fails, increment `retryCount` (or set to 1 if undefined) before pushing to `failed` array. Items with `retryCount >= 3` should be skipped (not retried) and flagged with a status.
**Warning signs:** Video retries endlessly or retry count resets to 0 on app restart.

### Pitfall 4: Body Metrics State Initialization Race
**What goes wrong:** `useState` initial values are set once and don't update when the Zustand store hydrates from MMKV.
**Why it happens:** MMKV hydration is synchronous in this project (using `createMMKV` directly), so `useAuthStore` values are available immediately. However, `useState('in')` captures the initial value at mount time.
**How to avoid:** Use the Zustand store value directly: `const preferredMeasurementUnit = useAuthStore(s => s.preferredMeasurementUnit)` and initialize `useState` with this value. Since MMKV hydration is synchronous, this is safe.
**Warning signs:** User sets metric preferences but body metrics screen still shows imperial on first load.

### Pitfall 5: Chat Message Deep Link Tab Focus
**What goes wrong:** `chat_message` notification routes to group-feed screen but shows the Feed tab instead of the Chat tab.
**Why it happens:** `GroupTabs` component defaults `activeTab` to `'feed'` and has no prop to set initial tab.
**How to avoid:** Either (a) add an `initialTab` prop to `GroupTabs` and pass `tab` query param from route, or (b) route `chat_message` to the same group-feed URL with a `tab=chat` query parameter that `GroupFeedScreen` reads and passes to `GroupTabs`. Option (b) follows the existing query param pattern used by other deep links.
**Warning signs:** User taps chat notification but sees Feed tab.

### Pitfall 6: Alarm Notification Record Missing plan_day_id
**What goes wrong:** The fire-and-forget insert to `notifications` table in `scheduleAlarm()` uses `data: { type: 'alarm' }` without `plan_day_id` or `plan_id`. This means inbox notifications for alarms also lack the data needed for deep linking.
**Why it happens:** The Supabase insert was written before deep linking was added.
**How to avoid:** Update BOTH the local notification `content.data` AND the Supabase `notifications` table insert to include `plan_day_id` and `plan_id`.
**Warning signs:** Push notification deep link works but inbox notification deep link doesn't.

## Code Examples

### Fix 1: clearUserData.ts -- Add Missing Store IDs
```typescript
// src/stores/clearUserData.ts
const MMKV_STORE_IDS = [
  'plan-storage',
  'history-storage',
  'workout-storage',
  'exercise-storage',
  'bodyweight-storage',
  'body-measurement-storage',
  'coaching-storage',
  'alarm-storage',
  'previous-performance-cache',
  'workout-bridge',
  'completed-today',
  'sync-queue',
  'video-upload-queue',
  'video-thumbnail-cache',
  // Phase 20: gap closure
  'social-store',
  'chat-store',
  'friendship-store',
  'notification-storage',
];
```

### Fix 2: NotificationData Type Extension
```typescript
// src/features/notifications/types.ts
export type NotificationType =
  | 'workout_complete'
  | 'pr_achieved'
  | 'plan_update'
  | 'weekly_summary'
  | 'alarm'
  | 'nudge'
  | 'group_share'    // Phase 20
  | 'chat_message';  // Phase 20

export interface NotificationData {
  type: NotificationType;
  session_id?: string;
  exercise_id?: string;
  exercise_name?: string;
  plan_id?: string;
  plan_day_id?: string;   // Phase 20: alarm deep link
  group_id?: string;      // Phase 20: social/chat deep link
  trainee_id?: string;
  trainee_name?: string;
}
```

### Fix 3: Deep Link Router New Cases
```typescript
// src/features/notifications/utils/deepLinkRouter.ts
case 'alarm':
case 'nudge':
  // Navigate to plan detail if plan_id available, otherwise fallback to dashboard
  return data.plan_id ? `/(app)/plans/${data.plan_id}` : '/(app)';
case 'group_share':
  return data.group_id
    ? `/(app)/social/group-feed?groupId=${data.group_id}`
    : null;
case 'chat_message':
  return data.group_id
    ? `/(app)/social/group-feed?groupId=${data.group_id}&tab=chat`
    : null;
```

### Fix 4: Alarm Scheduler Data Payload
```typescript
// src/features/alarms/hooks/useAlarmScheduler.ts -- scheduleAlarm
content: {
  title: 'Wake-up alarm',
  body: `Time to get ready -- ${config.dayName} workout`,
  sound: true,
  categoryIdentifier: ALARM_CATEGORY_ID,
  priority: Notifications.AndroidNotificationPriority?.MAX,
  ...(ALARM_CHANNEL_ID ? { channelId: ALARM_CHANNEL_ID } : {}),
  data: {
    type: 'alarm',
    plan_day_id: config.planDayId,
    plan_id: config.planId,
  },
},
```

### Fix 5: Video Queue Foreground Flush Hook
```typescript
// New hook or addition to _layout.tsx
import { AppState } from 'react-native';
import { flushVideoQueue } from '@/features/videos/utils/videoUploadQueue';

// In AppLayout component:
useEffect(() => {
  const subscription = AppState.addEventListener('change', (nextState) => {
    if (nextState === 'active') {
      flushVideoQueue().catch(() => {});
    }
  });
  return () => subscription.remove();
}, []);
```

### Fix 6: Body Metrics Default Unit from Store
```typescript
// app/(app)/body-metrics.tsx
import { useAuthStore } from '@/stores/authStore';

// Inside component:
const preferredUnit = useAuthStore((s) => s.preferredUnit);
const preferredMeasurementUnit = useAuthStore((s) => s.preferredMeasurementUnit);

const [circumferenceUnit, setCircumferenceUnit] = useState<CircumferenceUnit>(
  preferredMeasurementUnit ?? 'in'
);
const [weightUnit, setWeightUnit] = useState<'lbs' | 'kg'>(
  preferredUnit ?? 'lbs'
);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Alarm/nudge -> `/(app)/workout` | Alarm/nudge -> `/(app)/plans/${plan_id}` | Phase 20 | Users see their plan with Start Workout button instead of blank workout screen |
| No `data` in alarm notifications | Include `{type, plan_id, plan_day_id}` in content.data | Phase 20 | Enables deep linking from alarm taps |
| Video queue flush only on workout end | Also flush on app foreground | Phase 20 | Failed uploads retry automatically without waiting for next workout |
| No retry limit on video uploads | 3-attempt limit with error surfacing | Phase 20 | Prevents infinite retry loops for permanently failing uploads |

## Open Questions

1. **GroupTabs `initialTab` prop for chat_message deep link**
   - What we know: `GroupTabs` defaults to `'feed'` tab. Chat messages should open chat tab.
   - What's unclear: Whether to add prop to `GroupTabs` or handle via route query param.
   - Recommendation: Add `tab` query param support to `GroupFeedScreen`, pass to `GroupTabs` as `initialTab` prop. Minimal changes, follows existing query param pattern.

2. **Video retry error surface location**
   - What we know: CONTEXT.md says "surface a persistent error (visible in settings/video management)."
   - What's unclear: Exact UI treatment -- banner, badge, list item indicator?
   - Recommendation: In the videos gallery screen (`app/(app)/videos.tsx`), show a warning banner at the top when any queue items have `retryCount >= 3`. Something like "X video(s) failed to upload. Tap to retry." Keep it simple with existing `colors.error` styling.

3. **Alarm deep link when plan is deleted**
   - What we know: CONTEXT.md specifies fallback to `/(app)` (dashboard).
   - What's unclear: Whether `getDeepLinkRoute` should handle this or the target screen should handle 404.
   - Recommendation: The router returns the plan route if `plan_id` exists in the data, falls back to `/(app)` if not. The plan detail screen `[id].tsx` already handles missing plans gracefully. No special handling needed in the router -- if the plan was deleted, the detail screen shows appropriate state.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29.7 + jest-expo 55.0.9 |
| Config file | `jest.config.js` |
| Quick run command | `npx jest --bail --testPathPattern=<file>` |
| Full suite command | `npm test` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-03 | Sign-out clears social/chat/friendship/notification stores | unit | `npx jest tests/auth/clearUserData.test.ts -x` | Wave 0 |
| ALRM-02 | Alarm/nudge notifications include plan_id/plan_day_id in data payload | unit | `npx jest tests/alarms/alarmScheduler.test.ts -x` | Existing (needs extension) |
| VID-03 | Video queue retries on foreground, stops after 3 failures | unit | `npx jest tests/videos/videoUploadQueue.test.ts -x` | Existing (needs extension) |
| NOTIF-02 | `group_share` and `chat_message` deep link to group screen | unit | `npx jest tests/notifications/deepLinkRouter.test.ts -x` | Existing (needs extension) |
| NOTIF-04 | Push tap with `group_share`/`chat_message` data routes correctly | unit | Same as NOTIF-02 (same function) | Existing (needs extension) |

### Sampling Rate
- **Per task commit:** `npx jest --bail --testPathPattern=<relevant-test-file>`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/auth/clearUserData.test.ts` -- covers AUTH-03 (verify all 18 store IDs are cleared)
- [ ] Extend `tests/notifications/deepLinkRouter.test.ts` -- add group_share and chat_message cases, update alarm/nudge cases for plan_id routing
- [ ] Extend `tests/videos/videoUploadQueue.test.ts` -- add retryCount tests
- [ ] Extend `tests/alarms/alarmScheduler.test.ts` (if exists) -- verify data payload in scheduled notifications

## Sources

### Primary (HIGH confidence)
- Direct codebase analysis of all files referenced in CONTEXT.md
- `src/stores/clearUserData.ts` -- confirmed 14 store IDs, identified 4 missing
- `src/stores/socialStore.ts` line 8 -- `social-store` ID confirmed
- `src/stores/chatStore.ts` line 15 -- `chat-store` ID confirmed
- `src/stores/friendshipStore.ts` line 12 -- `friendship-store` ID confirmed
- `src/stores/notificationStore.ts` line 9 -- `notification-storage` ID confirmed
- `src/features/notifications/utils/deepLinkRouter.ts` -- current switch cases documented
- `src/features/notifications/types.ts` -- current type definitions documented
- `src/features/videos/utils/videoUploadQueue.ts` -- current queue implementation analyzed
- `src/features/videos/types.ts` -- `VideoUploadItem` lacks `retryCount`
- `src/features/alarms/hooks/useAlarmScheduler.ts` -- alarm notification content lacks `data` field
- `src/features/alarms/types.ts` -- `AlarmConfig` lacks `planId`
- `src/features/plans/types.ts` -- `PlanDay` has `plan_id: string` field
- `app/(app)/body-metrics.tsx` -- hardcoded `'in'` and `'lbs'` defaults on lines 47-48
- `src/stores/authStore.ts` -- `preferredUnit` and `preferredMeasurementUnit` confirmed
- `app/(app)/_layout.tsx` -- notification response handler confirmed
- `app/(app)/social/group-feed.tsx` -- route params confirmed (`groupId`, `groupName`)
- `supabase/functions/send-push/index.ts` -- push payload includes `{type, group_id}` for both chat_message and group_share
- `tests/notifications/deepLinkRouter.test.ts` -- 13 existing test cases
- `tests/videos/videoUploadQueue.test.ts` -- 5 existing test cases
- `tests/auth/signout.test.ts` -- existing sign-out tests (no clearUserData coverage)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, all changes in existing files
- Architecture: HIGH -- all patterns already established in codebase, verified by direct code reading
- Pitfalls: HIGH -- identified from actual code analysis of current implementations

**Research date:** 2026-03-18
**Valid until:** 2026-04-18 (stable -- bug fixes in mature codebase)
