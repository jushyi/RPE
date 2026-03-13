# Phase 16: Push Notifications - Research

**Researched:** 2026-03-12
**Domain:** Notification inbox UI, deep link routing, notification persistence (Supabase), dev test screen
**Confidence:** HIGH

## Summary

Phase 16 builds on existing push notification infrastructure (Phase 8 local alarms/nudges, Phase 13 Expo Push API + Edge Functions) to add a notification inbox UI, deep link routing from notification taps, server-side notification persistence, and a developer test screen. The core challenge is wiring notification tap responses to Expo Router navigation for both cold-start and foreground scenarios, plus creating a new Supabase `notifications` table that Edge Functions write to when dispatching push.

The existing codebase already has `expo-notifications` installed (v55.0.11), push token registration, the `send-push` Edge Function, and `addNotificationResponseReceivedListener` in the root layout (currently only handling snooze/dismiss for alarms). The work involves extending that listener for deep link routing, adding `useLastNotificationResponse` for cold-start handling, creating the inbox UI as a stack route, and modifying Edge Functions to persist notification records.

**Primary recommendation:** Use `Notifications.useLastNotificationResponse()` for cold-start deep linking combined with `addNotificationResponseReceivedListener` for foreground taps. Persist notifications in a Supabase table written by Edge Functions. Poll unread count on app focus (not real-time subscription) to keep complexity low.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Bell icon in Dashboard header-right with numeric unread badge count ("9+" for 10+)
- Tapping bell opens a full-screen notification list (stack route, not a tab)
- Flat reverse-chronological list -- no grouping by type or day
- Each notification item shows: type-specific icon, title, body text, relative timestamp ("2h ago")
- Unread items indicated by accent-colored dot on left + bold title text; read items are dimmer
- Tapping an inbox item deep links to the same destination as tapping the push notification
- Items without a meaningful destination (e.g., weekly summary) just mark as read on tap
- "Mark all read" button in inbox header -- clears all unread indicators and resets badge count
- Deep link destinations: workout complete -> session detail, PR achieved -> exercise progress chart, plan update -> plan detail, weekly summary -> inbox, alarm -> active workout, missed workout nudge -> active workout
- Cold start from notification: app opens directly to target screen, back button returns to dashboard
- Supabase `notifications` table with user_id, type, title, body, data (JSON), read (boolean), created_at
- RLS: users can only read/update their own notifications
- Edge Functions write notification records when dispatching push
- Local alarm/nudge notifications also write to the table for inbox consistency
- 30-day retention -- older notifications auto-pruned
- Interactive dev test screen hidden behind long-press on app version string in Settings
- Available in all builds (production included)
- Trigger buttons for all 6 notification types: alarm, nudge, workout complete, PR, plan update, weekly summary
- Each button sends a real notification that can be tapped to verify deep link navigation
- Bottom section shows recent notification debug log (last 10 received) with type, timestamp, and payload

### Claude's Discretion
- Notification type icon choices (Ionicons or similar)
- Badge count polling/subscription strategy (real-time vs on-app-focus)
- Deep link URL/route format
- Notification table cleanup implementation (cron function vs client-side prune)
- How local notifications (alarms/nudges) write to Supabase notifications table
- Debug log storage mechanism (in-memory vs MMKV)
- Empty inbox state design

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| expo-notifications | ~55.0.11 | Push/local notification handling, response listeners | Already installed, provides useLastNotificationResponse for cold-start |
| expo-router | ^55.0.4 | File-based navigation, deep link routing | Already installed, router.push() for programmatic navigation |
| @supabase/supabase-js | ^2.99.0 | Notifications table CRUD, Edge Function invocation | Already installed |
| zustand | ^5.0.11 | notificationStore for inbox state + unread count | Project standard state management |
| react-native-mmkv | ^4.2.0 | Notification store persistence, debug log storage | Project standard local persistence |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Ionicons (@expo/vector-icons) | bundled | Notification type icons, bell icon with badge | All icon rendering per project convention |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Polling unread count | Supabase Realtime subscription | Real-time is overkill for a friend-group app; polling on focus is simpler and sufficient |
| pg_cron for 30-day cleanup | Client-side prune on fetch | pg_cron is cleaner (runs server-side), but client-side prune is simpler to deploy and doesn't require SQL Editor access |

