/**
 * AUTH-01: Sign-up flow
 *
 * Validates that users can sign up with email, password, and display name.
 */

const mockSignUp = jest.fn();
const mockOnAuthStateChange = jest.fn().mockReturnValue({
  data: { subscription: { unsubscribe: jest.fn() } },
});

jest.mock('../../src/lib/supabase/client', () => ({
  supabase: {
    auth: {
      signUp: (...args: unknown[]) => mockSignUp(...args),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: (...args: unknown[]) => mockOnAuthStateChange(...args),
      startAutoRefresh: jest.fn(),
      stopAutoRefresh: jest.fn(),
    },
    storage: {
      from: jest.fn().mockReturnValue({
        upload: jest.fn().mockResolvedValue({ error: null }),
        getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/photo.jpg' } }),
      }),
    },
    from: jest.fn().mockReturnValue({
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ data: null, error: null }),
    }),
  },
}));

// Must import after mock setup
import { useAuth } from '../../src/features/auth/hooks/useAuth';
import { renderHook, act } from '@testing-library/react-native';

describe('AUTH-01: Sign-up flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('mock supabase auth is available', () => {
    const { supabase } = require('../../src/lib/supabase/client');
    expect(supabase.auth.signUp).toBeDefined();
  });

  it('mock supabase auth.signUp is callable', () => {
    const { supabase } = require('../../src/lib/supabase/client');
    expect(typeof supabase.auth.signUp).toBe('function');
  });

  it('calls supabase.auth.signUp with email, password, and display name', async () => {
    mockSignUp.mockResolvedValueOnce({
      data: { user: { id: 'test-user-id' }, session: null },
      error: null,
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signUp({
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test User',
      });
    });

    expect(mockSignUp).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
      options: {
        data: { display_name: 'Test User' },
      },
    });
  });

  it('shows error message on sign-up failure', async () => {
    mockSignUp.mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { message: 'Email already taken' },
    });

    const { result } = renderHook(() => useAuth());

    await expect(
      act(async () => {
        await result.current.signUp({
          email: 'taken@example.com',
          password: 'password123',
          displayName: 'Test User',
        });
      })
    ).rejects.toEqual({ message: 'Email already taken' });
  });
});
