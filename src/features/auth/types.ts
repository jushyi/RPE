import type { User, Session } from '@supabase/supabase-js';

export interface SignUpParams {
  email: string;
  password: string;
  displayName: string;
  photoUri?: string;
}

export interface SignInParams {
  email: string;
  password: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
}

export interface SessionState {
  isLoading: boolean;
  session: Session | null;
}
