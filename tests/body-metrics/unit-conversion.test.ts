import { inchesToCm, cmToInches, convertMeasurement } from '@/features/body-metrics/utils/unitConversion';

describe('inchesToCm', () => {
  it('converts 10 inches to 25.4 cm', () => {
    expect(inchesToCm(10)).toBe(25.4);
  });

  it('converts 0 to 0', () => {
    expect(inchesToCm(0)).toBe(0);
  });

  it('converts 1 inch to 2.5 cm (rounded to 1 decimal)', () => {
    expect(inchesToCm(1)).toBe(2.5);
  });

  it('handles large values', () => {
    expect(inchesToCm(100)).toBe(254.0);
  });
});

describe('cmToInches', () => {
  it('converts 25.4 cm to 10.0 inches', () => {
    expect(cmToInches(25.4)).toBe(10.0);
  });

  it('converts 0 to 0', () => {
    expect(cmToInches(0)).toBe(0);
  });

  it('converts 2.54 cm to 1.0 inch', () => {
    expect(cmToInches(2.54)).toBe(1.0);
  });

  it('rounds to 1 decimal place', () => {
    // 10 cm = 3.93700787... inches -> 3.9
    expect(cmToInches(10)).toBe(3.9);
  });
});

describe('convertMeasurement', () => {
  it('converts inches to cm', () => {
    expect(convertMeasurement(42, 'in', 'cm')).toBe(106.7);
  });

  it('returns same value when units match (in to in)', () => {
    expect(convertMeasurement(42, 'in', 'in')).toBe(42);
  });

  it('returns same value when units match (cm to cm)', () => {
    expect(convertMeasurement(80, 'cm', 'cm')).toBe(80);
  });

  it('converts cm to inches', () => {
    expect(convertMeasurement(106.7, 'cm', 'in')).toBe(42.0);
  });
});
