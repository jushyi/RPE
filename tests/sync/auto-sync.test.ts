/**
 * AUTH-04: Auto-sync
 *
 * Validates that data syncs to Supabase when online and queues when offline.
 * Concrete tests verify mock infrastructure; todo tests will be filled
 * by Plan 01-03 when sync logic is implemented.
 */

describe('AUTH-04: Auto-sync', () => {
  it('mock NetInfo returns connected state', () => {
    const NetInfo = require('@react-native-community/netinfo');
    const state = NetInfo.useNetInfo();
    expect(state.isConnected).toBe(true);
  });

  it('mock NetInfo fetch resolves with connected state', async () => {
    const NetInfo = require('@react-native-community/netinfo');
    const state = await NetInfo.fetch();
    expect(state.isConnected).toBe(true);
  });

  it.todo('queues writes to MMKV when offline');
  it.todo('flushes MMKV queue to Supabase when connectivity restored');
  it.todo('does not block UI while syncing');
});