**Installation:** No new packages needed. All dependencies are already installed.

## Architecture Patterns

### Recommended Project Structure
```
src/
  features/
    notifications/
      components/
        NotificationInbox.tsx      # Full-screen notification list
        NotificationItem.tsx       # Single notification row
        BellBadge.tsx             # Bell icon with unread count badge
        EmptyInbox.tsx            # Empty state for inbox
      hooks/
        useNotifications.ts       # Fetch, mark read, mark all read
        useUnreadCount.ts         # Unread count polling on app focus
        usePushToken.ts           # (existing) push token registration
      utils/
        pushTokenRegistration.ts  # (existing) token registration
        deepLinkRouter.ts         # Parse notification data -> route
        notificationTypes.ts      # Type constants and icon mapping
      types.ts                    # NotificationRecord type
  stores/
    notificationStore.ts          # Zustand + MMKV for notifications
app/
  (app)/
    notifications.tsx             # Stack route for inbox screen
    dev-tools.tsx                 # Stack route for dev test screen
supabase/
  migrations/
    20260318000000_create_notifications.sql
  functions/
    send-push/index.ts            # (modify) also write to notifications table
    weekly-summary/index.ts       # (modify) also write to notifications table
```

### Pattern 1: Notification Deep Link Router
**What:** Central function that maps notification type + data payload to an Expo Router path
**When to use:** Called from both notification tap listener and inbox item tap handler
**Example:**
```typescript
// Source: project convention (Expo Router patterns from existing codebase)
type NotificationType = 'workout_complete' | 'pr_achieved' | 'plan_update' | 'weekly_summary' | 'alarm' | 'nudge';

interface NotificationData {
  type: NotificationType;
  session_id?: string;
  exercise_id?: string;
  exercise_name?: string;
  plan_id?: string;
  trainee_id?: string;
}

export function getDeepLinkRoute(data: NotificationData): string | null {
  switch (data.type) {
    case 'workout_complete':
      return data.session_id ? `/(app)/history/${data.session_id}` : null;
    case 'pr_achieved':
      return data.exercise_id ? `/(app)/progress/${data.exercise_id}` : null;
    case 'plan_update':
      return data.plan_id ? `/(app)/plans/${data.plan_id}` : null;
    case 'alarm':
    case 'nudge':
      return '/(app)/workout';
    case 'weekly_summary':
    default:
      return null; // No deep target, just mark as read
  }
}
```

### Pattern 2: Cold-Start + Foreground Notification Handling
**What:** Use `useLastNotificationResponse` for cold-start and `addNotificationResponseReceivedListener` for foreground taps
**When to use:** In root or app layout
**Example:**
```typescript
// Source: Expo Notifications docs (https://docs.expo.dev/versions/latest/sdk/notifications/)
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';

// Cold-start handling
const lastResponse = Notifications.useLastNotificationResponse();
useEffect(() => {
  if (
    lastResponse &&
    lastResponse.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER
  ) {
    const data = lastResponse.notification.request.content.data;
    const route = getDeepLinkRoute(data as NotificationData);
    if (route) router.push(route as any);
  }
}, [lastResponse]);

// Foreground tap handling (existing listener pattern in app/_layout.tsx)
const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
  if (response.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER) {
    const data = response.notification.request.content.data;
    const route = getDeepLinkRoute(data as NotificationData);
    if (route) router.push(route as any);
  }
});
```

