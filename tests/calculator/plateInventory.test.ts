import { getMissingPlateMessage } from '@/features/calculator/utils/reverseCalc';

describe('getMissingPlateMessage (plate inventory context)', () => {
  it('identifies smallest disabled plate that could fill remainder', () => {
    // remainder is 1.25, 1.25 kg is disabled
    const msg = getMissingPlateMessage(
      1.25,
      [25, 20, 15, 10, 5, 2.5],    // enabled (no 1.25)
      [25, 20, 15, 10, 5, 2.5, 1.25], // all
      'kg'
    );
    expect(msg).toContain('1.25 kg');
    expect(msg).toContain('not in your inventory');
  });

  it('returns generic message when all plates are enabled', () => {
    const msg = getMissingPlateMessage(
      3,
      [25, 20, 15, 10, 5, 2.5, 1.25],
      [25, 20, 15, 10, 5, 2.5, 1.25],
      'kg'
    );
    expect(msg).toContain('3 kg unaccounted');
  });
});
