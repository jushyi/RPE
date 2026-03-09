-- Exercise library table with seed data
-- Global exercises (user_id IS NULL) are readable by everyone
-- Custom exercises (user_id = auth.uid()) are only accessible by owner

CREATE TABLE public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  muscle_group TEXT NOT NULL,
  equipment TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

-- Two separate SELECT policies: Postgres ORs them automatically
CREATE POLICY "Anyone can read global exercises"
  ON public.exercises FOR SELECT
  USING (user_id IS NULL);

CREATE POLICY "Users can read own exercises"
  ON public.exercises FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert exercises with their own user_id
CREATE POLICY "Users can insert own exercises"
  ON public.exercises FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own exercises
CREATE POLICY "Users can update own exercises"
  ON public.exercises FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own exercises
CREATE POLICY "Users can delete own exercises"
  ON public.exercises FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for common query patterns
CREATE INDEX idx_exercises_user_id ON public.exercises(user_id);
CREATE INDEX idx_exercises_muscle_group ON public.exercises(muscle_group);

-- Seed data: ~35 global exercises (user_id = NULL)
INSERT INTO public.exercises (name, muscle_group, equipment, user_id) VALUES
  -- Chest (5)
  ('Bench Press', 'Chest', 'Barbell', NULL),
  ('Incline Bench Press', 'Chest', 'Barbell', NULL),
  ('Decline Bench Press', 'Chest', 'Barbell', NULL),
  ('Dumbbell Flyes', 'Chest', 'Dumbbell', NULL),
  ('Cable Crossover', 'Chest', 'Cable', NULL),
  -- Lats (5)
  ('Barbell Row', 'Lats', 'Barbell', NULL),
  ('Deadlift', 'Lats', 'Barbell', NULL),
  ('Lat Pulldown', 'Lats', 'Cable', NULL),
  ('Seated Cable Row', 'Lats', 'Cable', NULL),
  ('Pull-Up', 'Lats', 'Bodyweight', NULL),
  -- Delts (5)
  ('Overhead Press', 'Delts', 'Barbell', NULL),
  ('Lateral Raise', 'Delts', 'Dumbbell', NULL),
  ('Face Pull', 'Delts', 'Cable', NULL),
  ('Arnold Press', 'Delts', 'Dumbbell', NULL),
  ('Reverse Flyes', 'Delts', 'Dumbbell', NULL),
  -- Biceps (4)
  ('Barbell Curl', 'Biceps', 'Barbell', NULL),
  ('Dumbbell Curl', 'Biceps', 'Dumbbell', NULL),
  ('Hammer Curl', 'Biceps', 'Dumbbell', NULL),
  ('Preacher Curl', 'Biceps', 'Machine', NULL),
  -- Triceps (4)
  ('Triceps Pushdown', 'Triceps', 'Cable', NULL),
  ('Overhead Triceps Extension', 'Triceps', 'Dumbbell', NULL),
  ('Skull Crushers', 'Triceps', 'Barbell', NULL),
  ('Close-Grip Bench Press', 'Triceps', 'Barbell', NULL),
  -- Quads (4)
  ('Squat', 'Quads', 'Barbell', NULL),
  ('Leg Press', 'Quads', 'Machine', NULL),
  ('Leg Extension', 'Quads', 'Machine', NULL),
  ('Bulgarian Split Squat', 'Quads', 'Dumbbell', NULL),
  -- Hamstrings (2)
  ('Romanian Deadlift', 'Hamstrings', 'Barbell', NULL),
  ('Leg Curl', 'Hamstrings', 'Machine', NULL),
  -- Glutes (2)
  ('Hip Thrust', 'Glutes', 'Barbell', NULL),
  ('Glute Bridge', 'Glutes', 'Bodyweight', NULL),
  -- Calves (1)
  ('Calf Raise', 'Calves', 'Machine', NULL),
  -- Core (3)
  ('Plank', 'Core', 'Bodyweight', NULL),
  ('Hanging Leg Raise', 'Core', 'Bodyweight', NULL),
  ('Cable Crunch', 'Core', 'Cable', NULL),
  -- Traps (2)
  ('Barbell Shrug', 'Traps', 'Barbell', NULL),
  ('Dumbbell Shrug', 'Traps', 'Dumbbell', NULL);
