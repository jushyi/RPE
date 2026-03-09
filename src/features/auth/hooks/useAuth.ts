import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import type { SignUpParams, SignInParams } from '../types';
import type { User, AuthChangeEvent, Session } from '@supabase/supabase-js';

async function uploadProfilePhoto(userId: string, uri: string): Promise<void> {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    const filePath = `${userId}/avatar.jpg`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, blob, { contentType: 'image/jpeg', upsert: true });

    if (!uploadError) {
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('profiles') as any)
        .update({ avatar_url: urlData.publicUrl })
        .eq('id', userId);
    }
  } catch (err) {
    console.warn('Profile photo upload failed:', err);
  }
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated, setAuthenticated, clearAuth } = useAuthStore();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        if (session?.user) {
          setUser(session.user);
          setAuthenticated(session.user.id);
        } else {
          setUser(null);
          clearAuth();
        }
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [setAuthenticated, clearAuth]);

  const signUp = useCallback(async ({ email, password, displayName, photoUri }: SignUpParams) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
      },
    });
    if (error) throw error;

    // Upload photo in background (non-blocking)
    if (photoUri && data.user) {
      uploadProfilePhoto(data.user.id, photoUri).catch(console.warn);
    }

    return data;
  }, []);

  const signIn = useCallback(async ({ email, password }: SignInParams) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    clearAuth();
  }, [clearAuth]);

  return {
    signUp,
    signIn,
    signOut,
    isAuthenticated,
    isLoading,
    user,
  };
}
