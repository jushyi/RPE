/**
 * AUTH-02: Session persistence
 *
 * Validates that user sessions persist across app restarts.
 */

const mockGetSession = jest.fn();
const mockOnAuthStateChange = jest.fn().mockReturnValue({
  data: { subscription: { unsubscribe: jest.fn() } },
});

jest.mock('../../src/lib/supabase/client', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      getSession: (...args: unknown[]) => mockGetSession(...args),
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

import { useSession } from '../../src/features/auth/hooks/useSession';
import { useAuth } from '../../src/features/auth/hooks/useAuth';
import { renderHook, act, waitFor } from '@testing-library/react-native';

describe('AUTH-02: Session persistence', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('mock supabase getSession is available', () => {
    const { supabase } = require('../../src/lib/supabase/client');
    expect(supabase.auth.getSession).toBeDefined();
  });

  it('mock supabase onAuthStateChange is available', () => {
    const { supabase } = require('../../src/lib/supabase/client');
    expect(supabase.auth.onAuthStateChange).toBeDefined();
  });

  it('restores session from storage on app mount', async () => {
    const mockSession = {
      access_token: 'test-token',
      user: { id: 'user-123', email: 'test@example.com' },
    };
    mockGetSession.mockResolvedValueOnce({
      data: { session: mockSession },
      error: null,
    });

    const { result } = renderHook(() => useSession());

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.session).toEqual(mockSession);
  });

  it('updates auth state via onAuthStateChange listener', async () => {
    let authChangeCallback: Function | null = null;
    mockOnAuthStateChange.mockImplementation((cb: Function) => {
      authChangeCallback = cb;
      return { data: { subscription: { unsubscribe: jest.fn() } } };
    });

    const { result } = renderHook(() => useAuth());

    // Simulate a SIGNED_IN event
    await act(async () => {
      if (authChangeCallback) {
        authChangeCallback('SIGNED_IN', {
          user: { id: 'user-123', email: 'test@example.com' },
        });
      }
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual({ id: 'user-123', email: 'test@example.com' });
  });
});
