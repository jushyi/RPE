-- Fix: Admin exercises RLS policy and trigger cannot access auth.users from authenticated role
--
-- Root cause: The "Admin can insert global exercises" RLS policy used
-- EXISTS(SELECT 1 FROM auth.users ...) which fails because the authenticated
-- role cannot access the auth.users table. The trigger function worked because
-- it was SECURITY DEFINER, but the RLS policy evaluation runs in the session
-- (authenticated) context.
--
-- Fix: Use auth.jwt()->>'email' (JWT claims) instead of querying auth.users.
-- Also add admin UPDATE policy for editing global exercises.

-- 1. Replace trigger function to use JWT claims instead of auth.users
CREATE OR REPLACE FUNCTION public.make_admin_exercises_global()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the inserting user is the admin via JWT email claim
  IF (auth.jwt()->>'email') = 'maserinj@gmail.com' THEN
    -- Make exercise global by setting user_id to NULL
    NEW.user_id := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop and recreate the admin INSERT policy using JWT claims
DROP POLICY IF EXISTS "Admin can insert global exercises" ON public.exercises;

CREATE POLICY "Admin can insert global exercises"
  ON public.exercises FOR INSERT
  WITH CHECK (
    user_id IS NULL
    AND (auth.jwt()->>'email') = 'maserinj@gmail.com'
  );

-- 3. Add admin UPDATE policy for editing global exercises
CREATE POLICY "Admin can update global exercises"
  ON public.exercises FOR UPDATE
  USING (
    user_id IS NULL
    AND (auth.jwt()->>'email') = 'maserinj@gmail.com'
  )
  WITH CHECK (
    user_id IS NULL
    AND (auth.jwt()->>'email') = 'maserinj@gmail.com'
  );

-- 4. Add admin DELETE policy for removing global exercises
CREATE POLICY "Admin can delete global exercises"
  ON public.exercises FOR DELETE
  USING (
    user_id IS NULL
    AND (auth.jwt()->>'email') = 'maserinj@gmail.com'
  );