### Pattern 3: Zustand + MMKV Notification Store
**What:** Follow exact same pattern as historyStore for notifications
**When to use:** For inbox state management with local persistence
**Example:**
```typescript
// Source: existing historyStore.ts pattern
const storage = createMMKV({ id: 'notification-storage' });

interface NotificationState {
  notifications: NotificationRecord[];
  unreadCount: number;
  isLoading: boolean;
  lastFetched: number | null;
}
```

### Pattern 4: Badge Count on App Focus
**What:** Re-fetch unread count when app returns to foreground
**When to use:** Instead of real-time subscription
**Example:**
```typescript
// Source: React Native AppState API pattern
import { AppState } from 'react-native';

useEffect(() => {
  const sub = AppState.addEventListener('change', (state) => {
    if (state === 'active') refreshUnreadCount();
  });
  return () => sub.remove();
}, []);
```

### Anti-Patterns to Avoid
- **Real-time subscription for badge count:** Supabase Realtime adds WebSocket complexity for minimal benefit in a friend-group app. Polling on focus is sufficient.
- **Storing notifications only locally:** Notifications must be in Supabase for cross-device consistency and so the inbox shows notifications from before the app was installed.
- **Separate deep link logic for push taps vs inbox taps:** Both should use the same `getDeepLinkRoute` function to ensure consistent behavior.
- **Blocking alarm/nudge scheduling on notification table write:** The Supabase write for local notifications should be fire-and-forget (try/catch with console.warn), matching the existing pattern for notification failures.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Notification badge on app icon | Custom badge counter | `Notifications.setBadgeCountAsync()` | OS-level badge, handles platform differences |
| Cold-start notification detection | Custom AsyncStorage flag | `Notifications.useLastNotificationResponse()` | Handles race conditions with app initialization |
| Relative timestamps ("2h ago") | Manual date math | Simple utility function (~10 lines) | Small enough to hand-roll, no library needed |
| 30-day cleanup | Complex background task | pg_cron SQL job or client-side prune-on-fetch | Server-side cron is most reliable |

## Common Pitfalls

### Pitfall 1: Cold-Start Navigation Race Condition
**What goes wrong:** App tries to navigate before the navigation tree is mounted
**Why it happens:** `useLastNotificationResponse` fires before Expo Router is ready
**How to avoid:** Place the deep link handler in `app/(app)/_layout.tsx` (not root layout) so navigation tree is already mounted. Check `isAuthenticated` before navigating. Use `setTimeout` with small delay (100-300ms) if needed.
**Warning signs:** Navigation silently fails on cold start, works fine when app is already open

### Pitfall 2: Snooze/Dismiss Action Conflict
**What goes wrong:** The existing snooze/dismiss handler in `app/_layout.tsx` processes all notification responses, potentially conflicting with new deep link routing
**Why it happens:** Both listeners fire for all notification interactions
**How to avoid:** Check `actionIdentifier` -- only route on `DEFAULT_ACTION_IDENTIFIER` (tap), let existing handler process `SNOOZE` and `DISMISS` actions. Move the deep link routing to `app/(app)/_layout.tsx` and keep alarm actions in root layout.
**Warning signs:** Tapping a notification triggers snooze logic or vice versa

### Pitfall 3: Edge Function Write Failure Blocking Push Delivery
**What goes wrong:** If the notification table insert fails, the push notification never sends
**Why it happens:** Sequential await without error isolation
**How to avoid:** Write notification record and send push in parallel, or send push first then write record. Push delivery is higher priority than inbox persistence.
**Warning signs:** Users stop receiving push notifications after notification table errors

### Pitfall 4: Local Notification Write Without Auth Context
**What goes wrong:** Local alarm/nudge notifications need to write to Supabase `notifications` table but may fire when user isn't actively authenticated
**Why it happens:** Alarms fire from the OS, not from within the app's auth context
**How to avoid:** Write the notification record when the alarm is *scheduled* (not when it fires), or write it when the app opens and processes the notification response. The scheduling approach is simpler since auth context is available.
**Warning signs:** Missing alarm/nudge entries in inbox

