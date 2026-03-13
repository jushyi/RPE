import { calculatePlates } from '@/features/calculator/utils/plateCalculator';
import { LB_PLATES, KG_PLATES } from '@/features/calculator/constants/plates';

describe('calculatePlates', () => {
  describe('standard lb weights', () => {
    it('returns correct plates for 225 lb with 45 lb bar', () => {
      const result = calculatePlates(225, 45, LB_PLATES);
      // per side = 90: 1x55 + 1x35
      expect(result.plates).toEqual([
        { weight: 55, count: 1 },
        { weight: 35, count: 1 },
      ]);
      expect(result.remainder).toBe(0);
    });

    it('returns correct plates for 135 lb with 45 lb bar', () => {
      const result = calculatePlates(135, 45, LB_PLATES);
      // per side = 45: 0x55, 1x45
      expect(result.plates).toEqual([{ weight: 45, count: 1 }]);
      expect(result.remainder).toBe(0);
    });

    it('returns correct plates for 315 lb with 45 lb bar', () => {
      const result = calculatePlates(315, 45, LB_PLATES);
      // per side = 135: 2x55 + 1x25
      expect(result.plates).toEqual([
        { weight: 55, count: 2 },
        { weight: 25, count: 1 },
      ]);
      expect(result.remainder).toBe(0);
    });

    it('returns correct plates for 185 lb with 45 lb bar (no floating point issues)', () => {
      const result = calculatePlates(185, 45, LB_PLATES);
      // per side = 70: 1x55 + 1x10 + 1x5
      expect(result.plates).toEqual([
        { weight: 55, count: 1 },
        { weight: 10, count: 1 },
        { weight: 5, count: 1 },
      ]);
      expect(result.remainder).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('returns empty plates when weight is below bar weight', () => {
      const result = calculatePlates(30, 45, LB_PLATES);
      expect(result.plates).toEqual([]);
      expect(result.remainder).toBe(0);
    });

    it('returns empty plates when weight equals bar weight', () => {
      const result = calculatePlates(45, 45, LB_PLATES);
      expect(result.plates).toEqual([]);
      expect(result.remainder).toBe(0);
    });

    it('returns remainder for non-loadable weight (52.5 lb with 45 lb bar)', () => {
      const result = calculatePlates(52.5, 45, LB_PLATES);
      // perSide = 3.75, closest plate is 2.5, remainder = 1.25
      expect(result.plates).toEqual([{ weight: 2.5, count: 1 }]);
      expect(result.remainder).toBe(1.25);
    });
  });

  describe('filtered plate inventory', () => {
    it('uses only enabled plates (no 55 or 35)', () => {
      // 225 lb with bar 45: per side = 90 = 2x45
      const filtered = [45, 25, 10, 5, 2.5];
      const result = calculatePlates(225, 45, filtered);
      expect(result.plates).toEqual([{ weight: 45, count: 2 }]);
      expect(result.remainder).toBe(0);
    });

    it('handles limited plates with remainder', () => {
      // 300 lb with bar 45: per side = 127.5
      // With only [45, 10, 5]: 2x45=90, 3x10=30, 1x5=5 => 125, remainder 2.5
      const limited = [45, 10, 5];
      const result = calculatePlates(300, 45, limited);
      expect(result.plates).toEqual([
        { weight: 45, count: 2 },
        { weight: 10, count: 3 },
        { weight: 5, count: 1 },
      ]);
      expect(result.remainder).toBe(2.5);
    });
  });

  describe('kg weights', () => {
    it('returns correct plates for 100 kg with 20 kg bar', () => {
      const result = calculatePlates(100, 20, KG_PLATES);
      expect(result.plates).toEqual([
        { weight: 25, count: 1 },
        { weight: 15, count: 1 },
      ]);
      expect(result.remainder).toBe(0);
    });
  });
});
