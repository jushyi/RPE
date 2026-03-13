import {
  calculateTotalWeight,
  countsToBreakdown,
  getMissingPlateMessage,
} from '@/features/calculator/utils/reverseCalc';

describe('calculateTotalWeight', () => {
  it('calculates total from plate counts and bar weight', () => {
    // bar + 2 * (2*45 + 1*25) = 45 + 2*(90+25) = 45 + 230 = 275? No:
    // per-side: 2x45 + 1x25 = 90+25=115, both sides = 230, +bar 45 = 275?
    // Wait, plan says { 45: 2, 25: 1 } with bar 45 => 225
    // 45 + 2*(2*45 + 1*25) = 45 + 2*(90+25) = 45+230 = 275 -- that's wrong
    // Re-read: 45 + 2*2*45 + 2*1*25 = 45 + 180 + 50 = 275... but plan says 225
    // The plan behavior says: calculateTotalWeight({ 45: 2, 25: 1 }, 45) => 225
    // So it must be: bar + 2 * sum(count * weight) = 45 + 2*(2*45 + 1*25) = 45 + 2*115 = 275
    // That doesn't match 225. Let me re-read: "bar + 2*2*45 + 2*1*25"
    // 45 + 180 + 50 = 275... The plan literally says => 225
    // Perhaps { 45: 2, 25: 1 } means 2 pairs of 45 and 1 pair of 25 per-side?
    // No -- PlateCount is per-side count. bar + 2*(2*45 + 1*25) should be 275.
    // But plan says 225. Let me trust the formula: 225 = 45 + 2*(45*2 + 25*1) only if
    // the counts are total (not per-side). 45 + 2*45 + 2*45 + 1*25 + 1*25 = 45+90+90+25+25=275
    // 225 - 45 = 180 / 2 = 90 per side = 2*45 = 90. So { 45: 2 } with bar 45 => 225.
    // The plan's example may have a typo with the 25:1. Let's test what makes sense:
    // Per the plan text literally: "bar + 2*2*45 + 2*1*25" = 45 + 180 + 50 = 275
    // But result says 225. I'll implement to match mathematical correctness and test accordingly.
    // Actually re-reading more carefully: the plan says => 225 (bar + 2*2*45 + 2*1*25)
    // That sum is 275, not 225. This is a plan arithmetic error.
    // I'll use correct math: 45 + 2*(2*45 + 1*25) = 275
    const result = calculateTotalWeight({ 45: 2, 25: 1 }, 45);
    expect(result).toBe(275);
  });

  it('returns just bar weight for empty plate counts', () => {
    expect(calculateTotalWeight({}, 45)).toBe(45);
  });

  it('avoids floating point errors with 2.5 plates', () => {
    // bar 45 + 2*(2*2.5) = 45 + 10 = 55
    const result = calculateTotalWeight({ 2.5: 2 }, 45);
    expect(result).toBe(55);
  });
});

describe('countsToBreakdown', () => {
  it('converts counts to sorted breakdown, filtering zeros', () => {
    const result = countsToBreakdown({ 45: 2, 25: 1, 10: 0 });
    expect(result).toEqual([
      { weight: 45, count: 2 },
      { weight: 25, count: 1 },
    ]);
  });

  it('returns empty array for empty counts', () => {
    expect(countsToBreakdown({})).toEqual([]);
  });
});

describe('getMissingPlateMessage', () => {
  it('names the specific missing plate from inventory', () => {
    const msg = getMissingPlateMessage(
      2.5,
      [55, 45, 25, 10, 5],       // enabled plates (no 2.5)
      [55, 45, 35, 25, 10, 5, 2.5], // all plates
      'lb'
    );
    expect(msg).toContain('2.5 lb');
    expect(msg).toContain('not in your inventory');
  });

  it('returns generic message when no disabled plate would help', () => {
    const msg = getMissingPlateMessage(
      5,
      [55, 45, 25, 10, 5],       // enabled - 5 IS enabled
      [55, 45, 35, 25, 10, 5, 2.5],
      'lb'
    );
    expect(msg).toContain('5 lb unaccounted');
    expect(msg).not.toContain('not in your inventory');
  });
});
