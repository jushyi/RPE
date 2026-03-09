-- supabase/migrations/20260309000001_create_pr_baselines.sql

CREATE TABLE public.pr_baselines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,  -- 'bench_press', 'squat', 'deadlift'
  weight NUMERIC(6,2) NOT NULL,
  unit TEXT NOT NULL DEFAULT 'lbs' CHECK (unit IN ('kg', 'lbs')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, exercise_name)
);

ALTER TABLE public.pr_baselines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own PR baselines"
  ON public.pr_baselines FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own PR baselines"
  ON public.pr_baselines FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own PR baselines"
  ON public.pr_baselines FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index for RLS performance
CREATE INDEX idx_pr_baselines_user_id ON public.pr_baselines(user_id);
