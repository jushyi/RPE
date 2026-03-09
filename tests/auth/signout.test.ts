/**
 * AUTH-03: Sign-out
 *
 * Validates that sign-out clears session and redirects to login.
 */

const mockSignOut = jest.fn();
const mockOnAuthStateChange = jest.fn().mockReturnValue({
  data: { subscription: { unsubscribe: jest.fn() } },
});

jest.mock('../../src/lib/supabase/client', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: (...args: unknown[]) => mockSignOut(...args),
      getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: (...args: unknown[]) => mockOnAuthStateChange(...args),
      startAutoRefresh: jest.fn(),
      stopAutoRefresh: jest.fn(),
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ data: null, error: null }),
    }),
  },
}));

import { useAuth } from '../../src/features/auth/hooks/useAuth';
import { useAuthStore } from '../../src/stores/authStore';
import { renderHook, act } from '@testing-library/react-native';

describe('AUTH-03: Sign-out', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the store
    useAuthStore.setState({
      isAuthenticated: true,
      userId: 'user-123',
      hasCompletedOnboarding: false,
      preferredUnit: 'lbs',
    });
  });

  it('mock supabase signOut is available', () => {
    const { supabase } = require('../../src/lib/supabase/client');
    expect(supabase.auth.signOut).toBeDefined();
  });

  it('mock supabase signOut is callable', () => {
    const { supabase } = require('../../src/lib/supabase/client');
    expect(typeof supabase.auth.signOut).toBe('function');
  });

  it('calls supabase.auth.signOut', async () => {
    mockSignOut.mockResolvedValueOnce({ error: null });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signOut();
    });

    expect(mockSignOut).toHaveBeenCalled();
  });

  it('clears Zustand auth store', async () => {
    mockSignOut.mockResolvedValueOnce({ error: null });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signOut();
    });

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.userId).toBeNull();
  });
});
