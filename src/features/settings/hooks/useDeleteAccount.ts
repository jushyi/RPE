import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';

export function useDeleteAccount() {
  const [isDeleting, setIsDeleting] = useState(false);
  const { deletionScheduledAt, setDeletionScheduledAt, clearAuth } = useAuthStore();

  // Sync deletion status from server on mount
  useEffect(() => {
    async function syncDeletionStatus() {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;
        if (!userId) return;

        const { data } = await supabase
          .from('profiles')
          .select('deletion_scheduled_at')
          .eq('id', userId)
          .single() as { data: { deletion_scheduled_at: string | null } | null };

        if (data?.deletion_scheduled_at) {
          setDeletionScheduledAt(data.deletion_scheduled_at);
        } else {
          setDeletionScheduledAt(null);
        }
      } catch {
        // Silently fail — non-critical sync
      }
    }

    syncDeletionStatus();
  }, [setDeletionScheduledAt]);

  const scheduleDelete = useCallback(async (password: string) => {
    setIsDeleting(true);
    try {
      // Verify password via re-authentication
      const { data: userData } = await supabase.auth.getUser();
      const email = userData?.user?.email;
      if (!email) throw new Error('No email found for current user');

      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) throw new Error('Incorrect password');

      // Schedule deletion via Edge Function
      const { data, error } = await supabase.functions.invoke('delete-account', {
        body: { action: 'schedule' },
      });

      if (error) throw new Error('Failed to schedule account deletion');

      const responseData = typeof data === 'string' ? JSON.parse(data) : data;
      if (responseData?.deletion_date) {
        setDeletionScheduledAt(responseData.deletion_date);
      }

      // Sign out after scheduling
      await supabase.auth.signOut();
      clearAuth();
    } finally {
      setIsDeleting(false);
    }
  }, [setDeletionScheduledAt, clearAuth]);

  const cancelDelete = useCallback(async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase.functions.invoke('delete-account', {
        body: { action: 'cancel' },
      });

      if (error) throw new Error('Failed to cancel deletion');

      setDeletionScheduledAt(null);
    } finally {
      setIsDeleting(false);
    }
  }, [setDeletionScheduledAt]);

  return {
    scheduleDelete,
    cancelDelete,
    deletionScheduledAt,
    isDeleting,
  };
}
