/**
 * useShareFlow — share flow logic for post-workout sharing.
 *
 * Derives shareable content from a completed WorkoutSession, manages
 * content + group selection state, and dispatches to socialStore + push notifications.
 *
 * CRITICAL: Body metrics are NEVER included in any payload (SOCL-14).
 * Only exercises, sets, PRs, and videos are accessed from WorkoutSession.
 */

import { useState, useMemo } from 'react';
import { useSocialStore } from '@/stores/socialStore';
import {
  buildWorkoutPayload,
  buildPRPayload,
  buildVideoPayload,
} from '@/features/social/utils/sharePayload';
import { notifyGroupOnShare } from '@/features/social/utils/notifyGroup';
import { supabase } from '@/lib/supabase/client';
import type { WorkoutSession } from '@/features/workout/types';
import type { ShareableContent } from '@/features/social/types/chat';

export interface PRItem {
  name: string;
  weight: number;
  unit: string;
}

/** An individual video set available for sharing */
export interface VideoItem {
  exercise_name: string;
  exercise_id: string;
  set_index: number;
  set_number: number;
  weight: number;
  reps: number;
  unit: 'kg' | 'lbs';
  video_url: string;
}

export interface DerivedShareContent {
  workoutSummary: true;
  prItems: PRItem[];
  videoItems: VideoItem[];
}

export interface UseShareFlowResult {
  /** Derived shareable content from the session */
  content: DerivedShareContent;
  /** ShareableContent selection state (workoutSummary flag, selectedPRs, selectedVideos) */
  shareableContent: ShareableContent;
  /** Update shareableContent selection */
  setShareableContent: (value: ShareableContent) => void;
  /** IDs of currently selected groups */
  selectedGroups: Set<string>;
  /** Whether a share request is in progress */
  sharing: boolean;
  /** Whether the share was completed successfully */
  shared: boolean;
  /** Toggle a group's selection */
  toggleGroup: (groupId: string) => void;
  /** Execute the share */
  share: () => Promise<void>;
}

/**
 * Derive all shareable content from a session.
 * Only accesses exercises, sets, PRs, and videos — never body metrics.
 */
function deriveShareableContent(
  session: WorkoutSession,
  prs: PRItem[]
): DerivedShareContent {
  // Collect video items: only sets with a confirmed video_url (Pitfall 6: skip uploading)
  const videoItems: VideoItem[] = [];
  for (const exercise of session.exercises) {
    let setNumber = 0;
    for (let i = 0; i < exercise.logged_sets.length; i++) {
      const set = exercise.logged_sets[i];
      setNumber++;
      if (set.video_url) {
        videoItems.push({
          exercise_name: exercise.exercise_name,
          exercise_id: exercise.exercise_id,
          set_index: i,
          set_number: setNumber,
          weight: set.weight,
          reps: set.reps,
          unit: set.unit as 'kg' | 'lbs',
          video_url: set.video_url,
        });
      }
    }
  }

  return {
    workoutSummary: true,
    prItems: prs,
    videoItems,
  };
}

/** Build the initial ShareableContent state: all items selected by default */
function buildInitialShareableContent(content: DerivedShareContent): ShareableContent {
  return {
    workoutSummary: true,
    selectedPRs: content.prItems.map((_, i) => String(i)),
    selectedVideos: content.videoItems.map((_, i) => String(i)),
  };
}

export function useShareFlow(
  session: WorkoutSession,
  prs: PRItem[]
): UseShareFlowResult {
  const { groups, shareToGroups } = useSocialStore();

  const content = useMemo(
    () => deriveShareableContent(session, prs),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [session.id]
  );

  const [shareableContent, setShareableContent] = useState<ShareableContent>(
    () => buildInitialShareableContent(content)
  );
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(() => new Set<string>());
  const [sharing, setSharing] = useState(false);
  const [shared, setShared] = useState(false);

  const toggleGroup = (groupId: string) => {
    setSelectedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const share = async () => {
    if (sharing || shared) return;

    const hasSelectedContent =
      shareableContent.workoutSummary ||
      shareableContent.selectedPRs.length > 0 ||
      shareableContent.selectedVideos.length > 0;

    if (!hasSelectedContent || selectedGroups.size === 0) return;

    setSharing(true);

    try {
      // Determine sharer display name for notifications
      let sharerName = 'Someone';
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user?.user_metadata?.display_name) {
          sharerName = user.user_metadata.display_name as string;
        } else if (user?.email) {
          sharerName = user.email.split('@')[0];
        }
      } catch {
        // Non-critical — continue with default
      }

      // Build SharedItem payloads for selected content
      const items: Array<{ content_type: 'workout' | 'pr' | 'video'; payload: unknown }> = [];

      // Determine the primary content type for notification (most significant)
      let notificationContentType: 'workout' | 'pr' | 'video' = 'workout';

      if (shareableContent.workoutSummary) {
        const item = buildWorkoutPayload(session);
        items.push({ content_type: item.content_type, payload: item.payload });
      }

      // PR items: selectedPRs contains string indices into content.prItems
      for (const prId of shareableContent.selectedPRs) {
        const i = parseInt(prId, 10);
        const pr = content.prItems[i];
        if (pr) {
          const item = buildPRPayload(pr.name, pr.weight, 0, pr.unit as 'kg' | 'lbs');
          items.push({ content_type: item.content_type, payload: item.payload });
          notificationContentType = 'pr';
        }
      }

      // Video items: selectedVideos contains string indices into content.videoItems
      for (const videoId of shareableContent.selectedVideos) {
        const i = parseInt(videoId, 10);
        const v = content.videoItems[i];
        if (v) {
          const item = buildVideoPayload(
            v.video_url,
            v.exercise_name,
            v.weight,
            v.reps,
            v.unit,
            v.set_number
          );
          items.push({ content_type: item.content_type, payload: item.payload });
          notificationContentType = 'video';
        }
      }

      if (items.length === 0) {
        setSharing(false);
        return;
      }

      const groupIds = Array.from(selectedGroups);

      // Share to all selected groups
      await shareToGroups(
        groupIds,
        items as Parameters<typeof shareToGroups>[1]
      );

      // Get the current user ID for notification exclusion
      let sharerId = '';
      try {
        const { data: { session: authSession } } = await supabase.auth.getSession();
        sharerId = authSession?.user?.id ?? '';
      } catch {
        // Non-critical
      }

      // Fire-and-forget notifications per group
      for (const groupId of groupIds) {
        void notifyGroupOnShare(groupId, sharerId, sharerName, notificationContentType);
      }

      setShared(true);
    } catch (err) {
      console.warn('useShareFlow: share failed:', err);
    } finally {
      setSharing(false);
    }
  };

  return {
    content,
    shareableContent,
    setShareableContent,
    selectedGroups,
    sharing,
    shared,
    toggleGroup,
    share,
  };
}
