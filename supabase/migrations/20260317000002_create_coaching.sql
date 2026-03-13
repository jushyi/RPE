-- Phase 13: Coaching System
-- Creates all coaching infrastructure: push tokens, invite codes, coaching relationships,
-- coach notes, helper function, and extends workout_plans with coach_id.

-- ============================================================================
-- 1. Push token storage (one token per user)
-- ============================================================================
CREATE TABLE public.push_tokens (
  user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  token      TEXT NOT NULL,
  platform   TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own push token"
  ON public.push_tokens FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 2. Invite codes for coach-trainee connection
-- ============================================================================
CREATE TABLE public.invite_codes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code        TEXT NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  redeemed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;

-- Coach can create and view own codes
CREATE POLICY "Coach can manage own invite codes"
  ON public.invite_codes FOR ALL
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id);

-- Anyone can view unexpired unredeemed codes for redemption
CREATE POLICY "Anyone can view unexpired codes for redemption"
  ON public.invite_codes FOR SELECT
  USING (redeemed_by IS NULL AND expires_at > now());

-- Anyone can redeem a code (set redeemed_by to their own uid)
CREATE POLICY "Anyone can redeem a code"
  ON public.invite_codes FOR UPDATE
  USING (redeemed_by IS NULL AND expires_at > now())
  WITH CHECK (auth.uid() = redeemed_by);

-- ============================================================================
-- 3. Coaching relationships
-- ============================================================================
CREATE TABLE public.coaching_relationships (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trainee_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(coach_id, trainee_id),
  CHECK(coach_id != trainee_id)
);

ALTER TABLE public.coaching_relationships ENABLE ROW LEVEL SECURITY;

-- Both parties can see the relationship
CREATE POLICY "Participants can view relationships"
  ON public.coaching_relationships FOR SELECT
  USING (auth.uid() = coach_id OR auth.uid() = trainee_id);

-- Trainee creates relationship by redeeming invite code
CREATE POLICY "Users can insert relationships"
  ON public.coaching_relationships FOR INSERT
  WITH CHECK (auth.uid() = trainee_id);

-- Either side can disconnect
CREATE POLICY "Either party can delete relationship"
  ON public.coaching_relationships FOR DELETE
  USING (auth.uid() = coach_id OR auth.uid() = trainee_id);

-- ============================================================================
-- 4. Coach notes on plan updates
-- ============================================================================
CREATE TABLE public.coach_notes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id     UUID NOT NULL REFERENCES public.workout_plans(id) ON DELETE CASCADE,
  coach_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.coach_notes ENABLE ROW LEVEL SECURITY;

-- Coach can create and view own notes
CREATE POLICY "Coach can manage own notes"
  ON public.coach_notes FOR ALL
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id);

-- Trainee can view notes on their own plans
CREATE POLICY "Trainee can view notes on own plans"
  ON public.coach_notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_plans wp
      WHERE wp.id = coach_notes.plan_id
      AND wp.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 5. Helper function: is_coach_of()
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_coach_of(target_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.coaching_relationships
    WHERE coach_id = auth.uid() AND trainee_id = target_user_id
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================================
-- 6. Extend workout_plans with coach_id
-- ============================================================================
ALTER TABLE public.workout_plans
  ADD COLUMN coach_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Coach RLS policies on workout_plans
CREATE POLICY "Coaches can view plans they created"
  ON public.workout_plans FOR SELECT
  USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can insert plans for trainees"
  ON public.workout_plans FOR INSERT
  WITH CHECK (
    coach_id = auth.uid()
    AND public.is_coach_of(user_id)
  );

CREATE POLICY "Coaches can update plans they created"
  ON public.workout_plans FOR UPDATE
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Coaches can delete plans they created"
  ON public.workout_plans FOR DELETE
  USING (auth.uid() = coach_id);

-- ============================================================================
-- 7. Coach read access to workout data
-- ============================================================================

-- Coach can view trainee workout sessions
CREATE POLICY "Coaches can view trainee sessions"
  ON public.workout_sessions FOR SELECT
  USING (public.is_coach_of(user_id));

-- Coach can view trainee session exercises
CREATE POLICY "Coaches can view trainee session exercises"
  ON public.session_exercises FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_sessions ws
      WHERE ws.id = session_exercises.session_id
      AND public.is_coach_of(ws.user_id)
    )
  );

-- Coach can view trainee set logs
CREATE POLICY "Coaches can view trainee set logs"
  ON public.set_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.session_exercises se
      JOIN public.workout_sessions ws ON ws.id = se.session_id
      WHERE se.id = set_logs.session_exercise_id
      AND public.is_coach_of(ws.user_id)
    )
  );

-- Coach can view trainee profile
CREATE POLICY "Coaches can view trainee profile"
  ON public.profiles FOR SELECT
  USING (public.is_coach_of(id));

-- ============================================================================
-- 8. Coach access to plan sub-tables (plan_days, plan_day_exercises)
-- ============================================================================

-- Coach can manage plan_days for plans they created
CREATE POLICY "Coaches can view plan days"
  ON public.plan_days FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_plans wp
      WHERE wp.id = plan_days.plan_id
      AND wp.coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can insert plan days"
  ON public.plan_days FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workout_plans wp
      WHERE wp.id = plan_days.plan_id
      AND wp.coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can update plan days"
  ON public.plan_days FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_plans wp
      WHERE wp.id = plan_days.plan_id
      AND wp.coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can delete plan days"
  ON public.plan_days FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_plans wp
      WHERE wp.id = plan_days.plan_id
      AND wp.coach_id = auth.uid()
    )
  );

-- Coach can manage plan_day_exercises for plans they created
CREATE POLICY "Coaches can view plan day exercises"
  ON public.plan_day_exercises FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.plan_days pd
      JOIN public.workout_plans wp ON wp.id = pd.plan_id
      WHERE pd.id = plan_day_exercises.plan_day_id
      AND wp.coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can insert plan day exercises"
  ON public.plan_day_exercises FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.plan_days pd
      JOIN public.workout_plans wp ON wp.id = pd.plan_id
      WHERE pd.id = plan_day_exercises.plan_day_id
      AND wp.coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can update plan day exercises"
  ON public.plan_day_exercises FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.plan_days pd
      JOIN public.workout_plans wp ON wp.id = pd.plan_id
      WHERE pd.id = plan_day_exercises.plan_day_id
      AND wp.coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can delete plan day exercises"
  ON public.plan_day_exercises FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.plan_days pd
      JOIN public.workout_plans wp ON wp.id = pd.plan_id
      WHERE pd.id = plan_day_exercises.plan_day_id
      AND wp.coach_id = auth.uid()
    )
  );
