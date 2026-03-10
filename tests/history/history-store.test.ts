import { useHistoryStore } from '@/stores/historyStore';
import type { HistorySession } from '@/features/history/types';

const makeMockSession = (overrides: Partial<HistorySession> = {}): HistorySession => ({
  id: 'session-1',
  user_id: 'user-1',
  plan_id: null,
  plan_day_id: null,
  started_at: '2026-03-09T10:00:00Z',
  ended_at: '2026-03-09T11:00:00Z',
  created_at: '2026-03-09T10:00:00Z',
  session_exercises: [],
  ...overrides,
});

describe('historyStore', () => {
  beforeEach(() => {
    // Reset store state between tests
    useHistoryStore.setState({
      sessions: [],
      isLoading: false,
      lastFetched: null,
    });
  });

  it('setSessions sets sessions array and lastFetched timestamp', () => {
    const sessions = [makeMockSession()];
    const beforeSet = Date.now();

    useHistoryStore.getState().setSessions(sessions);

    const state = useHistoryStore.getState();
    expect(state.sessions).toEqual(sessions);
    expect(state.lastFetched).toBeGreaterThanOrEqual(beforeSet);
    expect(state.lastFetched).toBeLessThanOrEqual(Date.now());
  });

  it('removeSession filters out session by id', () => {
    const sessions = [
      makeMockSession({ id: 'session-1' }),
      makeMockSession({ id: 'session-2' }),
    ];
    useHistoryStore.getState().setSessions(sessions);

    useHistoryStore.getState().removeSession('session-1');

    const state = useHistoryStore.getState();
    expect(state.sessions).toHaveLength(1);
    expect(state.sessions[0].id).toBe('session-2');
  });

  it('removeSession does nothing when id not found', () => {
    const sessions = [makeMockSession({ id: 'session-1' })];
    useHistoryStore.getState().setSessions(sessions);

    useHistoryStore.getState().removeSession('nonexistent');

    expect(useHistoryStore.getState().sessions).toHaveLength(1);
  });

  it('setLoading toggles isLoading flag', () => {
    expect(useHistoryStore.getState().isLoading).toBe(false);

    useHistoryStore.getState().setLoading(true);
    expect(useHistoryStore.getState().isLoading).toBe(true);

    useHistoryStore.getState().setLoading(false);
    expect(useHistoryStore.getState().isLoading).toBe(false);
  });

  it('persists to MMKV with key history-storage', () => {
    // Store name is set in the persist config
    // Verify the store has persist middleware by checking rehydration
    expect(useHistoryStore.persist).toBeDefined();
    expect(useHistoryStore.persist.getOptions().name).toBe('history-storage');
  });
});
