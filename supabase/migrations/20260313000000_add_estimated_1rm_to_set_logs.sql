-- Add estimated_1rm column to set_logs for chart use in Phase 6
ALTER TABLE public.set_logs
  ADD COLUMN estimated_1rm NUMERIC(6,2);

-- Backfill existing set_logs with Epley calculation
-- Epley formula: weight * (1 + reps / 30), or just weight for 1-rep sets
UPDATE public.set_logs
SET estimated_1rm = CASE
  WHEN reps = 1 THEN weight
  WHEN reps > 0 THEN ROUND(weight * (1 + reps::numeric / 30), 2)
  ELSE NULL
END
WHERE estimated_1rm IS NULL;

-- Index for Phase 6 chart queries (1RM over time per exercise)
CREATE INDEX idx_set_logs_exercise_1rm
  ON public.set_logs(session_exercise_id, estimated_1rm DESC);
