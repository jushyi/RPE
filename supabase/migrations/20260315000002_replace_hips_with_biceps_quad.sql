-- Replace hips measurement with biceps and quad measurements
-- Breaking migration: existing hips data will be dropped (user decision)

-- Drop hips columns
ALTER TABLE body_measurements DROP COLUMN IF EXISTS hips;
ALTER TABLE body_measurements DROP COLUMN IF EXISTS hips_unit;

-- Add biceps columns
ALTER TABLE body_measurements ADD COLUMN biceps NUMERIC(5,1);
ALTER TABLE body_measurements ADD COLUMN biceps_unit TEXT CHECK (biceps_unit IN ('in','cm'));

-- Add quad columns
ALTER TABLE body_measurements ADD COLUMN quad NUMERIC(5,1);
ALTER TABLE body_measurements ADD COLUMN quad_unit TEXT CHECK (quad_unit IN ('in','cm'));

-- Drop old constraints
ALTER TABLE body_measurements DROP CONSTRAINT IF EXISTS at_least_one_measurement;
ALTER TABLE body_measurements DROP CONSTRAINT IF EXISTS hips_requires_unit;

-- Re-create at_least_one_measurement constraint including biceps and quad
ALTER TABLE body_measurements ADD CONSTRAINT at_least_one_measurement
  CHECK (
    chest IS NOT NULL OR
    waist IS NOT NULL OR
    biceps IS NOT NULL OR
    quad IS NOT NULL OR
    body_fat_pct IS NOT NULL
  );

-- Add unit constraints for biceps and quad
ALTER TABLE body_measurements ADD CONSTRAINT biceps_requires_unit
  CHECK (biceps IS NULL OR biceps_unit IS NOT NULL);

ALTER TABLE body_measurements ADD CONSTRAINT quad_requires_unit
  CHECK (quad IS NULL OR quad_unit IS NOT NULL);
