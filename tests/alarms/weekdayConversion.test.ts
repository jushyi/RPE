import { planWeekdayToExpo } from '@/features/alarms/utils/weekdayConversion';

describe('planWeekdayToExpo', () => {
  it('converts Monday (0) to expo 2', () => {
    expect(planWeekdayToExpo(0)).toBe(2);
  });

  it('converts Tuesday (1) to expo 3', () => {
    expect(planWeekdayToExpo(1)).toBe(3);
  });

  it('converts Wednesday (2) to expo 4', () => {
    expect(planWeekdayToExpo(2)).toBe(4);
  });

  it('converts Thursday (3) to expo 5', () => {
    expect(planWeekdayToExpo(3)).toBe(5);
  });

  it('converts Friday (4) to expo 6', () => {
    expect(planWeekdayToExpo(4)).toBe(6);
  });

  it('converts Saturday (5) to expo 7', () => {
    expect(planWeekdayToExpo(5)).toBe(7);
  });

  it('converts Sunday (6) to expo 1', () => {
    expect(planWeekdayToExpo(6)).toBe(1);
  });
});
