-- Add nullable video_url column to set_logs for per-set video attachments
ALTER TABLE public.set_logs ADD COLUMN video_url TEXT;

-- Index for gallery queries (find all sets with videos efficiently)
CREATE INDEX idx_set_logs_video_url
  ON public.set_logs(session_exercise_id)
  WHERE video_url IS NOT NULL;
