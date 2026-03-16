/**
 * RetroShareButton — share icon button for the history session detail screen.
 *
 * Renders an Ionicons share-outline button that opens a modal containing the
 * full share flow (ContentTypeCheckboxes + group selection) pre-populated with
 * historical session data from useRetroactiveShare.
 *
 * Retroactive share payloads include a `workout_date` field so that feed cards
 * can display "Workout from [original date]" while the card's timeline position
 * is based on the share time (created_at).
 *
 * Only renders when the user has at least one group.
 * No emojis — icon components only per CLAUDE.md.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import { useSocialStore } from '@/stores/socialStore';
import { useRetroactiveShare } from '@/features/social/hooks/useRetroactiveShare';
import ContentTypeCheckboxes from '@/features/social/components/ContentTypeCheckboxes';
import { notifyGroupOnShare } from '@/features/social/utils/notifyGroup';
import { supabase } from '@/lib/supabase/client';
import type { ShareableContent } from '@/features/social/types/chat';

interface RetroShareButtonProps {
  sessionId: string;
}

/** Format a date string as "Mon D, YYYY" */
function formatWorkoutDate(dateStr: string): string {
  const d = new Date(dateStr);
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export default function RetroShareButton({ sessionId }: RetroShareButtonProps) {
  const { groups, shareToGroups } = useSocialStore();
  const [modalVisible, setModalVisible] = useState(false);

  // Only render when groups exist
  if (groups.length === 0) {
    return null;
  }

  return (
    <>
      <Pressable
        style={s.button}
        onPress={() => setModalVisible(true)}
        accessibilityRole="button"
        accessibilityLabel="Share this workout"
      >
        <Ionicons name="share-outline" size={22} color={colors.accent} />
      </Pressable>

      <RetroShareModal
        sessionId={sessionId}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        groups={groups}
        shareToGroups={shareToGroups}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// RetroShareModal — full share flow in a modal
// ---------------------------------------------------------------------------

interface RetroShareModalProps {
  sessionId: string;
  visible: boolean;
  onClose: () => void;
  groups: Array<{ id: string; name: string }>;
  shareToGroups: (groupIds: string[], items: any[]) => Promise<void>;
}

function RetroShareModal({
  sessionId,
  visible,
  onClose,
  groups,
  shareToGroups,
}: RetroShareModalProps) {
  const { session, prs, videos, workoutDate, loading } = useRetroactiveShare(
    visible ? sessionId : null
  );

  const [shareableContent, setShareableContent] = useState<ShareableContent>({
    workoutSummary: true,
    selectedPRs: [],
    selectedVideos: [],
  });

  // Reset selection when modal opens with fresh data
  React.useEffect(() => {
    if (session && visible) {
      setShareableContent({
        workoutSummary: true,
        selectedPRs: prs.map((_, i) => String(i)),
        selectedVideos: videos.map((_, i) => String(i)),
      });
    }
  }, [session?.id, visible]);

  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [sharing, setSharing] = useState(false);
  const [shared, setShared] = useState(false);

  // Reset state when modal closes
  React.useEffect(() => {
    if (!visible) {
      setSharing(false);
      setShared(false);
      setSelectedGroups(new Set());
    }
  }, [visible]);

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

  const hasSelectedContent =
    shareableContent.workoutSummary ||
    shareableContent.selectedPRs.length > 0 ||
    shareableContent.selectedVideos.length > 0;

  const canShare = hasSelectedContent && selectedGroups.size > 0 && !shared;

  const handleShare = async () => {
    if (!canShare || !session) return;
    setSharing(true);

    try {
      // Determine sharer display name for notifications
      let sharerName = 'Someone';
      let sharerId = '';
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          sharerId = user.id;
          if (user.user_metadata?.display_name) {
            sharerName = user.user_metadata.display_name as string;
          } else if (user.email) {
            sharerName = user.email.split('@')[0];
          }
        }
      } catch {
        // Non-critical
      }

      const groupIds = Array.from(selectedGroups);
      const items: Array<{ content_type: 'workout' | 'pr' | 'video'; payload: unknown }> = [];
      let notificationContentType: 'workout' | 'pr' | 'video' = 'workout';

      // Build workout summary payload with workout_date for retroactive shares
      if (shareableContent.workoutSummary) {
        const exerciseNames = session.exercises.map((e) => e.exercise_name);
        let totalSets = 0;
        let totalVolume = 0;
        for (const ex of session.exercises) {
          totalSets += ex.logged_sets.length;
          for (const sl of ex.logged_sets) {
            totalVolume += sl.weight * sl.reps;
          }
        }
        let durationMinutes = 0;
        if (session.ended_at) {
          const startMs = new Date(session.started_at).getTime();
          const endMs = new Date(session.ended_at).getTime();
          durationMinutes = Math.round((endMs - startMs) / 60000);
        }
        items.push({
          content_type: 'workout',
          payload: {
            exercise_names: exerciseNames,
            total_sets: totalSets,
            total_volume: totalVolume,
            duration_minutes: durationMinutes,
            // Retroactive share marker: original workout date
            workout_date: workoutDate ?? session.started_at,
          },
        });
      }

      // PR items
      for (const prId of shareableContent.selectedPRs) {
        const i = parseInt(prId, 10);
        const pr = prs[i];
        if (pr) {
          items.push({
            content_type: 'pr',
            payload: {
              exercise_name: pr.name,
              weight: pr.weight,
              reps: 0,
              unit: pr.unit,
              // Retroactive share marker
              workout_date: workoutDate ?? session.started_at,
            },
          });
          notificationContentType = 'pr';
        }
      }

      // Video items
      for (const videoId of shareableContent.selectedVideos) {
        const i = parseInt(videoId, 10);
        const v = videos[i];
        if (v) {
          items.push({
            content_type: 'video',
            payload: {
              video_url: v.video_url,
              exercise_name: v.exercise_name,
              weight: v.weight,
              reps: v.reps,
              unit: v.unit,
              set_number: v.set_number,
              // Retroactive share marker
              workout_date: workoutDate ?? session.started_at,
            },
          });
          notificationContentType = 'video';
        }
      }

      if (items.length === 0) {
        setSharing(false);
        return;
      }

      await shareToGroups(groupIds, items as any);

      // Fire-and-forget notifications per group
      for (const groupId of groupIds) {
        void notifyGroupOnShare(groupId, sharerId, sharerName, notificationContentType);
      }

      setShared(true);
    } catch (err) {
      console.warn('RetroShareModal: share failed:', err);
    } finally {
      setSharing(false);
    }
  };

  // Build checkbox items
  const prCheckboxItems = prs.map((pr, i) => ({
    id: String(i),
    label: `${pr.name} — ${pr.weight} ${pr.unit}`,
  }));

  const videoCheckboxItems = videos.map((v, i) => ({
    id: String(i),
    label: `${v.exercise_name} · Set ${v.set_number}`,
  }));

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={s.modalContainer}>
        {/* Modal header */}
        <View style={s.modalHeader}>
          <Text style={s.modalTitle}>Share Workout</Text>
          <Pressable
            style={s.closeButton}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close share modal"
          >
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </Pressable>
        </View>

        {loading ? (
          <View style={s.loadingContainer}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : shared ? (
          <View style={s.sharedContainer}>
            <Ionicons name="checkmark-circle" size={48} color={colors.success} />
            <Text style={s.sharedText}>Shared!</Text>
            <Pressable style={s.doneButton} onPress={onClose}>
              <Text style={s.doneButtonText}>Done</Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView style={s.scrollView} contentContainerStyle={s.scrollContent}>
            {/* Workout date label */}
            {workoutDate && (
              <View style={s.workoutDateBadge}>
                <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                <Text style={s.workoutDateText}>
                  Workout from {formatWorkoutDate(workoutDate)}
                </Text>
              </View>
            )}

            {/* Content type selection */}
            <View style={s.section}>
              <Text style={s.sectionLabel}>What to share</Text>
              <ContentTypeCheckboxes
                prs={prCheckboxItems}
                videos={videoCheckboxItems}
                value={shareableContent}
                onChange={setShareableContent}
                disabled={sharing}
              />
            </View>

            {/* Group selection */}
            <View style={s.section}>
              <Text style={s.sectionLabel}>Share to</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.groupChips}
              >
                {groups.map((group) => {
                  const isSelected = selectedGroups.has(group.id);
                  return (
                    <Pressable
                      key={group.id}
                      style={[s.chip, isSelected && s.chipSelected]}
                      onPress={() => !sharing && toggleGroup(group.id)}
                      accessibilityRole="button"
                      accessibilityLabel={`${isSelected ? 'Deselect' : 'Select'} group ${group.name}`}
                    >
                      <Text style={[s.chipText, isSelected && s.chipTextSelected]}>
                        {group.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Share button */}
            <Pressable
              style={[s.shareButton, !canShare && s.shareButtonDisabled]}
              onPress={canShare ? handleShare : undefined}
              disabled={!canShare || sharing}
              accessibilityRole="button"
              accessibilityLabel="Share selected content with selected groups"
            >
              {sharing ? (
                <View style={s.shareButtonRow}>
                  <ActivityIndicator size="small" color={colors.textMuted} />
                  <Text style={[s.shareButtonText, s.shareButtonTextDisabled]}>
                    Sharing...
                  </Text>
                </View>
              ) : (
                <Text style={[s.shareButtonText, !canShare && s.shareButtonTextDisabled]}>
                  Share
                </Text>
              )}
            </Pressable>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const s = StyleSheet.create({
  button: {
    padding: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceElevated,
  },
  modalTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sharedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  sharedText: {
    color: colors.success,
    fontSize: 24,
    fontWeight: '700',
  },
  doneButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  doneButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 24,
    paddingBottom: 40,
  },
  workoutDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  workoutDateText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  section: {
    gap: 10,
  },
  sectionLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  groupChips: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.surfaceElevated,
  },
  chipSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  chipText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: colors.white,
    fontWeight: '600',
  },
  shareButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  shareButtonDisabled: {
    backgroundColor: colors.surfaceElevated,
  },
  shareButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shareButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  shareButtonTextDisabled: {
    color: colors.textMuted,
  },
});
