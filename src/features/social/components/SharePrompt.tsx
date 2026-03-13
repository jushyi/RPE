/**
 * SharePrompt — collapsible share card on the workout summary screen.
 *
 * Only renders when the user has at least one group.
 * Uses ContentTypeCheckboxes for granular content selection (workout summary,
 * individual PRs, individual videos) and group chips for target selection.
 * Dispatches via useShareFlow.
 *
 * No emojis — icon components only (Ionicons). Per CLAUDE.md.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import { useSocialStore } from '@/stores/socialStore';
import { useShareFlow } from '@/features/social/hooks/useShareFlow';
import ContentTypeCheckboxes from '@/features/social/components/ContentTypeCheckboxes';
import type { ShareableContent } from '@/features/social/types/chat';
import type { WorkoutSession } from '@/features/workout/types';
import type { PRItem } from '@/features/social/hooks/useShareFlow';

interface SharePromptProps {
  session: WorkoutSession;
  prs: PRItem[];
  /** Optional callback when share completes — receives the content selection and group IDs */
  onShare?: (content: ShareableContent, groupIds: string[]) => void;
}

export default function SharePrompt({ session, prs, onShare }: SharePromptProps) {
  const { groups } = useSocialStore();
  const [expanded, setExpanded] = useState(false);

  const {
    content,
    shareableContent,
    setShareableContent,
    selectedGroups,
    sharing,
    shared,
    toggleGroup,
    share,
  } = useShareFlow(session, prs);

  // Don't render if no groups
  if (groups.length === 0) {
    return null;
  }

  // Can share when at least one content item selected and at least one group
  const hasSelectedContent =
    shareableContent.workoutSummary ||
    shareableContent.selectedPRs.length > 0 ||
    shareableContent.selectedVideos.length > 0;
  const canShare = hasSelectedContent && selectedGroups.size > 0 && !shared;

  const handleShare = async () => {
    if (!canShare) return;
    await share();
    if (onShare) {
      onShare(shareableContent, Array.from(selectedGroups));
    }
  };

  if (shared) {
    return (
      <View style={s.card}>
        <View style={s.successRow}>
          <Ionicons name="checkmark-circle" size={22} color={colors.success} />
          <Text style={s.successText}>Shared!</Text>
        </View>
      </View>
    );
  }

  if (!expanded) {
    return (
      <View style={s.card}>
        <Pressable
          style={s.collapsedRow}
          onPress={() => setExpanded(true)}
          accessibilityRole="button"
          accessibilityLabel="Share workout with your groups"
        >
          <Ionicons name="share-social-outline" size={20} color={colors.accent} />
          <Text style={s.collapsedText}>Share with your groups</Text>
          <Ionicons name="chevron-down-outline" size={18} color={colors.textMuted} />
        </Pressable>
      </View>
    );
  }

  // Build ContentTypeCheckboxes props from derived content
  const prCheckboxItems = content.prItems.map((pr, i) => ({
    id: String(i),
    label: `${pr.name} — ${pr.weight} ${pr.unit}`,
  }));

  const videoCheckboxItems = content.videoItems.map((v, i) => ({
    id: String(i),
    label: `${v.exercise_name} · Set ${v.set_number}`,
  }));

  return (
    <View style={s.card}>
      {/* Header */}
      <Pressable
        style={s.header}
        onPress={() => setExpanded(false)}
        accessibilityRole="button"
        accessibilityLabel="Collapse share panel"
      >
        <View style={s.headerLeft}>
          <Ionicons name="share-social-outline" size={20} color={colors.accent} />
          <Text style={s.headerTitle}>Share with your groups</Text>
        </View>
        <Ionicons name="chevron-up-outline" size={18} color={colors.textMuted} />
      </Pressable>

      {/* Content selection using ContentTypeCheckboxes */}
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
            <Text style={[s.shareButtonText, s.shareButtonTextDisabled]}>Sharing...</Text>
          </View>
        ) : (
          <Text style={[s.shareButtonText, !canShare && s.shareButtonTextDisabled]}>
            Share
          </Text>
        )}
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const s = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.surfaceElevated,
    gap: 16,
  },
  collapsedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  collapsedText: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
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
  successRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  successText: {
    color: colors.success,
    fontSize: 16,
    fontWeight: '700',
  },
});
