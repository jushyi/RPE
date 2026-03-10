import {
  getTimeRangeStart,
  convertWeight,
  formatChartDate,
  estimateWorkoutDuration,
} from '@/features/progress/utils/chartHelpers';

describe('chartHelpers', () => {
  describe('getTimeRangeStart', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-03-10T12:00:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('returns a date ~30 days ago for 1M', () => {
      const result = getTimeRangeStart('1M');
      expect(result).toBeInstanceOf(Date);
      const diffDays = (Date.now() - result!.getTime()) / (1000 * 60 * 60 * 24);
      expect(diffDays).toBeGreaterThanOrEqual(27);
      expect(diffDays).toBeLessThanOrEqual(32);
    });

    it('returns a date ~90 days ago for 3M', () => {
      const result = getTimeRangeStart('3M');
      expect(result).toBeInstanceOf(Date);
      const diffDays = (Date.now() - result!.getTime()) / (1000 * 60 * 60 * 24);
      expect(diffDays).toBeGreaterThanOrEqual(87);
      expect(diffDays).toBeLessThanOrEqual(93);
    });

    it('returns a date ~180 days ago for 6M', () => {
      const result = getTimeRangeStart('6M');
      expect(result).toBeInstanceOf(Date);
      const diffDays = (Date.now() - result!.getTime()) / (1000 * 60 * 60 * 24);
      expect(diffDays).toBeGreaterThanOrEqual(178);
      expect(diffDays).toBeLessThanOrEqual(185);
    });

    it('returns a date ~365 days ago for 1Y', () => {
      const result = getTimeRangeStart('1Y');
      expect(result).toBeInstanceOf(Date);
      const diffDays = (Date.now() - result!.getTime()) / (1000 * 60 * 60 * 24);
      expect(diffDays).toBeGreaterThanOrEqual(364);
      expect(diffDays).toBeLessThanOrEqual(367);
    });

    it('returns null for all', () => {
      const result = getTimeRangeStart('all');
      expect(result).toBeNull();
    });
  });

  describe('convertWeight', () => {
    it('converts kg to lbs (100kg ~= 220.5 lbs)', () => {
      const result = convertWeight(100, 'kg', 'lbs');
      expect(result).toBeCloseTo(220.5, 0);
    });

    it('converts lbs to kg (220 lbs ~= 99.8 kg)', () => {
      const result = convertWeight(220, 'lbs', 'kg');
      expect(result).toBeCloseTo(99.8, 0);
    });

    it('returns same value when units are identical (kg to kg)', () => {
      expect(convertWeight(100, 'kg', 'kg')).toBe(100);
    });

    it('returns same value when units are identical (lbs to lbs)', () => {
      expect(convertWeight(185.5, 'lbs', 'lbs')).toBe(185.5);
    });
  });

  describe('formatChartDate', () => {
    it('formats a timestamp to M/D format', () => {
      // March 10, 2026
      const timestamp = new Date('2026-03-10T12:00:00Z').getTime();
      expect(formatChartDate(timestamp)).toBe('3/10');
    });

    it('formats January 1 correctly', () => {
      // Use local midnight to avoid timezone offset issues
      const timestamp = new Date(2026, 0, 1, 12, 0, 0).getTime();
      expect(formatChartDate(timestamp)).toBe('1/1');
    });

    it('formats December 31 correctly', () => {
      const timestamp = new Date(2025, 11, 31, 12, 0, 0).getTime();
      expect(formatChartDate(timestamp)).toBe('12/31');
    });
  });

  describe('estimateWorkoutDuration', () => {
    it('estimates duration with 3 min/set + 2 min/exercise', () => {
      // 4 exercises, 12 sets total = 12*3 + 4*2 = 44 min
      expect(estimateWorkoutDuration(4, 12)).toBe(44);
    });

    it('returns 0 for empty workout', () => {
      expect(estimateWorkoutDuration(0, 0)).toBe(0);
    });

    it('handles single exercise single set', () => {
      expect(estimateWorkoutDuration(1, 1)).toBe(5);
    });
  });
});
