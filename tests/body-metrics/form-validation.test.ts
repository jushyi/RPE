import { validateMeasurementEntry } from '@/features/body-metrics/utils/validation';

describe('validateMeasurementEntry', () => {
  it('valid: entry with chest only', () => {
    expect(
      validateMeasurementEntry({ chest: 42, chest_unit: 'in' })
    ).toEqual({ valid: true, errors: [] });
  });

  it('valid: entry with body_fat_pct only', () => {
    expect(
      validateMeasurementEntry({ body_fat_pct: 15.5 })
    ).toEqual({ valid: true, errors: [] });
  });

  it('valid: entry with multiple fields', () => {
    expect(
      validateMeasurementEntry({
        chest: 42,
        chest_unit: 'in',
        waist: 32,
        waist_unit: 'in',
        body_fat_pct: 15,
      })
    ).toEqual({ valid: true, errors: [] });
  });

  it('invalid: all fields null/empty', () => {
    const result = validateMeasurementEntry({});
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('At least one measurement is required');
  });

  it('invalid: all fields explicitly null', () => {
    const result = validateMeasurementEntry({
      chest: null,
      waist: null,
      biceps: null,
      quad: null,
      body_fat_pct: null,
    });
    expect(result.valid).toBe(false);
  });

  it('invalid: circumference value without unit', () => {
    const result = validateMeasurementEntry({ chest: 42 });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Chest requires a unit (in or cm)');
  });

  it('invalid: waist value without unit', () => {
    const result = validateMeasurementEntry({ waist: 32 });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Waist requires a unit (in or cm)');
  });

  it('invalid: biceps value without unit', () => {
    const result = validateMeasurementEntry({ biceps: 15 });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Biceps requires a unit (in or cm)');
  });

  it('invalid: quad value without unit', () => {
    const result = validateMeasurementEntry({ quad: 24 });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Quad requires a unit (in or cm)');
  });

  it('valid: biceps with unit', () => {
    const result = validateMeasurementEntry({ biceps: 15, biceps_unit: 'in' });
    expect(result.valid).toBe(true);
  });

  it('valid: quad with unit', () => {
    const result = validateMeasurementEntry({ quad: 24, quad_unit: 'cm' });
    expect(result.valid).toBe(true);
  });

  it('valid: body_fat_pct does not require a unit', () => {
    const result = validateMeasurementEntry({ body_fat_pct: 12.5 });
    expect(result.valid).toBe(true);
  });
});
