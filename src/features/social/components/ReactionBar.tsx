import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import { REACTION_ICONS } from '@/features/social/utils/reactionIcons';
import { useReactions } from '@/features/social/hooks/useReactions';

interface ReactionBarProps {
  sharedItemId: string;
}

/**
 * Horizontal row of reaction icon pills with counts.
 * Uses Ionicons — NO emoji characters per CLAUDE.md project convention.
 */
export function ReactionBar({ sharedItemId }: ReactionBarProps) {
  const { reactionCounts, myReactions, toggle } = useReactions(sharedItemId);
  const [pickerOpen, setPickerOpen] = useState(false);

  // Reactions that have at least one count
  const activeReactions = REACTION_ICONS.filter(
    (r) => (reactionCounts.get(r.key) ?? 0) > 0
  );

  const handleToggle = async (key: string) => {
    await toggle(key);
    // Close picker after selecting
    setPickerOpen(false);
  };

  return (
    <View style={s.container}>
      <View style={s.pillRow}>
        {/* Active reaction pills */}
        {activeReactions.map((r) => {
          const count = reactionCounts.get(r.key) ?? 0;
          const isMyReaction = myReactions.has(r.key);
          return (
            <Pressable
              key={r.key}
              style={[s.pill, isMyReaction && s.pillActive]}
              onPress={() => handleToggle(r.key)}
            >
              <Ionicons
                name={r.icon as any}
                size={15}
                color={isMyReaction ? colors.accent : colors.textSecondary}
              />
              <Text style={[s.pillCount, isMyReaction && s.pillCountActive]}>
                {count}
              </Text>
            </Pressable>
          );
        })}

        {/* "+" button to open reaction picker */}
        <Pressable
          style={s.addBtn}
          onPress={() => setPickerOpen((v) => !v)}
        >
          <Ionicons
            name={pickerOpen ? 'close-outline' : 'add-outline'}
            size={18}
            color={colors.textMuted}
          />
        </Pressable>
      </View>

      {/* Reaction picker row */}
      {pickerOpen ? (
        <View style={s.picker}>
          {REACTION_ICONS.map((r) => {
            const isSelected = myReactions.has(r.key);
            return (
              <Pressable
                key={r.key}
                style={[s.pickerItem, isSelected && s.pickerItemSelected]}
                onPress={() => handleToggle(r.key)}
              >
                <Ionicons
                  name={r.icon as any}
                  size={22}
                  color={isSelected ? colors.accent : colors.textPrimary}
                />
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 5,
    gap: 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  pillActive: {
    borderColor: colors.accent + '66',
    backgroundColor: colors.accent + '1a',
  },
  pillCount: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  pillCountActive: {
    color: colors.accent,
  },
  addBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  picker: {
    flexDirection: 'row',
    marginTop: 8,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12,
    padding: 6,
    gap: 4,
    alignSelf: 'flex-start',
  },
  pickerItem: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerItemSelected: {
    backgroundColor: colors.accent + '22',
  },
});
