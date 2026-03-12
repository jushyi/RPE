/**
 * Coaching system type definitions.
 * Mirrors the database schema from 20260317000001_create_coaching.sql.
 */

export interface CoachingRelationship {
  id: string;
  coach_id: string;
  trainee_id: string;
  created_at: string;
}

export interface InviteCode {
  id: string;
  coach_id: string;
  code: string;
  expires_at: string;
  redeemed_by: string | null;
  created_at: string;
}

export interface CoachNote {
  id: string;
  plan_id: string;
  coach_id: string;
  note: string;
  created_at: string;
}

/** Subset of profile the coach can see for a trainee */
export interface TraineeProfile {
  id: string;
  display_name: string;
  avatar_url: string | null;
}
