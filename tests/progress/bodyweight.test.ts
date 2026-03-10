import { useBodyweightStore } from '@/stores/bodyweightStore';
import type { BodyweightEntry } from '@/features/progress/types';

const mockEntries: BodyweightEntry[] = [
  { id: '1', weight: 185.5, unit: 'lbs', logged_at: '2026-03-10', created_at: '2026-03-10T12:00:00Z' },
  { id: '2', weight: 184.0, unit: 'lbs', logged_at: '2026-03-09', created_at: '2026-03-09T12:00:00Z' },
  { id: '3', weight: 186.0, unit: 'lbs', logged_at: '2026-03-08', created_at: '2026-03-08T12:00:00Z' },
];

describe('bodyweightStore', () => {
  beforeEach(() => {
    // Reset store state between tests
    useBodyweightStore.setState({
      entries: [],
      isLoading: false,
      lastFetched: null,
    });
  });

  it('setEntries sets entries array and lastFetched', () => {
    const store = useBodyweightStore.getState();
    store.setEntries(mockEntries);

    const state = useBodyweightStore.getState();
    expect(state.entries).toHaveLength(3);
    expect(state.entries[0].id).toBe('1');
    expect(state.lastFetched).toBeGreaterThan(0);
  });

  it('addEntry prepends entry to array', () => {
    useBodyweightStore.getState().setEntries(mockEntries);

    const newEntry: BodyweightEntry = {
      id: '4', weight: 183.0, unit: 'lbs',
      logged_at: '2026-03-11', created_at: '2026-03-11T12:00:00Z',
    };
    useBodyweightStore.getState().addEntry(newEntry);

    const state = useBodyweightStore.getState();
    expect(state.entries).toHaveLength(4);
    expect(state.entries[0].id).toBe('4');
  });

  it('removeEntry filters out entry by id', () => {
    useBodyweightStore.getState().setEntries(mockEntries);
    useBodyweightStore.getState().removeEntry('2');

    const state = useBodyweightStore.getState();
    expect(state.entries).toHaveLength(2);
    expect(state.entries.find(e => e.id === '2')).toBeUndefined();
  });

  it('setLoading updates isLoading flag', () => {
    useBodyweightStore.getState().setLoading(true);
    expect(useBodyweightStore.getState().isLoading).toBe(true);

    useBodyweightStore.getState().setLoading(false);
    expect(useBodyweightStore.getState().isLoading).toBe(false);
  });
});
