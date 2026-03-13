/**
 * Social system type definitions.
 * Mirrors the database schema from 20260318000001_create_social.sql.
 */

/** Minimal profile info for friend search results and feed display */
export interface FriendProfile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  handle: string;
}

/** A pending, accepted, or rejected friend request */
export interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

/** An established mutual friendship (canonical: user_a < user_b by UUID) */
export interface Friendship {
  id: string;
  user_a: string;
  user_b: string;
  created_at: string;
}

/** An invite code for friend connections */
export interface FriendInviteCode {
  id: string;
  user_id: string;
  code: string;
  expires_at: string;
  redeemed_by: string | null;
  created_at: string;
}

/** A sharing group that members post content to */
export interface Group {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
}

/** A member of a group */
export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  muted: boolean;
  joined_at: string;
}

// ============================================================================
// Share payload types (content stored in shared_items.payload JSONB column)
// ============================================================================

/** Payload for a shared workout summary */
export interface WorkoutSharePayload {
  exercise_names: string[];
  total_sets: number;
  total_volume: number;
  duration_minutes: number;
}

/** Payload for a shared personal record */
export interface PRSharePayload {
  exercise_name: string;
  weight: number;
  reps: number;
  unit: 'kg' | 'lbs';
}

/** Payload for a shared set video */
export interface VideoSharePayload {
  video_url: string;
  exercise_name: string;
  weight: number;
  reps: number;
  unit: 'kg' | 'lbs';
  set_number: number;
}

/** A shared item in a group feed */
export type SharedItem =
  | {
      id: string;
      group_id: string;
      user_id: string;
      content_type: 'workout';
      payload: WorkoutSharePayload;
      created_at: string;
    }
  | {
      id: string;
      group_id: string;
      user_id: string;
      content_type: 'pr';
      payload: PRSharePayload;
      created_at: string;
    }
  | {
      id: string;
      group_id: string;
      user_id: string;
      content_type: 'video';
      payload: VideoSharePayload;
      created_at: string;
    };

/**
 * A reaction on a shared item.
 * The `emoji` field stores an icon key string (e.g., "fire", "heart"),
 * NOT an emoji character. Per CLAUDE.md: no emojis in UI.
 */
export interface Reaction {
  id: string;
  shared_item_id: string;
  user_id: string;
  emoji: string; // icon key string, e.g. "fire" -> maps to "flame-outline" Ionicons icon
  created_at: string;
}
