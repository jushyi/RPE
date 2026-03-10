import type { CircumferenceUnit } from '../types';

const CM_PER_INCH = 2.54;

/** Round to 1 decimal place */
function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/** Convert inches to centimeters, rounded to 1 decimal */
export function inchesToCm(inches: number): number {
  return round1(inches * CM_PER_INCH);
}

/** Convert centimeters to inches, rounded to 1 decimal */
export function cmToInches(cm: number): number {
  return round1(cm / CM_PER_INCH);
}

/**
 * Convert a measurement value between units.
 * Returns the value unchanged if fromUnit === toUnit.
 */
export function convertMeasurement(
  value: number,
  fromUnit: CircumferenceUnit,
  toUnit: CircumferenceUnit,
): number {
  if (fromUnit === toUnit) return value;
  if (fromUnit === 'in' && toUnit === 'cm') return inchesToCm(value);
  return cmToInches(value);
}
