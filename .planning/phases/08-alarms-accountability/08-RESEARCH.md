# Phase 8: Alarms + Accountability - Research

**Researched:** 2026-03-10
**Domain:** Local notifications, alarm scheduling, background tasks (React Native / Expo)
**Confidence:** MEDIUM-HIGH

## Summary

Phase 8 adds alarm notifications tied to plan days (wake-up alarms on training days) and missed-workout nudge notifications. The user decision explicitly scopes this to iOS-first development with standard high-priority notifications (no Critical Alerts), system default alarm sound, and snooze + dismiss buttons. Android full-screen intents are deferred.

The key library decision has shifted since the original STATE.md note about notifee. Notifee's maintainers have publicly stated the library is "only barely" maintained and officially recommend migrating to expo-notifications. Since this is an Expo SDK 55 managed workflow project and the iOS-first scope does not require Android full-screen intents, **expo-notifications is the correct choice** -- it is actively maintained, natively supported in the Expo ecosystem, and covers all Phase 8 requirements (weekly recurring triggers, notification categories with action buttons, custom identifiers for deterministic management, and Android notification channels).

**Primary recommendation:** Use `expo-notifications` for all alarm and nudge notification scheduling. Use `@react-native-community/datetimepicker` for the time picker in DaySlotEditor. Implement nudge auto-cancel locally (cancel scheduled notification on workout completion) rather than using a background task or server-side cron.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Alarm setup UX: Inline in plan builder -- when a day slot has a weekday mapped, a "Wake-up alarm" time picker row appears in the day slot editor
- No alarm option shown for days without a weekday mapped
- First day starts with blank time; subsequent days default to whatever the user set for the previous day
- Per-day toggle switch next to the time picker to enable/disable alarm without clearing the saved time
- Label: "Wake-up alarm"
- iOS-first development -- standard high-priority notifications (no Critical Alerts for v1)
- System default alarm sound (no custom audio assets)
- Snooze + dismiss buttons on the notification
- Notification message: "Time to get ready -- [Day Name] workout"
- Android full-screen intent deferred
- Nudge fires 4 hours after the alarm time (alarm at 6 AM = nudge at 10 AM)
- Playfully guilt-trippy tone ("Skipping leg day?" style messages)
- Nudge auto-cancels if user logs workout before nudge fires
- Nudge only fires for active plan's scheduled days
- Alarms managed exclusively inside plan detail
- Only active plan's alarms are live -- switching active plan cancels old alarms and activates new ones
- Deleting a plan silently cancels all its alarms
- Global "pause all alarms" toggle in settings tab (Phase 8 adds this toggle)

### Claude's Discretion
- Snooze duration (5-10 min range)
- Specific playful nudge message variations
- Notification channel configuration details
- How alarm state persists across device reboots
- Time picker component choice and styling
- How nudge auto-cancel is implemented (cancel scheduled notification on workout log, or background check)

