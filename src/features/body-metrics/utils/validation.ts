import type { CircumferenceUnit } from '../types';

interface MeasurementInput {
  chest?: number | null;
  chest_unit?: CircumferenceUnit | null;
  waist?: number | null;
  waist_unit?: CircumferenceUnit | null;
  biceps?: number | null;
  biceps_unit?: CircumferenceUnit | null;
  quad?: number | null;
  quad_unit?: CircumferenceUnit | null;
  body_fat_pct?: number | null;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates a measurement entry:
 * - At least one field must have a non-null value
 * - Circumference fields (chest, waist, biceps, quad) require a unit when value is provided
 */
export function validateMeasurementEntry(input: MeasurementInput): ValidationResult {
  const errors: string[] = [];

  const hasChest = input.chest != null;
  const hasWaist = input.waist != null;
  const hasBiceps = input.biceps != null;
  const hasQuad = input.quad != null;
  const hasBodyFat = input.body_fat_pct != null;

  // At least one measurement required
  if (!hasChest && !hasWaist && !hasBiceps && !hasQuad && !hasBodyFat) {
    errors.push('At least one measurement is required');
    return { valid: false, errors };
  }

  // Circumference fields require unit
  if (hasChest && !input.chest_unit) {
    errors.push('Chest requires a unit (in or cm)');
  }
  if (hasWaist && !input.waist_unit) {
    errors.push('Waist requires a unit (in or cm)');
  }
  if (hasBiceps && !input.biceps_unit) {
    errors.push('Biceps requires a unit (in or cm)');
  }
  if (hasQuad && !input.quad_unit) {
    errors.push('Quad requires a unit (in or cm)');
  }

  return { valid: errors.length === 0, errors };
}
