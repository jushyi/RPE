-- Phase 18: Group Chat Messages
-- Creates messages table, group_read_receipts table, RLS policies,
-- chat-media storage bucket, and enables Realtime for the messages table.

-- ============================================================================
-- 1. Messages table
-- ============================================================================
CREATE TABLE public.messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id   UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  sender_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content    TEXT,                    -- Text content (null for media-only messages)
  media_url  TEXT,                    -- URL to uploaded media in chat-media bucket
  media_type TEXT CHECK (media_type IN ('image', 'video') OR media_type IS NULL),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  edited_at  TIMESTAMPTZ,            -- Non-null = message was edited
  deleted_at TIMESTAMPTZ,            -- Non-null = soft-deleted
  CONSTRAINT content_or_media CHECK (content IS NOT NULL OR media_url IS NOT NULL)
);

CREATE INDEX idx_messages_group_created ON public.messages (group_id, created_at DESC);
CREATE INDEX idx_messages_sender ON public.messages (sender_id);

-- ============================================================================
-- 2. RLS on messages
-- ============================================================================
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Members can view messages in groups they belong to
-- (showing deleted_at messages is handled client-side to show "deleted" placeholder)
CREATE POLICY "Members can view group messages"
  ON public.messages FOR SELECT
  USING (public.is_group_member(group_id));

-- Members can insert messages as themselves
CREATE POLICY "Members can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id AND public.is_group_member(group_id));

-- Sender can edit their own messages within 15 minutes OR soft-delete without time limit
CREATE POLICY "Sender can edit own messages within 15 min"
  ON public.messages FOR UPDATE
  USING (auth.uid() = sender_id AND deleted_at IS NULL)
  WITH CHECK (
    auth.uid() = sender_id
    AND (
      -- Allow setting deleted_at (soft delete, no time limit)
      deleted_at IS NOT NULL
      OR
      -- Allow editing content within 15 minutes of creation
      (now() - created_at < interval '15 minutes')
    )
  );

-- ============================================================================
-- 3. Enable Realtime for messages table
-- ============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- ============================================================================
-- 4. Group read receipts table
-- ============================================================================
CREATE TABLE public.group_read_receipts (
  group_id             UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_read_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);

-- ============================================================================
-- 5. RLS on group_read_receipts
-- ============================================================================
ALTER TABLE public.group_read_receipts ENABLE ROW LEVEL SECURITY;

-- Members can view read receipts for groups they belong to
CREATE POLICY "Members can view group read receipts"
  ON public.group_read_receipts FOR SELECT
  USING (public.is_group_member(group_id));

-- Users can insert their own read receipt (when first marking as read)
CREATE POLICY "Users can insert own read receipt"
  ON public.group_read_receipts FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.is_group_member(group_id));

-- Users can update their own read receipt position
CREATE POLICY "Users can update own read receipt"
  ON public.group_read_receipts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 6. chat-media storage bucket
-- ============================================================================

-- Create a separate bucket for chat media (images and videos sent in group chat)
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-media', 'chat-media', true);

-- Authenticated users can upload to their own folder (e.g. {user_id}/{message_id}.jpg)
CREATE POLICY "Users can upload chat media"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'chat-media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Anyone can read chat media (bucket is public)
CREATE POLICY "Anyone can read chat media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'chat-media');

-- Users can delete their own chat media
CREATE POLICY "Users can delete own chat media"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'chat-media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
