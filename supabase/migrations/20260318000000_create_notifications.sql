-- Notification persistence for in-app notification inbox
-- Records are written by Edge Functions when dispatching push notifications
-- and by the client for local alarm/nudge events.

CREATE TABLE public.notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('workout_complete', 'pr_achieved', 'plan_update', 'weekly_summary', 'alarm', 'nudge')),
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  data        JSONB DEFAULT '{}',
  read        BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Composite index for efficient inbox queries (user's unread notifications, newest first)
CREATE INDEX idx_notifications_user_unread
  ON public.notifications (user_id, read, created_at DESC);

-- Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role inserts (Edge Functions use service_role key)
-- No INSERT policy needed for RLS since Edge Functions bypass RLS
