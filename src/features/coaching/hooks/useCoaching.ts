import { useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useCoachingStore } from '@/stores/coachingStore';
import { generateInviteCode, INVITE_CODE_EXPIRY_HOURS } from '@/features/coaching/utils/inviteCode';
import type { CoachingRelationship, InviteCode, TraineeProfile } from '@/features/coaching/types';

export function useCoaching() {
  const userId = useAuthStore((s) => s.userId);
  const {
    relationships,
    trainees,
    coaches,
    isLoading,
    setRelationships,
    addRelationship,
    removeRelationship,
    setTrainees,
    setCoaches,
    setLoading,
  } = useCoachingStore();

  /** True when the user has at least one coaching relationship (coach or trainee) */
  const hasAnyRelationship = useMemo(
    () => trainees.length > 0 || coaches.length > 0,
    [trainees, coaches]
  );

  /**
   * Fetch all coaching relationships for the current user.
   * Separates into trainees (user is coach) and coaches (user is trainee).
   */
  const fetchRelationships = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data: rels, error } = await (supabase.from as any)('coaching_relationships')
        .select('*')
        .or(`coach_id.eq.${userId},trainee_id.eq.${userId}`);

      if (error) throw error;

      const allRels = (rels ?? []) as CoachingRelationship[];
      setRelationships(allRels);

      // Collect profile IDs to fetch
      const traineeIds = allRels
        .filter((r) => r.coach_id === userId)
        .map((r) => r.trainee_id);
      const coachIds = allRels
        .filter((r) => r.trainee_id === userId)
        .map((r) => r.coach_id);

      // Fetch trainee profiles
      if (traineeIds.length > 0) {
        const { data: traineeProfiles } = await (supabase.from as any)('profiles')
          .select('id, display_name, avatar_url')
          .in('id', traineeIds);
        setTrainees((traineeProfiles ?? []) as TraineeProfile[]);
      } else {
        setTrainees([]);
      }

      // Fetch coach profiles
      if (coachIds.length > 0) {
        const { data: coachProfiles } = await (supabase.from as any)('profiles')
          .select('id, display_name, avatar_url')
          .in('id', coachIds);
        setCoaches((coachProfiles ?? []) as TraineeProfile[]);
      } else {
        setCoaches([]);
      }
    } catch (err) {
      console.warn('Failed to fetch coaching relationships:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, setRelationships, setTrainees, setCoaches, setLoading]);

  /**
   * Generate a new invite code for the current user (as coach).
   * Returns the 6-char code string.
   * Retries once on unique constraint collision.
   */
  const generateCode = useCallback(async (): Promise<string> => {
    if (!userId) throw new Error('Not authenticated');

    const tryInsert = async (code: string) => {
      const expiresAt = new Date(
        Date.now() + INVITE_CODE_EXPIRY_HOURS * 60 * 60 * 1000
      ).toISOString();

      const { data, error } = await (supabase.from as any)('invite_codes')
        .insert({
          coach_id: userId,
          code,
          expires_at: expiresAt,
        })
        .select()
        .single();

      return { data, error };
    };

    let code = generateInviteCode();
    let result = await tryInsert(code);

    // Retry once on collision
    if (result.error?.code === '23505') {
      code = generateInviteCode();
      result = await tryInsert(code);
    }

    if (result.error) throw result.error;
    return code;
  }, [userId]);

  /**
   * Redeem an invite code to connect as a trainee.
   * Returns the new coaching relationship.
   */
  const redeemCode = useCallback(
    async (code: string): Promise<CoachingRelationship> => {
      if (!userId) throw new Error('Not authenticated');

      // Find valid invite code
      const { data: invite, error: findError } = await (supabase.from as any)('invite_codes')
        .select('*')
        .eq('code', code.toUpperCase())
        .is('redeemed_by', null)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (findError || !invite) {
        throw new Error('Invalid, expired, or already-redeemed code');
      }

      const inviteData = invite as InviteCode;

      // Cannot redeem own code
      if (inviteData.coach_id === userId) {
        throw new Error('Cannot redeem your own invite code');
      }

      // Mark code as redeemed
      await (supabase.from as any)('invite_codes')
        .update({ redeemed_by: userId })
        .eq('id', inviteData.id);

      // Create coaching relationship
      const { data: rel, error: relError } = await (supabase.from as any)('coaching_relationships')
        .insert({
          coach_id: inviteData.coach_id,
          trainee_id: userId,
        })
        .select()
        .single();

      if (relError) throw relError;

      const newRel = rel as CoachingRelationship;
      addRelationship(newRel);

      // Re-fetch to update profiles
      await fetchRelationships();

      return newRel;
    },
    [userId, addRelationship, fetchRelationships]
  );

  /**
   * Disconnect a coaching relationship by ID.
   */
  const disconnect = useCallback(
    async (relationshipId: string) => {
      const { error } = await (supabase.from as any)('coaching_relationships')
        .delete()
        .eq('id', relationshipId);

      if (error) throw error;
      removeRelationship(relationshipId);

      // Re-fetch to update profiles
      await fetchRelationships();
    },
    [removeRelationship, fetchRelationships]
  );

  /**
   * Get the most recent active (unredeemed, unexpired) invite code for the current user.
   */
  const getActiveInviteCode = useCallback(async (): Promise<InviteCode | null> => {
    if (!userId) return null;

    const { data, error } = await (supabase.from as any)('invite_codes')
      .select('*')
      .eq('coach_id', userId)
      .is('redeemed_by', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return null;
    return data as InviteCode;
  }, [userId]);

  return {
    relationships,
    trainees,
    coaches,
    isLoading,
    hasAnyRelationship,
    fetchRelationships,
    generateCode,
    redeemCode,
    disconnect,
    getActiveInviteCode,
  };
}
