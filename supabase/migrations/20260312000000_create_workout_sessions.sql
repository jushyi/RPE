-- Create workout session schema (3 tables with RLS)
-- workout_sessions -> session_exercises -> set_logs

-- 1. workout_sessions: active/completed workout sessions
CREATE TABLE public.workout_sessions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id    UUID REFERENCES public.workout_plans(id) ON DELETE SET NULL,
  plan_day_id UUID REFERENCES public.plan_days(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at   TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions"
  ON public.workout_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON public.workout_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON public.workout_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
  ON public.workout_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Index for querying user sessions by completion date
CREATE INDEX idx_workout_sessions_user_ended
  ON public.workout_sessions(user_id, ended_at DESC);

-- 2. session_exercises: exercises within a session
CREATE TABLE public.session_exercises (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE RESTRICT,
  sort_order SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.session_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own session exercises"
  ON public.session_exercises FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_sessions ws
      WHERE ws.id = session_exercises.session_id AND ws.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own session exercises"
  ON public.session_exercises FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workout_sessions ws
      WHERE ws.id = session_exercises.session_id AND ws.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own session exercises"
  ON public.session_exercises FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_sessions ws
      WHERE ws.id = session_exercises.session_id AND ws.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own session exercises"
  ON public.session_exercises FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_sessions ws
      WHERE ws.id = session_exercises.session_id AND ws.user_id = auth.uid()
    )
  );

-- Index for looking up exercises by exercise_id (previous performance queries)
CREATE INDEX idx_session_exercises_exercise_id
  ON public.session_exercises(exercise_id);

-- 3. set_logs: individual sets logged within a session exercise
CREATE TABLE public.set_logs (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_exercise_id UUID NOT NULL REFERENCES public.session_exercises(id) ON DELETE CASCADE,
  set_number         SMALLINT NOT NULL,
  weight             NUMERIC(6,2) NOT NULL,
  reps               SMALLINT NOT NULL,
  unit               TEXT NOT NULL DEFAULT 'lbs' CHECK (unit IN ('kg', 'lbs')),
  is_pr              BOOLEAN NOT NULL DEFAULT false,
  logged_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.set_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own set logs"
  ON public.set_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.session_exercises se
      JOIN public.workout_sessions ws ON ws.id = se.session_id
      WHERE se.id = set_logs.session_exercise_id AND ws.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own set logs"
  ON public.set_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.session_exercises se
      JOIN public.workout_sessions ws ON ws.id = se.session_id
      WHERE se.id = set_logs.session_exercise_id AND ws.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own set logs"
  ON public.set_logs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.session_exercises se
      JOIN public.workout_sessions ws ON ws.id = se.session_id
      WHERE se.id = set_logs.session_exercise_id AND ws.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own set logs"
  ON public.set_logs FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.session_exercises se
      JOIN public.workout_sessions ws ON ws.id = se.session_id
      WHERE se.id = set_logs.session_exercise_id AND ws.user_id = auth.uid()
    )
  );
