/**
 * Utility functions for chat media upload path construction.
 * The actual upload hook (useChatMedia) is implemented in Plan 04.
 */

/**
 * Constructs the storage path for a chat media file.
 * Files are stored under the user's folder: {userId}/{messageId}.{ext}
 *
 * This gives users ownership of their own files for RLS-based deletion.
 *
 * @param userId - The authenticated user's ID
 * @param messageId - The message ID (used as filename)
 * @param ext - File extension (e.g., 'jpg', 'mp4', 'mov', 'png')
 */
export function buildChatMediaPath(userId: string, messageId: string, ext: string): string {
  return `${userId}/${messageId}.${ext}`;
}

/**
 * Constructs the public URL for a chat media file stored in the chat-media bucket.
 * The chat-media bucket is public, so this URL is directly accessible.
 *
 * @param supabaseUrl - The Supabase project URL
 * @param filePath - The file path returned by buildChatMediaPath
 */
export function getChatMediaPublicUrl(supabaseUrl: string, filePath: string): string {
  return `${supabaseUrl}/storage/v1/object/public/chat-media/${filePath}`;
}