### Pitfall 5: Missing Notification Data Payload
**What goes wrong:** Deep link routing fails because notification data is missing required fields (session_id, exercise_id, etc.)
**Why it happens:** Edge Functions or client code don't include necessary identifiers in the push data payload
**How to avoid:** Extend all existing notification senders (notifyCoachWorkoutComplete, notifyCoachPR, notifyTraineePlanUpdate, weekly-summary) to include IDs needed for deep linking. Validate data before routing.
**Warning signs:** Notification taps navigate to wrong screen or don't navigate at all

## Code Examples

### Supabase Migration: Notifications Table
```sql
-- Source: project convention (matching existing migration patterns)
CREATE TABLE public.notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('workout_complete', 'pr_achieved', 'plan_update', 'weekly_summary', 'alarm', 'nudge')),
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  data        JSONB DEFAULT '{}',
  read        BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_unread
  ON public.notifications (user_id, read, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role inserts (Edge Functions use service_role key)
-- No INSERT policy needed for RLS since Edge Functions bypass RLS
```

### Edge Function: Write Notification Record (send-push extension)
```typescript
// Source: existing send-push/index.ts pattern
// After sending push, write notification records for each recipient
for (const recipientId of recipient_ids) {
  await adminClient.from('notifications').insert({
    user_id: recipientId,
    type: data?.type ?? 'unknown',
    title,
    body,
    data: data ?? {},
  });
}
```

### Bell Badge Component
```typescript
// Source: project convention (Ionicons + StyleSheet.create)
import { Ionicons } from '@expo/vector-icons';

export function BellBadge({ count, onPress }: { count: number; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={8}>
      <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
      {count > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {count > 9 ? '9+' : count}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
```

### Relative Timestamp Utility
```typescript
export function relativeTime(date: string | Date): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(date).toLocaleDateString();
}
```

### Notification Type Icon Map
```typescript
// Source: project convention (Ionicons for all icons)
const NOTIFICATION_ICONS: Record<string, { name: string; color: string }> = {
  workout_complete: { name: 'checkmark-circle', color: colors.success },
  pr_achieved:      { name: 'trophy', color: colors.warning },
  plan_update:      { name: 'clipboard', color: colors.accent },
  weekly_summary:   { name: 'bar-chart', color: colors.textSecondary },
  alarm:            { name: 'alarm', color: colors.accentBright },
  nudge:            { name: 'fitness', color: colors.warning },
};
```

### 30-Day Cleanup (pg_cron)
```sql
-- Run in Supabase SQL Editor to schedule daily cleanup at 3am UTC:
-- SELECT cron.schedule('notification-cleanup', '0 3 * * *', $$
--   DELETE FROM public.notifications
--   WHERE created_at < now() - interval '30 days';
-- $$);
```

