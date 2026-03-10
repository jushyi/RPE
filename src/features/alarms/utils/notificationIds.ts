/**
 * Deterministic notification ID generation from plan_day_id.
 */

export function alarmNotificationId(planDayId: string): string {
  return `alarm_${planDayId}`;
}

export function nudgeNotificationId(planDayId: string): string {
  return `nudge_${planDayId}`;
}
