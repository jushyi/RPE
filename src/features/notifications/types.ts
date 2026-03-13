/**
 * Notification type definitions for the in-app notification system.
 */

export type NotificationType =
  | 'workout_complete'
  | 'pr_achieved'
  | 'plan_update'
  | 'weekly_summary'
  | 'alarm'
  | 'nudge';

export interface NotificationData {
  type: NotificationType;
  session_id?: string;
  exercise_id?: string;
  exercise_name?: string;
  plan_id?: string;
  trainee_id?: string;
}

export interface NotificationRecord {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: NotificationData;
  read: boolean;
  created_at: string;
}