### Deferred Ideas (OUT OF SCOPE)
- Critical Alerts on iOS (bypass DND/silent mode)
- Android full-screen intent alarm takeover
- Alarm summary/overview screen
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ALRM-01 | When creating a plan with training days, user is prompted to set alarm times | expo-notifications WeeklyTriggerInput for recurring scheduling; @react-native-community/datetimepicker for time picker inline in DaySlotEditor; alarm_time + alarm_enabled columns on plan_days table |
| ALRM-02 | Alarms fire with sound and vibration and must be dismissed | expo-notifications notification categories with Snooze/Dismiss action buttons; Android notification channel with MAX importance, sound, vibration; iOS sound: true |
| ALRM-03 | User receives notification if a planned workout day passes without a logged session | Nudge scheduled as second notification 4 hours after alarm; auto-canceled via cancelScheduledNotificationAsync when workout is completed in useWorkoutSession finishWorkout flow |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| expo-notifications | ~55.x | Schedule/cancel local notifications, notification categories with action buttons, notification channels | Official Expo SDK library, actively maintained, native support for WeeklyTriggerInput and custom identifiers |
| @react-native-community/datetimepicker | latest | Native time picker for alarm time selection | Official RN community component, Expo-compatible, native platform pickers |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| expo-device | ~55.x | Check if running on physical device (notifications don't work in simulator) | Dev-time guard for notification testing |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| expo-notifications | @notifee/react-native | Notifee is barely maintained (maintainer recommends expo-notifications); would add native dependency risk for no benefit given iOS-first scope |
| expo-notifications | expo-alarm-module | Only 42 weekly downloads, untested beyond RN 0.73, not viable for RN 0.83 / SDK 55 |
| @react-native-community/datetimepicker | react-native-modal-datetime-picker | Wrapper around the same component; adds unnecessary dependency layer |
| expo-background-task | Local schedule-and-cancel | For nudge notifications, scheduling upfront and canceling on workout completion is simpler and more reliable than background task polling |

**Installation:**
```bash
npx expo install expo-notifications @react-native-community/datetimepicker expo-device
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  features/
    alarms/
      hooks/
        useAlarmScheduler.ts      # Core scheduling/canceling logic
        useNudgeScheduler.ts      # Nudge notification scheduling
      utils/
        notificationIds.ts        # Deterministic ID generation
        nudgeMessages.ts          # Playful nudge message pool
      constants.ts                # Channel IDs, category IDs, snooze duration
      types.ts                    # AlarmConfig, NudgeConfig types
  stores/
    alarmStore.ts                 # MMKV-persisted store: notification ID map, pause toggle
```

### Pattern 1: Deterministic Notification IDs
**What:** Generate predictable notification identifiers from plan_day_id so notifications can be canceled without storing random IDs.
**When to use:** Every alarm schedule and cancel operation.
**Example:**
```typescript
// src/features/alarms/utils/notificationIds.ts
export function alarmNotificationId(planDayId: string): string {
  return `alarm_${planDayId}`;
}

export function nudgeNotificationId(planDayId: string): string {
  return `nudge_${planDayId}`;
}
```

### Pattern 2: Schedule-on-Save, Cancel-on-Delete
**What:** Alarm notifications are scheduled when a plan is saved/updated and canceled when the plan is deleted or deactivated. This is a side effect of the plan CRUD operations, not a separate workflow.
**When to use:** Every plan save, plan delete, and active plan switch.
**Example:**
```typescript
// Hook into existing plan save flow
async function onPlanSaved(plan: Plan) {
  // Cancel all existing alarms for this plan
  await cancelPlanAlarms(plan.id, plan.plan_days);

  // If this plan is active, schedule new alarms
  if (plan.is_active) {
    await schedulePlanAlarms(plan.plan_days);
  }
}
```

### Pattern 3: Notification Category with Actions
**What:** Register a notification category with Snooze and Dismiss buttons before any alarm fires.
**When to use:** App startup (register once).
**Example:**
```typescript
import * as Notifications from 'expo-notifications';

await Notifications.setNotificationCategoryAsync('alarm', [
  {
    identifier: 'SNOOZE',
    buttonTitle: 'Snooze',
    options: { opensAppToForeground: false },
  },
  {
    identifier: 'DISMISS',
    buttonTitle: 'Dismiss',
    options: { opensAppToForeground: false },
  },
]);
```

### Pattern 4: WeeklyTriggerInput for Recurring Alarms
**What:** expo-notifications supports `WeeklyTriggerInput` which fires every week on a specific weekday + hour + minute.
**When to use:** Scheduling alarm notifications tied to plan day weekdays.
**Example:**
```typescript
import * as Notifications from 'expo-notifications';

// weekday: 1=Sunday, 2=Monday, ..., 7=Saturday (expo-notifications convention)
// NOTE: plan_days.weekday uses 0=Mon, 1=Tue, ..., 6=Sun
// Must convert: planWeekday 0(Mon) -> expoWeekday 2(Monday)
const expoWeekday = ((planWeekday + 1) % 7) + 1;

await Notifications.scheduleNotificationAsync({
  identifier: alarmNotificationId(planDayId),
  content: {
    title: 'Wake-up alarm',
    body: `Time to get ready -- ${dayName} workout`,
    sound: true,
    categoryIdentifier: 'alarm',
    priority: Notifications.AndroidNotificationPriority.MAX,
  },
  trigger: {
    type: 'weekly',
    weekday: expoWeekday,
    hour: alarmHour,
    minute: alarmMinute,
    repeats: true,
    channelId: 'alarm-channel',
  },
});
```

### Pattern 5: Nudge as Scheduled Notification (Cancel on Workout)
**What:** When an alarm is scheduled, also schedule the nudge notification for 4 hours later on the same weekday. When the user completes a workout, cancel the nudge.
**When to use:** Nudge scheduling alongside alarm scheduling; nudge cancellation in finishWorkout flow.

### Pattern 6: MMKV-Backed Alarm Store
**What:** Persist alarm metadata (pause toggle, active plan ID for alarm tracking) in MMKV via Zustand, same pattern as planStore and workoutStore.
**When to use:** Global pause toggle, tracking which plan's alarms are currently active.

### Anti-Patterns to Avoid
- **Scheduling alarms from a background task:** Don't use expo-background-task to periodically check and schedule alarms. Schedule them deterministically on plan save and cancel on plan delete/deactivate.
- **Storing random notification IDs:** Don't save auto-generated IDs in a database. Use deterministic IDs derived from plan_day_id so you can always reconstruct the ID to cancel.
- **Using notifee alongside expo-notifications:** Don't mix notification libraries. Notifee is barely maintained and conflicts are likely.
- **Scheduling nudge as a separate background check:** Don't poll. Schedule the nudge upfront and cancel it when a workout is logged -- simpler, more reliable, zero background task overhead.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Time picker UI | Custom scrolling time selector | @react-native-community/datetimepicker mode="time" | Native platform picker, accessibility built-in, handles AM/PM vs 24h |
| Recurring weekly schedule | Manual date arithmetic + setTimeout | expo-notifications WeeklyTriggerInput | OS-level scheduling survives app kill, handles timezone, DST |
| Notification action buttons | Custom full-screen overlay | Notifications.setNotificationCategoryAsync | Native notification actions, works when app is killed |
| Notification channels (Android) | Manual channel creation | Notifications.setNotificationChannelAsync | Required for Android 8+, one-time setup |
| Notification permissions | Manual platform checks | Notifications.requestPermissionsAsync | Handles iOS permission dialog, Android 13+ POST_NOTIFICATIONS |

**Key insight:** Alarm scheduling is deceptively complex (timezone handling, DST transitions, device reboots, app kill states). expo-notifications delegates all of this to the OS notification scheduler which handles it correctly.

## Common Pitfalls

### Pitfall 1: Weekday Number Mismatch
**What goes wrong:** expo-notifications uses 1=Sunday through 7=Saturday. The app's plan_days.weekday uses 0=Monday through 6=Sunday. Off-by-one weekday mapping causes alarms to fire on wrong days.
**Why it happens:** Different conventions between the app's data model and the notification API.
**How to avoid:** Create a single conversion function `planWeekdayToExpo(weekday: number): number` and use it everywhere. Unit test it exhaustively.
**Warning signs:** Alarms firing on the wrong day of the week.

### Pitfall 2: Notification Category Actions Not Showing on Android Background
**What goes wrong:** On Android, notification action buttons (Snooze/Dismiss) may not appear when the app is killed or in background.
**Why it happens:** Known expo-notifications issue (GitHub #36282, #31503). Categories must be registered at app startup, and Android requires the notification to be associated with the category via `categoryIdentifier`.
**How to avoid:** Register categories in the app's root _layout.tsx useEffect on mount. Always include `categoryIdentifier` in notification content. Test on physical device in killed state.
**Warning signs:** Buttons visible in foreground but missing in background.

### Pitfall 3: Android Notification Channel Immutability
**What goes wrong:** After creating a notification channel, you cannot change its importance, sound, or vibration settings programmatically. Users must manually change channel settings.
**Why it happens:** Android API design -- channels are created once and then controlled by the user.
**How to avoid:** Get channel configuration right on first creation. Use a versioned channel ID (e.g., `alarm-channel-v1`) so you can create a new channel if settings need to change.
**Warning signs:** Changing channel code has no effect on existing installs.

### Pitfall 4: Snooze Re-Scheduling Complexity
**What goes wrong:** The "Snooze" action must reschedule the notification for N minutes later. This requires handling the notification response and scheduling a new one-shot notification.
**Why it happens:** Notification categories handle button press, but rescheduling is app logic.
**How to avoid:** Use `addNotificationResponseReceivedListener` to detect SNOOZE action, then schedule a one-shot notification with `{ type: 'timeInterval', seconds: snoozeSeconds }` trigger.
**Warning signs:** Snooze button does nothing, or snooze fires but then the weekly alarm also fires.

### Pitfall 5: Nudge Not Canceling on Workout Completion
**What goes wrong:** User completes a workout but still receives the nudge notification.
**Why it happens:** The nudge cancel call is missing from the workout completion flow, or the notification ID doesn't match.
**How to avoid:** In useWorkoutSession's finishWorkout, call `cancelScheduledNotificationAsync(nudgeNotificationId(planDayId))`. Must determine which plan day the workout corresponds to.
**Warning signs:** Users getting nudged after completing their workout.

### Pitfall 6: Permission Denial Silently Breaks Everything
**What goes wrong:** User denies notification permission, alarms are "scheduled" but never fire, no feedback to user.
**Why it happens:** Scheduling doesn't throw on permission denial -- it just silently fails to deliver.
**How to avoid:** Check permission status before scheduling. Show inline alert in plan builder if notifications are disabled. Provide deep link to system settings.
**Warning signs:** Alarms appear saved but never fire.

## Code Examples

### Notification Permission Request
```typescript
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

export async function requestNotificationPermission(): Promise<boolean> {
  if (!Device.isDevice) {
    console.warn('Notifications require a physical device');
    return false;
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowSound: true, allowBadge: false },
  });

  return status === 'granted';
}
```

### Android Notification Channel Setup
```typescript
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export async function setupAlarmChannel() {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync('alarm-channel-v1', {
    name: 'Workout Alarms',
    importance: Notifications.AndroidImportance.MAX,
    sound: 'default',
    vibrationPattern: [0, 500, 250, 500],
    enableVibrate: true,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });

  await Notifications.setNotificationChannelAsync('nudge-channel-v1', {
    name: 'Workout Reminders',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    enableVibrate: true,
  });
}
```

### Snooze Handler
```typescript
import * as Notifications from 'expo-notifications';

const SNOOZE_MINUTES = 8; // Claude's discretion: 8 min is a good middle ground

Notifications.addNotificationResponseReceivedListener((response) => {
  const actionId = response.actionIdentifier;

  if (actionId === 'SNOOZE') {
    const content = response.notification.request.content;
    // Schedule a one-shot snooze notification
    Notifications.scheduleNotificationAsync({
      content: {
        ...content,
        categoryIdentifier: 'alarm',
      },
      trigger: {
        type: 'timeInterval',
        seconds: SNOOZE_MINUTES * 60,
        repeats: false,
      },
    });
  }
  // DISMISS: no action needed, notification is already dismissed
});
```

### Schema Migration
```sql
-- Add alarm columns to plan_days
ALTER TABLE plan_days
  ADD COLUMN alarm_time TEXT DEFAULT NULL,
  ADD COLUMN alarm_enabled BOOLEAN DEFAULT false;

-- alarm_time stores "HH:MM" format (24-hour)
-- alarm_enabled is the per-day toggle
```

### Time Picker Integration in DaySlotEditor
```typescript
import DateTimePicker from '@react-native-community/datetimepicker';

// Only show when weekday is mapped (not null)
{day.weekday !== null && (
  <View style={s.alarmRow}>
    <Ionicons name="alarm-outline" size={18} color={colors.textSecondary} />
    <Text style={s.alarmLabel}>Wake-up alarm</Text>
    <Switch
      value={day.alarmEnabled}
      onValueChange={(v) => handleAlarmToggle(dayIndex, v)}
    />
    {day.alarmEnabled && (
      <DateTimePicker
        mode="time"
        value={parseAlarmTime(day.alarmTime)}
        onChange={(_, date) => handleAlarmTimeChange(dayIndex, date)}
        display="default"
        themeVariant="dark"
      />
    )}
  </View>
)}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| @notifee/react-native | expo-notifications | 2024-2025 (notifee maintenance decline) | notifee maintainer recommends expo-notifications; expo-notifications now covers most use cases |
| expo-background-fetch | expo-background-task | 2025 (Expo blog post) | New API using BGTaskScheduler (iOS) and WorkManager (Android); not needed for this phase's nudge approach |
| Manual notification ID tracking | Custom identifier in NotificationRequestInput | expo-notifications feature | Deterministic IDs eliminate need for ID storage |

**Deprecated/outdated:**
- **notifee:** Barely maintained, maintainer explicitly recommends expo-notifications (GitHub issue #1254)
- **expo-background-fetch:** Being replaced by expo-background-task, not receiving patches

## Open Questions

1. **Snooze re-fires alongside weekly recurring alarm**
   - What we know: Snooze schedules a one-shot notification. The weekly recurring alarm is separate.
   - What's unclear: If the user snoozes and the snooze fires, does the next weekly alarm still fire on schedule? (Answer: yes, they are independent -- but this is correct behavior since they are a week apart)
   - Recommendation: No issue -- the snooze is a same-day one-shot, the recurring alarm is weekly.

2. **Nudge timing when alarm is not set**
   - What we know: CONTEXT says nudge fires 4 hours after alarm time.
   - What's unclear: What if a day has a weekday mapped but alarm is disabled? Should nudge still fire?
   - Recommendation: No nudge without an alarm. The nudge is tied to the alarm being active -- if no alarm, no nudge.

3. **Reboot persistence for expo-notifications**
   - What we know: expo-notifications adds RECEIVE_BOOT_COMPLETED permission automatically on Android, which re-schedules notifications after reboot. iOS handles this natively.
   - What's unclear: Whether WeeklyTriggerInput specifically persists across iOS reboot.
   - Recommendation: iOS persists local notification schedules across reboots natively. HIGH confidence this works, but should be validated on device.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29 + jest-expo 55 |
| Config file | jest.config.js |
| Quick run command | `npx jest --bail` |
| Full suite command | `npx jest` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ALRM-01 | Deterministic notification ID generation | unit | `npx jest tests/alarms/notificationIds.test.ts -x` | Wave 0 |
| ALRM-01 | Weekday conversion planWeekday -> expoWeekday | unit | `npx jest tests/alarms/weekdayConversion.test.ts -x` | Wave 0 |
| ALRM-01 | Alarm scheduling called on plan save with correct params | unit | `npx jest tests/alarms/alarmScheduler.test.ts -x` | Wave 0 |
| ALRM-02 | Notification category registered with Snooze/Dismiss | unit | `npx jest tests/alarms/notificationSetup.test.ts -x` | Wave 0 |
| ALRM-02 | Snooze handler reschedules notification | unit | `npx jest tests/alarms/snoozeHandler.test.ts -x` | Wave 0 |
| ALRM-03 | Nudge message selection from pool | unit | `npx jest tests/alarms/nudgeMessages.test.ts -x` | Wave 0 |
| ALRM-03 | Nudge canceled when workout completed | unit | `npx jest tests/alarms/nudgeCancel.test.ts -x` | Wave 0 |
| ALRM-01 | DaySlotEditor shows alarm row when weekday is mapped | manual-only | N/A -- UI rendering with native DateTimePicker | N/A |
| ALRM-02 | Alarm actually fires on device with sound/vibration | manual-only | N/A -- requires physical device | N/A |

### Sampling Rate
- **Per task commit:** `npx jest --bail`
- **Per wave merge:** `npx jest`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/alarms/notificationIds.test.ts` -- covers deterministic ID generation
- [ ] `tests/alarms/weekdayConversion.test.ts` -- covers weekday mapping
- [ ] `tests/alarms/alarmScheduler.test.ts` -- covers schedule/cancel logic
- [ ] `tests/alarms/nudgeMessages.test.ts` -- covers message pool selection
- [ ] `tests/alarms/nudgeCancel.test.ts` -- covers nudge cancellation flow
- [ ] `tests/__mocks__/expo-notifications.ts` -- mock for expo-notifications module
- [ ] `tests/__mocks__/expo-device.ts` -- mock for expo-device module
- [ ] Jest config update: add `expo-notifications` and `expo-device` to moduleNameMapper

## Sources

### Primary (HIGH confidence)
- [expo-notifications docs](https://docs.expo.dev/versions/latest/sdk/notifications/) -- WeeklyTriggerInput, notification categories, custom identifiers, channel setup, permissions
- [@react-native-community/datetimepicker docs](https://docs.expo.dev/versions/latest/sdk/date-time-picker/) -- Time picker API and Expo compatibility
- [expo-notifications npm](https://www.npmjs.com/package/expo-notifications) -- Version ~55.0.11 for SDK 55

### Secondary (MEDIUM confidence)
- [notifee maintenance status (GitHub #1254)](https://github.com/invertase/notifee/issues/1254) -- Maintainer confirms barely maintained, recommends expo-notifications
- [notifee vs expo-notifications gap analysis (GitHub #1266)](https://github.com/invertase/notifee/issues/1266) -- Feature comparison; gaps are mostly Android-specific (full-screen intent, progress indicators) which are out of scope
- [expo-notifications action buttons issue (GitHub #36282)](https://github.com/expo/expo/issues/36282) -- Known issue with action buttons not showing in Android background/killed state
- [expo-background-task announcement](https://expo.dev/blog/goodbye-background-fetch-hello-expo-background-task) -- New background task API (not needed for this phase's approach)

### Tertiary (LOW confidence)
- expo-alarm-module npm page -- Confirmed non-viable (42 downloads/week, untested past RN 0.73)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- expo-notifications is the official Expo SDK notification library, @react-native-community/datetimepicker is the standard RN time picker
- Architecture: HIGH -- patterns are straightforward: schedule on save, cancel on delete, deterministic IDs, notification categories for actions
- Pitfalls: MEDIUM -- notification action buttons on Android background is a known issue but may not affect iOS-first scope; weekday conversion is well-understood but easy to get wrong

**Research date:** 2026-03-10
**Valid until:** 2026-04-10 (stable libraries, low churn)
