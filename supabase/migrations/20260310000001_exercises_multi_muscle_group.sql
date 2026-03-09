-- Convert muscle_group (TEXT) to muscle_groups (TEXT[]) for multi-muscle-group support

-- Add new array column
ALTER TABLE public.exercises ADD COLUMN muscle_groups TEXT[] NOT NULL DEFAULT '{}';

-- Migrate existing data: wrap single value into array
UPDATE public.exercises SET muscle_groups = ARRAY[muscle_group];

-- Drop old column and index
DROP INDEX IF EXISTS idx_exercises_muscle_group;
ALTER TABLE public.exercises DROP COLUMN muscle_group;

-- Index for array queries (GIN for @> operator)
CREATE INDEX idx_exercises_muscle_groups ON public.exercises USING GIN (muscle_groups);

-- Update seed data with all muscle groups each exercise hits
-- Chest
UPDATE public.exercises SET muscle_groups = '{Chest,Triceps,Delts}' WHERE name = 'Bench Press' AND user_id IS NULL;
UPDATE public.exercises SET muscle_groups = '{Chest,Delts,Triceps}' WHERE name = 'Incline Bench Press' AND user_id IS NULL;
UPDATE public.exercises SET muscle_groups = '{Chest,Triceps}' WHERE name = 'Decline Bench Press' AND user_id IS NULL;
-- Dumbbell Flyes: isolation, stays Chest only
-- Cable Crossover: isolation, stays Chest only

-- Lats
UPDATE public.exercises SET muscle_groups = '{Lats,Biceps,Traps}' WHERE name = 'Barbell Row' AND user_id IS NULL;
UPDATE public.exercises SET muscle_groups = '{Lats,Hamstrings,Glutes,Traps,Core}' WHERE name = 'Deadlift' AND user_id IS NULL;
UPDATE public.exercises SET muscle_groups = '{Lats,Biceps}' WHERE name = 'Lat Pulldown' AND user_id IS NULL;
UPDATE public.exercises SET muscle_groups = '{Lats,Biceps}' WHERE name = 'Seated Cable Row' AND user_id IS NULL;
UPDATE public.exercises SET muscle_groups = '{Lats,Biceps,Core}' WHERE name = 'Pull-Up' AND user_id IS NULL;

-- Delts
UPDATE public.exercises SET muscle_groups = '{Delts,Triceps}' WHERE name = 'Overhead Press' AND user_id IS NULL;
-- Lateral Raise: isolation, stays Delts only
UPDATE public.exercises SET muscle_groups = '{Delts,Traps}' WHERE name = 'Face Pull' AND user_id IS NULL;
UPDATE public.exercises SET muscle_groups = '{Delts,Triceps}' WHERE name = 'Arnold Press' AND user_id IS NULL;
UPDATE public.exercises SET muscle_groups = '{Delts,Traps}' WHERE name = 'Reverse Flyes' AND user_id IS NULL;

-- Biceps
-- Barbell Curl: isolation, stays Biceps only
-- Dumbbell Curl: isolation, stays Biceps only
UPDATE public.exercises SET muscle_groups = '{Biceps,Forearms}' WHERE name = 'Hammer Curl' AND user_id IS NULL;
-- Preacher Curl: isolation, stays Biceps only

-- Triceps
-- Triceps Pushdown: isolation, stays Triceps only
-- Overhead Triceps Extension: isolation, stays Triceps only
-- Skull Crushers: isolation, stays Triceps only
UPDATE public.exercises SET muscle_groups = '{Triceps,Chest}' WHERE name = 'Close-Grip Bench Press' AND user_id IS NULL;

-- Quads
UPDATE public.exercises SET muscle_groups = '{Quads,Glutes,Core}' WHERE name = 'Squat' AND user_id IS NULL;
UPDATE public.exercises SET muscle_groups = '{Quads,Glutes}' WHERE name = 'Leg Press' AND user_id IS NULL;
-- Leg Extension: isolation, stays Quads only
UPDATE public.exercises SET muscle_groups = '{Quads,Glutes}' WHERE name = 'Bulgarian Split Squat' AND user_id IS NULL;

-- Hamstrings
UPDATE public.exercises SET muscle_groups = '{Hamstrings,Glutes}' WHERE name = 'Romanian Deadlift' AND user_id IS NULL;
-- Leg Curl: isolation, stays Hamstrings only

-- Glutes
UPDATE public.exercises SET muscle_groups = '{Glutes,Hamstrings}' WHERE name = 'Hip Thrust' AND user_id IS NULL;
-- Glute Bridge: stays Glutes only

-- Calves
-- Calf Raise: isolation, stays Calves only

-- Core
-- Plank: stays Core only
UPDATE public.exercises SET muscle_groups = '{Core,Lats}' WHERE name = 'Hanging Leg Raise' AND user_id IS NULL;
-- Cable Crunch: stays Core only

-- Traps
-- Barbell Shrug: stays Traps only
-- Dumbbell Shrug: stays Traps only
