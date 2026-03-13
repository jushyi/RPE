/**
 * Chat type definitions for group messaging.
 * Mirrors the database schema from 20260319000001_create_messages.sql.
 */

/** Media type for chat attachments */
export type ChatMediaType = 'image' | 'video';

/** A chat message in a group */
export interface Message {
  id: string;
  group_id: string;
  sender_id: string;
  content: string | null;        // Text content (null for media-only messages)
  media_url: string | null;      // URL to media in chat-media storage bucket
  media_type: ChatMediaType | null;
  created_at: string;
  edited_at: string | null;      // Non-null = message was edited
  deleted_at: string | null;     // Non-null = soft-deleted
  /** Joined from profiles table when fetching messages */
  profiles?: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

/** Read receipt tracking per user per group (last_read_message_id approach) */
export interface GroupReadReceipt {
  group_id: string;
  user_id: string;
  last_read_message_id: string | null;
  updated_at: string;
}

/**
 * Content selection state for the enhanced share flow.
 * Tracks which content types the user has selected when sharing a workout.
 */
export interface ShareableContent {
  workoutSummary: boolean;      // Whether to include the full workout summary
  selectedPRs: string[];        // Exercise IDs for selected PR items
  selectedVideos: string[];     // Set log IDs for selected video items
}
