-- Add track_prs flag to exercises table
-- Allows users to opt-in to PR tracking per exercise

ALTER TABLE public.exercises
  ADD COLUMN track_prs BOOLEAN NOT NULL DEFAULT false;

-- Enable PR tracking for Big 3 by default
UPDATE public.exercises
  SET track_prs = true
  WHERE name IN ('Bench Press', 'Squat', 'Deadlift')
    AND user_id IS NULL;
