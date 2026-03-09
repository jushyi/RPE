/**
 * AUTH-06: PR baseline entry
 *
 * Validates that users can enter personal record baselines during onboarding.
 * Concrete tests verify mock infrastructure; todo tests will be filled
 * by Plan 01-03 when PR baseline logic is implemented.
 */

describe('AUTH-06: PR baseline entry', () => {
  it('mock supabase from().upsert() is available', () => {
    const { supabase } = require('../../src/lib/supabase/client');
    const query = supabase.from('pr_baselines');
    expect(query.upsert).toBeDefined();
  });

  it('mock supabase from() returns chainable query builder', () => {
    const { supabase } = require('../../src/lib/supabase/client');
    const query = supabase.from('pr_baselines');
    expect(query.select).toBeDefined();
    expect(query.insert).toBeDefined();
    expect(query.eq).toBeDefined();
  });

  it.todo('saves non-zero PR baselines to Supabase');
  it.todo('skipping navigates to dashboard without saving');
  it.todo('global unit selector defaults all lift fields');
  it.todo('per-lift unit override is independent of global unit');
});
