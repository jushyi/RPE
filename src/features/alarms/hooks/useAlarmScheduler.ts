/**
 * Alarm scheduling functions for workout notifications.
 * Despite the hook-like name, these are pure async functions (not React hooks).
 */

import * as Notifications from 'expo-notifications';
import type { AlarmConfig } from '../types';
import type { Plan, PlanDay } from '@/features/plans/types';
import { alarmNotificationId, nudgeNotificationId } from '../utils/notificationIds';
import { planWeekdayToExpo } from '../utils/weekdayConversion';
import { getRandomNudgeMessage } from '../utils/nudgeMessages';
import {
  ALARM_CHANNEL_ID,
  NUDGE_CHANNEL_ID,
  ALARM_CATEGORY_ID,
  NUDGE_DELAY_HOURS,
} from '../constants';

/**
 * Schedule a weekly alarm notification for a plan day.
 */
export async function scheduleAlarm(config: AlarmConfig): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    identifier: alarmNotificationId(config.planDayId),
    content: {
      title: 'Wake-up alarm',
      body: `Time to get ready -- ${config.dayName} workout`,
      sound: true,
      categoryIdentifier: ALARM_CATEGORY_ID,
      priority: Notifications.AndroidNotificationPriority?.MAX,
      ...(ALARM_CHANNEL_ID ? { channelId: ALARM_CHANNEL_ID } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: planWeekdayToExpo(config.weekday),
      hour: config.hour,
      minute: config.minute,
    },
  });
}

/**
 * Cancel a scheduled alarm for a plan day.
 */
export async function cancelAlarm(planDayId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(alarmNotificationId(planDayId));
}

/**
 * Schedule a weekly nudge notification for a plan day.
 * Fires NUDGE_DELAY_HOURS after the alarm time.
 */
export async function scheduleNudge(config: AlarmConfig): Promise<void> {
  let nudgeHour = config.hour + NUDGE_DELAY_HOURS;
  let nudgeWeekday = config.weekday;

  // Handle hour overflow past midnight
  if (nudgeHour >= 24) {
    nudgeHour -= 24;
    nudgeWeekday = (nudgeWeekday + 1) % 7;
  }

  await Notifications.scheduleNotificationAsync({
    identifier: nudgeNotificationId(config.planDayId),
    content: {
      title: 'Workout reminder',
      body: getRandomNudgeMessage(config.dayName),
      sound: true,
      ...(NUDGE_CHANNEL_ID ? { channelId: NUDGE_CHANNEL_ID } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: planWeekdayToExpo(nudgeWeekday),
      hour: nudgeHour,
      minute: config.minute,
    },
  });
}

/**
 * Cancel a scheduled nudge for a plan day.
 */
export async function cancelNudge(planDayId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(nudgeNotificationId(planDayId));
}

/**
 * Schedule alarms and nudges for all eligible plan days.
 * Only schedules for days with weekday set, alarm_enabled, and alarm_time set.
 */
export async function schedulePlanAlarms(planDays: PlanDay[]): Promise<void> {
  for (const day of planDays) {
    if (day.weekday === null || !day.alarm_enabled || !day.alarm_time) {
      continue;
    }

    const [hourStr, minuteStr] = day.alarm_time.split(':');
    const config: AlarmConfig = {
      planDayId: day.id,
      weekday: day.weekday,
      hour: parseInt(hourStr, 10),
      minute: parseInt(minuteStr, 10),
      dayName: day.day_name,
    };

    await scheduleAlarm(config);
    await scheduleNudge(config);
  }
}

/**
 * Cancel all alarms and nudges for given plan days.
 */
export async function cancelPlanAlarms(planDays: PlanDay[]): Promise<void> {
  for (const day of planDays) {
    await cancelAlarm(day.id);
    await cancelNudge(day.id);
  }
}

/**
 * Sync alarms: cancel all, then schedule only for the active plan.
 * Called when active plan changes.
 */
export async function syncActiveAlarms(plans: Plan[]): Promise<void> {
  // Cancel all alarms for all plans
  for (const plan of plans) {
    await cancelPlanAlarms(plan.plan_days);
  }

  // Schedule alarms only for the active plan
  const activePlan = plans.find((p) => p.is_active);
  if (activePlan) {
    await schedulePlanAlarms(activePlan.plan_days);
  }
}
