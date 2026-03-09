/**
 * AUTH-03: Sign-out
 *
 * Validates that sign-out clears session and redirects to login.
 * Concrete tests verify mock infrastructure; todo tests will be filled
 * by Plan 01-02 when sign-out logic is implemented.
 */

describe('AUTH-03: Sign-out', () => {
  it('mock supabase signOut is available', () => {
    const { supabase } = require('../../src/lib/supabase/client');
    expect(supabase.auth.signOut).toBeDefined();
  });

  it('mock supabase signOut is callable', () => {
    const { supabase } = require('../../src/lib/supabase/client');
    expect(typeof supabase.auth.signOut).toBe('function');
  });

  it.todo('calls supabase.auth.signOut');
  it.todo('clears Zustand auth store');
  it.todo('redirects to login screen after sign-out');
});
