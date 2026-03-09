/**
 * AUTH-01: Sign-up flow
 *
 * Validates that users can sign up with email, password, and display name.
 * Concrete tests verify mock infrastructure; todo tests will be filled
 * by Plan 01-01 when the actual sign-up logic is implemented.
 */

describe('AUTH-01: Sign-up flow', () => {
  it('mock supabase auth is available', () => {
    const { supabase } = require('../../src/lib/supabase/client');
    expect(supabase.auth.signUp).toBeDefined();
  });

  it('mock supabase auth.signUp is callable', () => {
    const { supabase } = require('../../src/lib/supabase/client');
    expect(typeof supabase.auth.signUp).toBe('function');
  });

  it.todo('calls supabase.auth.signUp with email, password, and display name');
  it.todo('navigates to PR baseline screen after successful sign-up');
  it.todo('shows error message on sign-up failure');
  it.todo('shows offline message when no network connectivity');
});
