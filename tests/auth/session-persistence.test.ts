/**
 * AUTH-02: Session persistence
 *
 * Validates that user sessions persist across app restarts.
 * Concrete tests verify mock infrastructure; todo tests will be filled
 * by Plan 01-02 when session persistence logic is implemented.
 */

describe('AUTH-02: Session persistence', () => {
  it('mock supabase getSession is available', () => {
    const { supabase } = require('../../src/lib/supabase/client');
    expect(supabase.auth.getSession).toBeDefined();
  });

  it('mock supabase onAuthStateChange is available', () => {
    const { supabase } = require('../../src/lib/supabase/client');
    expect(supabase.auth.onAuthStateChange).toBeDefined();
  });

  it.todo('restores session from storage on app mount');
  it.todo('does not call getSession when offline (reads from MMKV instead)');
  it.todo('updates Zustand store when session is restored');
});