### Dev Test Screen: Long-Press Handler on Version String
```typescript
// Source: project convention (Pressable with onLongPress)
<Pressable onLongPress={() => router.push('/dev-tools' as any)} delayLongPress={2000}>
  <Text style={styles.versionText}>v{Constants.expoConfig?.version ?? '1.0.0'}</Text>
</Pressable>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| getInitialNotification() | useLastNotificationResponse() | expo-notifications v0.18+ | More reliable cold-start handling, hook-based |
| Manual notification channel per type | Single channel + data-based routing | Current best practice | Simpler setup, routing via data payload not channel |
| expo-linking for deep links | Expo Router built-in deep links | Expo Router v3+ | File-based routes are auto-deep-linkable |

## Open Questions

1. **Version string location in Settings**
   - What we know: Settings screen currently has no version string displayed
   - What's unclear: Need to add a version text at the bottom of AccountSection for the long-press dev tools trigger
   - Recommendation: Add version text below AccountSection in settings.tsx, use `expo-constants` for version

2. **Notification data payload completeness**
   - What we know: Current push senders (notifyCoachWorkoutComplete, notifyCoachPR, notifyTraineePlanUpdate) include `type` and `trainee_id` but NOT session_id, exercise_id, or plan_id needed for deep linking
   - What's unclear: Whether changing the data payloads in existing senders will affect anything else
   - Recommendation: Add missing IDs to existing senders (session_id for workout_complete, exercise_name for PR, plan_id for plan_update). This is backward-compatible since extra data fields are ignored.

3. **Alarm/nudge notification persistence timing**
   - What we know: Alarms fire from OS, user may not have active auth session
   - What's unclear: Whether to write notification record at schedule-time or when user opens notification
   - Recommendation: Write at schedule-time for alarms (auth context available). For nudges, also write at schedule-time. This ensures inbox entries exist even if the notification is dismissed without opening the app.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest v29 + jest-expo v55 |
| Config file | package.json (jest section) |
| Quick run command | `npx jest --bail` |
| Full suite command | `npx jest` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| N/A-01 | Deep link router maps notification types to correct routes | unit | `npx jest tests/notifications/deepLinkRouter.test.ts -x` | No - Wave 0 |
| N/A-02 | Relative timestamp formatting | unit | `npx jest tests/notifications/relativeTime.test.ts -x` | No - Wave 0 |
| N/A-03 | Notification store mark-read and mark-all-read | unit | `npx jest tests/notifications/notificationStore.test.ts -x` | No - Wave 0 |
| N/A-04 | Notification type icon mapping returns valid icons | unit | `npx jest tests/notifications/notificationTypes.test.ts -x` | No - Wave 0 |
| N/A-05 | Unread count badge formatting (9+ for 10+) | unit | `npx jest tests/notifications/bellBadge.test.ts -x` | No - Wave 0 |
| N/A-06 | Dev test screen trigger button sends real notification | manual-only | N/A | N/A - requires device |

### Sampling Rate
- **Per task commit:** `npx jest --bail`
- **Per wave merge:** `npx jest`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/notifications/deepLinkRouter.test.ts` -- covers deep link route mapping
- [ ] `tests/notifications/relativeTime.test.ts` -- covers timestamp formatting
- [ ] `tests/notifications/notificationStore.test.ts` -- covers store mark-read logic
- [ ] `tests/notifications/notificationTypes.test.ts` -- covers icon mapping
- [ ] `tests/notifications/bellBadge.test.ts` -- covers badge count formatting

## Sources

### Primary (HIGH confidence)
- Expo Notifications SDK docs (https://docs.expo.dev/versions/latest/sdk/notifications/) - useLastNotificationResponse, addNotificationResponseReceivedListener, setBadgeCountAsync APIs
- Expo Push Notifications receiving guide (https://docs.expo.dev/push-notifications/receiving-notifications/) - foreground handler, response listener patterns
- Existing codebase: `app/_layout.tsx`, `src/features/notifications/`, `src/features/coaching/utils/notifyCoach.ts`, `src/features/coaching/utils/notifyTrainee.ts`, `supabase/functions/send-push/index.ts`

### Secondary (MEDIUM confidence)
- Expo Router deep linking discussion (https://github.com/expo/router/discussions/627) - community patterns for notification-based navigation
- Expo cold-start deep link issues (https://github.com/expo/expo/issues/39895) - known timing issues with modal screens

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already installed and in use
- Architecture: HIGH - follows established project patterns (Zustand+MMKV, Edge Functions, Expo Router stack routes)
- Pitfalls: HIGH - verified against existing codebase patterns and official Expo docs
- Deep linking: MEDIUM - cold-start race conditions may need runtime testing on physical devices

**Research date:** 2026-03-12
**Valid until:** 2026-04-12 (stable -- expo-notifications API is mature)
