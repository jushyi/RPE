import type { PlanDay } from '@/features/plans/types';
import { DEFAULT_DAY_NAMES, WEEKDAY_LABELS } from '@/features/plans/constants';

describe('plan-days', () => {
  it('plan day creation sets sort_order from array index', () => {
    const dayNames = ['Chest Day', 'Back Day', 'Leg Day'];
    const days: Pick<PlanDay, 'day_name' | 'sort_order'>[] = dayNames.map((name, index) => ({
      day_name: name,
      sort_order: index,
    }));

    expect(days[0].sort_order).toBe(0);
    expect(days[1].sort_order).toBe(1);
    expect(days[2].sort_order).toBe(2);
  });

  it('plan day weekday mapping is optional (null weekday is valid)', () => {
    const day: Pick<PlanDay, 'day_name' | 'weekday' | 'sort_order'> = {
      day_name: 'Day A',
      weekday: null,
      sort_order: 0,
    };

    expect(day.weekday).toBeNull();

    const dayWithWeekday: Pick<PlanDay, 'day_name' | 'weekday' | 'sort_order'> = {
      day_name: 'Monday Push',
      weekday: 1,
      sort_order: 0,
    };

    expect(dayWithWeekday.weekday).toBe(1);
    expect(WEEKDAY_LABELS[dayWithWeekday.weekday!]).toBe('Mon');
  });

  it('day_name defaults from DEFAULT_DAY_NAMES sequence', () => {
    expect(DEFAULT_DAY_NAMES[0]).toBe('Day A');
    expect(DEFAULT_DAY_NAMES[1]).toBe('Day B');
    expect(DEFAULT_DAY_NAMES[2]).toBe('Day C');
    expect(DEFAULT_DAY_NAMES).toHaveLength(6);
  });

  it('multiple days maintain unique sort_order values', () => {
    const days = Array.from({ length: 5 }, (_, i) => ({
      day_name: DEFAULT_DAY_NAMES[i],
      sort_order: i,
    }));

    const sortOrders = days.map((d) => d.sort_order);
    const unique = new Set(sortOrders);
    expect(unique.size).toBe(sortOrders.length);
  });
});
