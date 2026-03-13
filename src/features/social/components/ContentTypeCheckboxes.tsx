/**
 * ContentTypeCheckboxes — granular content selection for the share flow.
 *
 * Renders:
 *   - Workout Summary toggle (always shown, on by default)
 *   - PRs section with individual per-PR checkboxes (hidden if no PRs)
 *   - Videos section with individual per-video checkboxes (hidden if no videos)
 *
 * Uses Ionicons checkmark-circle / ellipse-outline for checkbox states.
 * Dark theme with magenta accent for selected items.
 * No emojis — icon components only per CLAUDE.md.
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import type { ShareableContent } from '@/features/social/types/chat';

/** A selectable PR item */
export interface PRCheckboxItem {
  /** Unique key — used as the ID in selectedPRs */
  id: string;
  /** Display label: exercise name + weight + unit */
  label: string;
}

/** A selectable video item */
export interface VideoCheckboxItem {
  /** Unique key — used as the ID in selectedVideos */
  id: string;
  /** Display label: exercise name + set number */
  label: string;
}

interface ContentTypeCheckboxesProps {
  /** Available PR items for the session */
  prs: PRCheckboxItem[];
  /** Available video items for the session */
  videos: VideoCheckboxItem[];
  /** Current selection state */
  value: ShareableContent;
  /** Called whenever selection changes */
  onChange: (value: ShareableContent) => void;
  /** When true, all interactions are disabled */
  disabled?: boolean;
}

export default function ContentTypeCheckboxes({
  prs,
  videos,
  value,
  onChange,
  disabled = false,
}: ContentTypeCheckboxesProps) {
  const toggleWorkoutSummary = () => {
    if (disabled) return;
    onChange({ ...value, workoutSummary: !value.workoutSummary });
  };

  const togglePR = (id: string) => {
    if (disabled) return;
    const next = value.selectedPRs.includes(id)
      ? value.selectedPRs.filter((p) => p !== id)
      : [...value.selectedPRs, id];
    onChange({ ...value, selectedPRs: next });
  };

  const toggleVideo = (id: string) => {
    if (disabled) return;
    const next = value.selectedVideos.includes(id)
      ? value.selectedVideos.filter((v) => v !== id)
      : [...value.selectedVideos, id];
    onChange({ ...value, selectedVideos: next });
  };

  return (
    <View style={s.container}>
      {/* Workout Summary — always shown */}
      <CheckboxRow
        label="Workout Summary"
        checked={value.workoutSummary}
        onToggle={toggleWorkoutSummary}
        disabled={disabled}
      />

      {/* PRs section — only shown if session had PRs */}
      {prs.length > 0 && (
        <View style={s.subSection}>
          <Text style={s.subSectionLabel}>Personal Records</Text>
          {prs.map((pr) => (
            <CheckboxRow
              key={pr.id}
              label={pr.label}
              checked={value.selectedPRs.includes(pr.id)}
              onToggle={() => togglePR(pr.id)}
              disabled={disabled}
              indent
            />
          ))}
        </View>
      )}

      {/* Videos section — only shown if session had set videos */}
      {videos.length > 0 && (
        <View style={s.subSection}>
          <Text style={s.subSectionLabel}>Set Videos</Text>
          {videos.map((video) => (
            <CheckboxRow
              key={video.id}
              label={video.label}
              checked={value.selectedVideos.includes(video.id)}
              onToggle={() => toggleVideo(video.id)}
              disabled={disabled}
              indent
            />
          ))}
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// CheckboxRow — single selectable row with icon + label
// ---------------------------------------------------------------------------

interface CheckboxRowProps {
  label: string;
  checked: boolean;
  onToggle: () => void;
  disabled: boolean;
  indent?: boolean;
}

function CheckboxRow({ label, checked, onToggle, disabled, indent }: CheckboxRowProps) {
  return (
    <Pressable
      style={[s.row, indent && s.rowIndented]}
      onPress={disabled ? undefined : onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
    >
      <Ionicons
        name={checked ? 'checkmark-circle' : 'ellipse-outline'}
        size={20}
        color={checked ? colors.accent : colors.textMuted}
      />
      <Text style={[s.rowLabel, disabled && s.rowLabelDisabled, checked && s.rowLabelChecked]}>
        {label}
      </Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const s = StyleSheet.create({
  container: {
    gap: 4,
  },
  subSection: {
    marginTop: 8,
    gap: 4,
  },
  subSectionLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  rowIndented: {
    paddingLeft: 4,
  },
  rowLabel: {
    color: colors.textPrimary,
    fontSize: 15,
    flex: 1,
  },
  rowLabelChecked: {
    color: colors.textPrimary,
  },
  rowLabelDisabled: {
    color: colors.textMuted,
  },
});
