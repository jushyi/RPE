import * as Notifications from 'expo-notifications';
import {
  cancelTodaysNudges,
} from '@/features/alarms/hooks/useAlarmScheduler';
import type { Plan, PlanDay } from '@/features/plans/types';

// Mocks are loaded via moduleNameMapper in jest.config.js

beforeEach(() => {
  jest.clearAllMocks();
});

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

describe('cancelTodaysNudges', () => {
  it('cancels nudge for active plan day matching today weekday', async () => {
    const plans = [
      makePlan('plan-1', true, [
        makePlanDay({ id: 'day-mon', weekday: 0, alarm_enabled: true }),
        makePlanDay({ id: 'day-tue', weekday: 1, alarm_enabled: true }),
      ]),
    ];

    await cancelTodaysNudges(plans, 0); // Monday

    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledTimes(1);
    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('nudge_day-mon');
  });

  it('does not cancel when no active plan exists', async () => {
    const plans = [
      makePlan('plan-1', false, [
        makePlanDay({ id: 'day-mon', weekday: 0, alarm_enabled: true }),
      ]),
    ];

    await cancelTodaysNudges(plans, 0);

    expect(Notifications.cancelScheduledNotificationAsync).not.toHaveBeenCalled();
  });

  it('does not cancel when active plan has no matching weekday', async () => {
    const plans = [
      makePlan('plan-1', true, [
        makePlanDay({ id: 'day-tue', weekday: 1, alarm_enabled: true }),
      ]),
    ];

    await cancelTodaysNudges(plans, 0); // Monday, but plan only has Tuesday

    expect(Notifications.cancelScheduledNotificationAsync).not.toHaveBeenCalled();
  });

  it('does not cancel for days with alarm_enabled=false', async () => {
    const plans = [
      makePlan('plan-1', true, [
        makePlanDay({ id: 'day-mon', weekday: 0, alarm_enabled: false }),
      ]),
    ];

    await cancelTodaysNudges(plans, 0);

    expect(Notifications.cancelScheduledNotificationAsync).not.toHaveBeenCalled();
  });
});
