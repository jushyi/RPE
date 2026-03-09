-- Create workout plans schema (3 tables with RLS + active plan trigger)

-- 1. workout_plans: top-level plan entity
CREATE TABLE public.workout_plans (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  is_active  BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own plans"
  ON public.workout_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own plans"
  ON public.workout_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own plans"
  ON public.workout_plans FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own plans"
  ON public.workout_plans FOR DELETE
  USING (auth.uid() = user_id);

-- 2. plan_days: individual training days within a plan
CREATE TABLE public.plan_days (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id    UUID NOT NULL REFERENCES public.workout_plans(id) ON DELETE CASCADE,
  day_name   TEXT NOT NULL,
  weekday    SMALLINT,
  sort_order SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.plan_days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own plan days"
  ON public.plan_days FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_plans wp
      WHERE wp.id = plan_days.plan_id AND wp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own plan days"
  ON public.plan_days FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workout_plans wp
      WHERE wp.id = plan_days.plan_id AND wp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own plan days"
  ON public.plan_days FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_plans wp
      WHERE wp.id = plan_days.plan_id AND wp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own plan days"
  ON public.plan_days FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_plans wp
      WHERE wp.id = plan_days.plan_id AND wp.user_id = auth.uid()
    )
  );

-- 3. plan_day_exercises: exercises assigned to a plan day with targets
CREATE TABLE public.plan_day_exercises (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_day_id        UUID NOT NULL REFERENCES public.plan_days(id) ON DELETE CASCADE,
  exercise_id        UUID NOT NULL REFERENCES public.exercises(id) ON DELETE RESTRICT,
  sort_order         SMALLINT NOT NULL DEFAULT 0,
  target_sets        JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes              TEXT,
  unit_override      TEXT,
  weight_progression TEXT NOT NULL DEFAULT 'manual'
    CHECK (weight_progression IN ('manual', 'carry_previous')),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.plan_day_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own plan day exercises"
  ON public.plan_day_exercises FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.plan_days pd
      JOIN public.workout_plans wp ON wp.id = pd.plan_id
      WHERE pd.id = plan_day_exercises.plan_day_id AND wp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own plan day exercises"
  ON public.plan_day_exercises FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.plan_days pd
      JOIN public.workout_plans wp ON wp.id = pd.plan_id
      WHERE pd.id = plan_day_exercises.plan_day_id AND wp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own plan day exercises"
  ON public.plan_day_exercises FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.plan_days pd
      JOIN public.workout_plans wp ON wp.id = pd.plan_id
      WHERE pd.id = plan_day_exercises.plan_day_id AND wp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own plan day exercises"
  ON public.plan_day_exercises FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.plan_days pd
      JOIN public.workout_plans wp ON wp.id = pd.plan_id
      WHERE pd.id = plan_day_exercises.plan_day_id AND wp.user_id = auth.uid()
    )
  );

-- Trigger: deactivate other plans when one is set active
CREATE OR REPLACE FUNCTION public.deactivate_other_plans()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = true THEN
    UPDATE public.workout_plans
    SET is_active = false
    WHERE user_id = NEW.user_id AND id != NEW.id AND is_active = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_deactivate_other_plans
  BEFORE UPDATE ON public.workout_plans
  FOR EACH ROW
  WHEN (NEW.is_active = true)
  EXECUTE FUNCTION public.deactivate_other_plans();

-- Trigger: auto-update updated_at on workout_plans
CREATE OR REPLACE FUNCTION public.update_workout_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_workout_plans_updated_at
  BEFORE UPDATE ON public.workout_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_workout_plans_updated_at();
