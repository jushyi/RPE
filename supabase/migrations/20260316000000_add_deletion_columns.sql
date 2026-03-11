-- Add deletion scheduling column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS deletion_scheduled_at timestamptz DEFAULT NULL;

-- Cleanup function: delete auth users whose grace period has expired
CREATE OR REPLACE FUNCTION public.cleanup_expired_deletions()
RETURNS void AS $$
DECLARE expired_user RECORD;
BEGIN
  FOR expired_user IN
    SELECT id FROM public.profiles
    WHERE deletion_scheduled_at IS NOT NULL AND deletion_scheduled_at <= now()
  LOOP
    DELETE FROM auth.users WHERE id = expired_user.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- NOTE: pg_cron scheduling must be done manually in the Supabase SQL editor:
-- SELECT cron.schedule(
--   'cleanup-expired-deletions',
--   '0 3 * * *',
--   'SELECT public.cleanup_expired_deletions()'
-- );
