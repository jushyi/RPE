-- Body Measurements table for tracking chest, waist, hips, and body fat %
-- Phase 07: Body Metrics

CREATE TABLE public.body_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chest NUMERIC(5,1),
  chest_unit TEXT CHECK (chest_unit IN ('in', 'cm')),
  waist NUMERIC(5,1),
  waist_unit TEXT CHECK (waist_unit IN ('in', 'cm')),
  hips NUMERIC(5,1),
  hips_unit TEXT CHECK (hips_unit IN ('in', 'cm')),
  body_fat_pct NUMERIC(4,1),
  measured_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- At least one measurement field must be provided
  CONSTRAINT at_least_one_measurement CHECK (
    chest IS NOT NULL OR waist IS NOT NULL OR hips IS NOT NULL OR body_fat_pct IS NOT NULL
  ),

  -- If a circumference value is provided, its unit must also be provided
  CONSTRAINT chest_requires_unit CHECK (chest IS NULL OR chest_unit IS NOT NULL),
  CONSTRAINT waist_requires_unit CHECK (waist IS NULL OR waist_unit IS NOT NULL),
  CONSTRAINT hips_requires_unit CHECK (hips IS NULL OR hips_unit IS NOT NULL)
);

-- Index for efficient per-user queries sorted by date
CREATE INDEX idx_body_measurements_user_date
  ON public.body_measurements (user_id, measured_at DESC);

-- Enable Row Level Security
ALTER TABLE public.body_measurements ENABLE ROW LEVEL SECURITY;

-- RLS policy: users can only manage their own measurements
CREATE POLICY "Users can manage own body measurements"
  ON public.body_measurements
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
