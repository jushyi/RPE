import { renderHook } from '@testing-library/react-native';
import { useBodyMetricsChartData } from '@/features/body-metrics/hooks/useBodyMetricsChartData';
import { useBodyMeasurementStore } from '@/stores/bodyMeasurementStore';
import type { BodyMeasurement } from '@/features/body-metrics/types';

// Mock the store
jest.mock('@/stores/bodyMeasurementStore');

const mockMeasurements: BodyMeasurement[] = [
  {
    id: '1',
    user_id: 'u1',
    chest: 42,
    chest_unit: 'in',
    waist: null,
    waist_unit: null,
    hips: null,
    hips_unit: null,
    body_fat_pct: 15.5,
    measured_at: '2026-01-15',
    created_at: '2026-01-15T10:00:00Z',
  },
  {
    id: '2',
    user_id: 'u1',
    chest: 107,
    chest_unit: 'cm',
    waist: 80,
    waist_unit: 'cm',
    hips: null,
    hips_unit: null,
    body_fat_pct: 14.0,
    measured_at: '2026-02-15',
    created_at: '2026-02-15T10:00:00Z',
  },
  {
    id: '3',
    user_id: 'u1',
    chest: null,
    chest_unit: null,
    waist: 32,
    waist_unit: 'in',
    hips: 38,
    hips_unit: 'in',
    body_fat_pct: null,
    measured_at: '2026-03-01',
    created_at: '2026-03-01T10:00:00Z',
  },
];

describe('useBodyMetricsChartData', () => {
  beforeEach(() => {
    (useBodyMeasurementStore as unknown as jest.Mock).mockReturnValue(mockMeasurements);
  });

  it('filters out null values for chest metric', () => {
    const { result } = renderHook(() => useBodyMetricsChartData('chest', 'in'));
    // Only entries 1 and 2 have chest values
    expect(result.current).toHaveLength(2);
  });

  it('converts mixed-unit chest values to inches', () => {
    const { result } = renderHook(() => useBodyMetricsChartData('chest', 'in'));
    // Entry 1: 42 in -> 42, Entry 2: 107 cm -> ~42.1 in
    expect(result.current[0].value).toBe(42);
    expect(result.current[1].value).toBe(42.1);
  });

  it('converts mixed-unit chest values to cm', () => {
    const { result } = renderHook(() => useBodyMetricsChartData('chest', 'cm'));
    // Entry 1: 42 in -> 106.7 cm, Entry 2: 107 cm -> 107
    expect(result.current[0].value).toBe(106.7);
    expect(result.current[1].value).toBe(107);
  });

  it('returns sorted-by-date array', () => {
    const { result } = renderHook(() => useBodyMetricsChartData('chest', 'in'));
    expect(result.current[0].date).toBeLessThan(result.current[1].date);
  });

  it('returns { date: number, value: number } shape', () => {
    const { result } = renderHook(() => useBodyMetricsChartData('chest', 'in'));
    expect(result.current[0]).toHaveProperty('date');
    expect(result.current[0]).toHaveProperty('value');
    expect(typeof result.current[0].date).toBe('number');
    expect(typeof result.current[0].value).toBe('number');
  });

  it('returns empty array for empty measurements', () => {
    (useBodyMeasurementStore as unknown as jest.Mock).mockReturnValue([]);
    const { result } = renderHook(() => useBodyMetricsChartData('chest', 'in'));
    expect(result.current).toEqual([]);
  });

  it('ignores displayUnit for body_fat_pct', () => {
    const { result } = renderHook(() => useBodyMetricsChartData('body_fat_pct', 'cm'));
    // Entries 1 and 2 have body_fat_pct
    expect(result.current).toHaveLength(2);
    expect(result.current[0].value).toBe(15.5);
    expect(result.current[1].value).toBe(14.0);
  });

  it('filters for waist metric correctly', () => {
    const { result } = renderHook(() => useBodyMetricsChartData('waist', 'in'));
    // Entries 2 and 3 have waist
    expect(result.current).toHaveLength(2);
  });
});
