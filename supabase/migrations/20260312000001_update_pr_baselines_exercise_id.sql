-- Add exercise_id FK to pr_baselines for linking PRs to exercises
-- Keeps exercise_name for backward compatibility

ALTER TABLE public.pr_baselines
  ADD COLUMN exercise_id UUID REFERENCES public.exercises(id) ON DELETE SET NULL;

-- Backfill Big 3 exercises with exercise_id
UPDATE public.pr_baselines
  SET exercise_id = (SELECT id FROM public.exercises WHERE name = 'Bench Press' AND user_id IS NULL LIMIT 1)
  WHERE exercise_name = 'bench_press';

UPDATE public.pr_baselines
  SET exercise_id = (SELECT id FROM public.exercises WHERE name = 'Squat' AND user_id IS NULL LIMIT 1)
  WHERE exercise_name = 'squat';

UPDATE public.pr_baselines
  SET exercise_id = (SELECT id FROM public.exercises WHERE name = 'Deadlift' AND user_id IS NULL LIMIT 1)
  WHERE exercise_name = 'deadlift';

-- Partial unique index: one PR per user per exercise (when exercise_id is set)
CREATE UNIQUE INDEX idx_pr_baselines_user_exercise
  ON public.pr_baselines(user_id, exercise_id)
  WHERE exercise_id IS NOT NULL;
