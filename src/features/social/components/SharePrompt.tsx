/**
 * SharePrompt — collapsible share card on the workout summary screen.
 *
 * Only renders when the user has at least one group.
 * Allows selecting content (workout summary, PRs, videos) and target groups,
 * then dispatches via useShareFlow.
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
import type { WorkoutSession } from '@/features/workout/types';
import type { PRItem } from '@/features/social/hooks/useShareFlow';

interface SharePromptProps {
  session: WorkoutSession;
  prs: PRItem[];
}

export default function SharePrompt({ session, prs }: SharePromptProps) {
  const { groups } = useSocialStore();
  const [expanded, setExpanded] = useState(false);

  const {
    content,
    selectedContent,
    selectedGroups,
    sharing,
    shared,
    toggleContent,
    toggleGroup,
    share,
  } = useShareFlow(session, prs);

  // Don't render if no groups
  if (groups.length === 0) {
    return null;
  }

  const canShare = selectedContent.size > 0 && selectedGroups.size > 0 && !shared;

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

      {/* Content selection */}
      <View style={s.section}>
        <Text style={s.sectionLabel}>What to share</Text>

        {/* Workout summary — always available */}
        <ContentCheckbox
          label="Workout Summary"
          checked={selectedContent.has('workout')}
          onToggle={() => toggleContent('workout')}
          disabled={sharing}
        />

        {/* PR items */}
        {content.prItems.map((pr, i) => (
          <ContentCheckbox
            key={`pr-${i}`}
            label={`PR: ${pr.name} - ${pr.weight} ${pr.unit}`}
            checked={selectedContent.has(`pr-${i}`)}
            onToggle={() => toggleContent(`pr-${i}`)}
            disabled={sharing}
          />
        ))}

        {/* Video items */}
        {content.videoItems.map((v, i) => (
          <ContentCheckbox
            key={`video-${i}`}
            label={`Video: ${v.exercise_name} Set ${v.set_number}`}
            checked={selectedContent.has(`video-${i}`)}
            onToggle={() => toggleContent(`video-${i}`)}
            disabled={sharing}
          />
        ))}
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
        onPress={canShare ? share : undefined}
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
// ContentCheckbox — small inline component for content toggle rows
// ---------------------------------------------------------------------------

interface ContentCheckboxProps {
  label: string;
  checked: boolean;
  onToggle: () => void;
  disabled: boolean;
}

function ContentCheckbox({ label, checked, onToggle, disabled }: ContentCheckboxProps) {
  return (
    <Pressable
      style={s.checkboxRow}
      onPress={disabled ? undefined : onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
    >
      <Ionicons
        name={checked ? 'checkbox' : 'square-outline'}
        size={20}
        color={checked ? colors.accent : colors.textMuted}
      />
      <Text style={[s.checkboxLabel, disabled && s.checkboxLabelDisabled]}>{label}</Text>
    </Pressable>
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
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 2,
  },
  checkboxLabel: {
    color: colors.textPrimary,
    fontSize: 15,
    flex: 1,
  },
  checkboxLabelDisabled: {
    color: colors.textMuted,
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
