import * as Notifications from 'expo-notifications';
import {
  scheduleAlarm,
  cancelAlarm,
  schedulePlanAlarms,
  syncActiveAlarms,
} from '@/features/alarms/hooks/useAlarmScheduler';
import type { AlarmConfig } from '@/features/alarms/types';
import type { Plan, PlanDay } from '@/features/plans/types';

// Mocks are loaded via moduleNameMapper in jest.config.js

beforeEach(() => {
  jest.clearAllMocks();
});

describe('scheduleAlarm', () => {
  const config: AlarmConfig = {
    planDayId: 'day-1',
    weekday: 1, // Monday (plan uses 0=Sun, 1=Mon, ...)
    hour: 6,
    minute: 30,
    dayName: 'Push',
  };

  it('calls scheduleNotificationAsync with correct params', async () => {
    await scheduleAlarm(config);

    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        identifier: 'alarm_day-1',
        content: expect.objectContaining({
          title: 'Wake-up alarm',
          body: 'Time to get ready -- Push workout',
          sound: true,
          categoryIdentifier: 'alarm',
        }),
        trigger: expect.objectContaining({
          weekday: 1, // Monday in expo (ISO) = 1
          hour: 6,
          minute: 30,
        }),
      }),
    );
  });
});

describe('cancelAlarm', () => {
  it('calls cancelScheduledNotificationAsync with deterministic ID', async () => {
    await cancelAlarm('day-1');

    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('alarm_day-1');
  });
});

describe('schedulePlanAlarms', () => {
  const makePlanDay = (overrides: Partial<PlanDay> = {}): PlanDay => ({
    id: 'day-1',
    plan_id: 'plan-1',
    day_name: 'Push',
    weekday: 0,
    sort_order: 0,
    created_at: '2026-01-01',
    alarm_time: '06:30',
    alarm_enabled: true,
    plan_day_exercises: [],
    ...overrides,
  });

  it('schedules alarm and nudge for eligible days', async () => {
    await schedulePlanAlarms([makePlanDay()]);

    // Should schedule both alarm and nudge
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(2);
  });

  it('skips days with weekday=null', async () => {
    await schedulePlanAlarms([makePlanDay({ weekday: null })]);

    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('skips days with alarm_enabled=false', async () => {
    await schedulePlanAlarms([makePlanDay({ alarm_enabled: false })]);

    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('skips days with alarm_time=null', async () => {
    await schedulePlanAlarms([makePlanDay({ alarm_time: null })]);

    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });
});

describe('syncActiveAlarms', () => {
  const makePlan = (id: string, isActive: boolean, days: PlanDay[]): Plan => ({
    id,
    user_id: 'user-1',
    name: `Plan ${id}`,
    is_active: isActive,
    coach_id: null,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
    plan_days: days,
  });

  const activeDay: PlanDay = {
    id: 'active-day',
    plan_id: 'plan-active',
    day_name: 'Pull',
    weekday: 1,
    sort_order: 0,
    created_at: '2026-01-01',
    alarm_time: '07:00',
    alarm_enabled: true,
    plan_day_exercises: [],
  };

  const inactiveDay: PlanDay = {
    id: 'inactive-day',
    plan_id: 'plan-inactive',
    day_name: 'Legs',
    weekday: 2,
    sort_order: 0,
    created_at: '2026-01-01',
    alarm_time: '08:00',
    alarm_enabled: true,
    plan_day_exercises: [],
  };

  it('cancels all alarms then schedules only for active plan', async () => {
    const plans = [
      makePlan('plan-active', true, [activeDay]),
      makePlan('plan-inactive', false, [inactiveDay]),
    ];

    await syncActiveAlarms(plans);

    // Cancel for both plans (alarm + nudge each = 4 cancel calls)
    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledTimes(4);

    // Schedule only for active plan (alarm + nudge = 2 schedule calls)
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(2);
  });
});
