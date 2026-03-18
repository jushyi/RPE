import { getDeepLinkRoute } from '@/features/notifications/utils/deepLinkRouter';
import type { NotificationData } from '@/features/notifications/types';

describe('getDeepLinkRoute', () => {
  it('returns session detail route for workout_complete with session_id', () => {
    const data: NotificationData = { type: 'workout_complete', session_id: 'abc' };
    expect(getDeepLinkRoute(data)).toBe('/(app)/history/abc');
  });

  it('returns exercise progress route for pr_achieved with exercise_id (trainee own context)', () => {
    const data: NotificationData = { type: 'pr_achieved', exercise_id: 'xyz', exercise_name: 'Bench' };
    expect(getDeepLinkRoute(data)).toBe('/(app)/progress/xyz');
  });

  it('returns trainee history route for pr_achieved with trainee_id (coach context)', () => {
    const data: NotificationData = { type: 'pr_achieved', trainee_id: 't1', trainee_name: 'Jane Doe', exercise_id: 'xyz' };
    expect(getDeepLinkRoute(data)).toBe('/(app)/plans/trainee-history?traineeId=t1&traineeName=Jane%20Doe');
  });

  it('returns trainee history route for pr_achieved with trainee_id but no trainee_name', () => {
    const data: NotificationData = { type: 'pr_achieved', trainee_id: 't1', exercise_id: 'xyz' };
    expect(getDeepLinkRoute(data)).toBe('/(app)/plans/trainee-history?traineeId=t1');
  });

  it('returns plan detail route for plan_update with plan_id', () => {
    const data: NotificationData = { type: 'plan_update', plan_id: 'p1' };
    expect(getDeepLinkRoute(data)).toBe('/(app)/plans/p1');
  });

  it('returns workout route for alarm', () => {
    const data: NotificationData = { type: 'alarm' };
    expect(getDeepLinkRoute(data)).toBe('/(app)/workout');
  });

  it('returns workout route for nudge', () => {
    const data: NotificationData = { type: 'nudge' };
    expect(getDeepLinkRoute(data)).toBe('/(app)/workout');
  });

  it('returns null for weekly_summary (no deep target)', () => {
    const data: NotificationData = { type: 'weekly_summary' };
    expect(getDeepLinkRoute(data)).toBeNull();
  });

  it('returns null for workout_complete without session_id', () => {
    const data: NotificationData = { type: 'workout_complete' };
    expect(getDeepLinkRoute(data)).toBeNull();
  });

  it('returns null for pr_achieved without exercise_id', () => {
    const data: NotificationData = { type: 'pr_achieved' };
    expect(getDeepLinkRoute(data)).toBeNull();
  });

  it('returns null for plan_update without plan_id', () => {
    const data: NotificationData = { type: 'plan_update' };
    expect(getDeepLinkRoute(data)).toBeNull();
  });
});
