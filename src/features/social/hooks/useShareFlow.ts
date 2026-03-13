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

export interface ShareableContent {
  workoutSummary: true;
  prItems: PRItem[];
  videoItems: VideoItem[];
}

export interface UseShareFlowResult {
  /** Derived shareable content from the session */
  content: ShareableContent;
  /** Keys of currently selected content items */
  selectedContent: Set<string>;
  /** IDs of currently selected groups */
  selectedGroups: Set<string>;
  /** Whether a share request is in progress */
  sharing: boolean;
  /** Whether the share was completed successfully */
  shared: boolean;
  /** Toggle a content item's selection */
  toggleContent: (key: string) => void;
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
): ShareableContent {
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

  const [selectedContent, setSelectedContent] = useState<Set<string>>(
    () => new Set<string>(['workout'])
  );
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(() => new Set<string>());
  const [sharing, setSharing] = useState(false);
  const [shared, setShared] = useState(false);

  const toggleContent = (key: string) => {
    setSelectedContent((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

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
    if (selectedContent.size === 0 || selectedGroups.size === 0) return;

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

      if (selectedContent.has('workout')) {
        const item = buildWorkoutPayload(session);
        items.push({ content_type: item.content_type, payload: item.payload });
      }

      // PR items: keys are "pr-0", "pr-1", etc.
      for (let i = 0; i < content.prItems.length; i++) {
        if (selectedContent.has(`pr-${i}`)) {
          const pr = content.prItems[i];
          const item = buildPRPayload(pr.name, pr.weight, 0, pr.unit as 'kg' | 'lbs');
          items.push({ content_type: item.content_type, payload: item.payload });
          notificationContentType = 'pr';
        }
      }

      // Video items: keys are "video-0", "video-1", etc.
      for (let i = 0; i < content.videoItems.length; i++) {
        if (selectedContent.has(`video-${i}`)) {
          const v = content.videoItems[i];
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
    selectedContent,
    selectedGroups,
    sharing,
    shared,
    toggleContent,
    toggleGroup,
    share,
  };
}
