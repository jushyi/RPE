-- Migration: Make exercises created by admin (maserinj@gmail.com) automatically global
-- Global exercises have user_id = NULL and are visible to all users via existing RLS policy

-- 1. Trigger function: converts admin exercises to global on insert
CREATE OR REPLACE FUNCTION public.make_admin_exercises_global()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the inserting user is the admin
  IF EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = NEW.user_id
    AND email = 'maserinj@gmail.com'
  ) THEN
    -- Make exercise global by setting user_id to NULL
    NEW.user_id := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the trigger
CREATE TRIGGER trg_admin_exercises_global
  BEFORE INSERT ON public.exercises
  FOR EACH ROW
  EXECUTE FUNCTION public.make_admin_exercises_global();

-- 3. Allow admin to insert global exercises (trigger sets user_id=NULL before RLS WITH CHECK)
CREATE POLICY "Admin can insert global exercises"
  ON public.exercises FOR INSERT
  WITH CHECK (
    user_id IS NULL
    AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND email = 'maserinj@gmail.com'
    )
  );

-- 4. Retroactively make existing admin exercises global
UPDATE public.exercises
SET user_id = NULL
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'maserinj@gmail.com'
);
