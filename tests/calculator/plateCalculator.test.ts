import { calculatePlates } from '@/features/calculator/utils/plateCalculator';
import { LB_PLATES, KG_PLATES } from '@/features/calculator/constants/plates';

describe('calculatePlates', () => {
  describe('standard lb weights', () => {
    it('returns correct plates for 225 lb with 45 lb bar', () => {
      const result = calculatePlates(225, 45, LB_PLATES);
      expect(result.plates).toEqual([{ weight: 45, count: 2 }]);
      expect(result.remainder).toBe(0);
    });

    it('returns correct plates for 135 lb with 45 lb bar', () => {
      const result = calculatePlates(135, 45, LB_PLATES);
      expect(result.plates).toEqual([{ weight: 45, count: 1 }]);
      expect(result.remainder).toBe(0);
    });

    it('returns correct plates for 315 lb with 45 lb bar', () => {
      const result = calculatePlates(315, 45, LB_PLATES);
      expect(result.plates).toEqual([{ weight: 45, count: 3 }]);
      expect(result.remainder).toBe(0);
    });

    it('returns correct plates for 185 lb with 45 lb bar (no floating point issues)', () => {
      const result = calculatePlates(185, 45, LB_PLATES);
      expect(result.plates).toEqual([
        { weight: 45, count: 1 },
        { weight: 25, count: 1 },
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
