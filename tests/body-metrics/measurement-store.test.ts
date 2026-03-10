import { act } from '@testing-library/react-native';
import { useBodyMeasurementStore } from '@/stores/bodyMeasurementStore';
import type { BodyMeasurement } from '@/features/body-metrics/types';

const makeMeasurement = (overrides: Partial<BodyMeasurement> = {}): BodyMeasurement => ({
  id: 'test-id-1',
  user_id: 'user-1',
  chest: 42,
  chest_unit: 'in',
  waist: null,
  waist_unit: null,
  hips: null,
  hips_unit: null,
  body_fat_pct: null,
  measured_at: '2026-03-01',
  created_at: '2026-03-01T10:00:00Z',
  ...overrides,
});

describe('bodyMeasurementStore', () => {
  beforeEach(() => {
    // Reset store state between tests
    act(() => {
      useBodyMeasurementStore.getState().setMeasurements([]);
    });
  });

  it('starts with empty measurements', () => {
    const state = useBodyMeasurementStore.getState();
    expect(state.measurements).toEqual([]);
  });

  it('setMeasurements replaces the full array', () => {
    const m1 = makeMeasurement({ id: 'a' });
    const m2 = makeMeasurement({ id: 'b' });

    act(() => {
      useBodyMeasurementStore.getState().setMeasurements([m1, m2]);
    });

    expect(useBodyMeasurementStore.getState().measurements).toHaveLength(2);
    expect(useBodyMeasurementStore.getState().measurements[0].id).toBe('a');
  });

  it('addMeasurement prepends to array', () => {
    const m1 = makeMeasurement({ id: 'existing' });
    const m2 = makeMeasurement({ id: 'new' });

    act(() => {
      useBodyMeasurementStore.getState().setMeasurements([m1]);
      useBodyMeasurementStore.getState().addMeasurement(m2);
    });

    const { measurements } = useBodyMeasurementStore.getState();
    expect(measurements).toHaveLength(2);
    expect(measurements[0].id).toBe('new');
  });

  it('removeMeasurement removes by id', () => {
    const m1 = makeMeasurement({ id: 'keep' });
    const m2 = makeMeasurement({ id: 'remove' });

    act(() => {
      useBodyMeasurementStore.getState().setMeasurements([m1, m2]);
      useBodyMeasurementStore.getState().removeMeasurement('remove');
    });

    const { measurements } = useBodyMeasurementStore.getState();
    expect(measurements).toHaveLength(1);
    expect(measurements[0].id).toBe('keep');
  });

  it('updateMeasurement replaces matching entry', () => {
    const m1 = makeMeasurement({ id: 'update-me', chest: 40 });

    act(() => {
      useBodyMeasurementStore.getState().setMeasurements([m1]);
      useBodyMeasurementStore.getState().updateMeasurement('update-me', { chest: 44 });
    });

    const { measurements } = useBodyMeasurementStore.getState();
    expect(measurements[0].chest).toBe(44);
    expect(measurements[0].id).toBe('update-me');
  });

  it('setLoading updates isLoading', () => {
    act(() => {
      useBodyMeasurementStore.getState().setLoading(true);
    });
    expect(useBodyMeasurementStore.getState().isLoading).toBe(true);

    act(() => {
      useBodyMeasurementStore.getState().setLoading(false);
    });
    expect(useBodyMeasurementStore.getState().isLoading).toBe(false);
  });
});
