CREATE TABLE public.bodyweight_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  weight     NUMERIC(5,1) NOT NULL,
  unit       TEXT NOT NULL CHECK (unit IN ('kg', 'lbs')),
  logged_at  DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, logged_at)
);

ALTER TABLE public.bodyweight_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own bodyweight logs"
  ON public.bodyweight_logs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_bodyweight_logs_user_date
  ON public.bodyweight_logs(user_id, logged_at DESC);
