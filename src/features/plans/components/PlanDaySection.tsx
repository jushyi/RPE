import React, { useState } from 'react';
import { View, Text, Pressable, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import { MuscleGroupBadge } from '@/features/exercises/components/MuscleGroupBadge';
import { WEEKDAY_LABELS } from '../constants';
import type { PlanDay } from '../types';

const WEEKDAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatAlarmTime(time: string): string {
  const parts = time.split(':');
  if (parts.length < 2) return time;
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  if (isNaN(hours)) return time;
  const suffix = hours >= 12 ? 'PM' : 'AM';
  if (hours === 0) hours = 12;
  else if (hours > 12) hours -= 12;
  return `${hours}:${minutes} ${suffix}`;
}

interface WeekdayPickerModalProps {
  visible: boolean;
  currentWeekday: number | null;
  onSelect: (weekday: number) => void;
  onClose: () => void;
}

function WeekdayPickerModal({ visible, currentWeekday, onSelect, onClose }: WeekdayPickerModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={ms.overlay} onPress={onClose}>
        <Pressable style={ms.card} onPress={(e) => e.stopPropagation()}>
          <Text style={ms.title}>Select Day</Text>
          {WEEKDAY_FULL.map((name, index) => {
            const isSelected = currentWeekday === index;
            return (
              <Pressable
                key={index}
                style={[ms.option, index < 6 && ms.optionBorder]}
                onPress={() => onSelect(index)}
              >
                <Text style={[ms.optionText, isSelected && ms.optionTextSelected]}>
                  {name}
                </Text>
                {isSelected && (
                  <Ionicons name="checkmark" size={18} color={colors.accent} />
                )}
              </Pressable>
            );
          })}
          <Pressable style={ms.cancelBtn} onPress={onClose}>
            <Text style={ms.cancelText}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

interface PlanDaySectionProps {
  day: PlanDay;
  defaultExpanded?: boolean;
  onStartWorkout?: (day: PlanDay) => void;
  isCoachPlan?: boolean;
  onWeekdayChange?: (dayId: string, weekday: number) => void;
}

export function PlanDaySection({ day, defaultExpanded = true, onStartWorkout, isCoachPlan = false, onWeekdayChange }: PlanDaySectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [pickerVisible, setPickerVisible] = useState(false);

  const toggle = () => {
    setExpanded((prev) => !prev);
  };

  const weekdayLabel = day.weekday !== null ? WEEKDAY_LABELS[day.weekday] : null;
  const showChip = isCoachPlan && !!onWeekdayChange;

  return (
    <View style={s.container}>
      <Pressable onPress={toggle} style={s.header}>
        <View style={s.headerText}>
          <Text style={s.dayName}>{day.day_name}</Text>
          {showChip ? (
            <Pressable
              style={s.weekdayChip}
              onPress={(e) => {
                e.stopPropagation();
                setPickerVisible(true);
              }}
              hitSlop={4}
            >
              <Text style={s.weekdayChipText}>
                {weekdayLabel ?? 'Set Day'}
              </Text>
            </Pressable>
          ) : (
            weekdayLabel && <Text style={s.weekday}> - {weekdayLabel}</Text>
          )}
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.textMuted}
        />
      </Pressable>

      {expanded && (
        <View style={s.body}>
          {day.alarm_enabled && day.alarm_time ? (
            <View style={s.alarmRow}>
              <Ionicons name="alarm-outline" size={16} color={colors.accent} />
              <Text style={s.alarmText}>{formatAlarmTime(day.alarm_time)}</Text>
            </View>
          ) : null}
          {day.plan_day_exercises.length === 0 ? (
            <Text style={s.empty}>No exercises</Text>
          ) : (
            day.plan_day_exercises.map((ex) => {
              const exerciseInfo = ex.exercise;
              const muscleGroups: string[] =
                (exerciseInfo as any)?.muscle_groups ??
                ((exerciseInfo as any)?.muscle_group ? [(exerciseInfo as any).muscle_group] : []);

              return (
                <View key={ex.id} style={s.exerciseCard}>
                  <View style={s.exerciseHeader}>
                    <Text style={s.exerciseName}>
                      {exerciseInfo?.name ?? 'Unknown'}
                    </Text>
                    <View style={s.badgeRow}>
                      {muscleGroups.map((g: string) => (
                        <MuscleGroupBadge key={g} muscleGroup={g as any} />
                      ))}
                    </View>
                  </View>

                  {/* Sets table */}
                  {ex.target_sets.length > 0 && (
                    <View style={s.setsTable}>
                      <View style={s.setsHeaderRow}>
                        <Text style={[s.setsHeaderCell, s.setNumCol]}>Set</Text>
                        <Text style={[s.setsHeaderCell, s.setValueCol]}>Weight</Text>
                        <Text style={[s.setsHeaderCell, s.setValueCol]}>Reps</Text>
                        <Text style={[s.setsHeaderCell, s.setValueCol]}>RPE</Text>
                      </View>
                      {ex.target_sets.map((set, i) => (
                        <View key={i} style={s.setsRow}>
                          <Text style={[s.setsCell, s.setNumCol]}>{i + 1}</Text>
                          <Text style={[s.setsCell, s.setValueCol]}>{set.weight || '--'}</Text>
                          <Text style={[s.setsCell, s.setValueCol]}>{set.reps || '--'}</Text>
                          <Text style={[s.setsCell, s.setValueCol]}>{set.rpe ?? '--'}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Notes */}
                  {ex.notes && (
                    <Text style={s.notes}>{ex.notes}</Text>
                  )}
                </View>
              );
            })
          )}

          {onStartWorkout && day.plan_day_exercises.length > 0 && (
            <Pressable
              style={s.startWorkoutBtn}
              onPress={() => onStartWorkout(day)}
            >
              <Ionicons name="play" size={18} color={colors.white} />
              <Text style={s.startWorkoutText}>Start Workout</Text>
            </Pressable>
          )}
        </View>
      )}

      {showChip && (
        <WeekdayPickerModal
          visible={pickerVisible}
          currentWeekday={day.weekday}
          onSelect={(weekday) => {
            onWeekdayChange(day.id, weekday);
            setPickerVisible(false);
          }}
          onClose={() => setPickerVisible(false)}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.surfaceElevated,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  headerText: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flex: 1,
  },
  dayName: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  weekday: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  weekdayChip: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  weekdayChipText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '600',
  },
  body: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  empty: {
    color: colors.textMuted,
    fontSize: 14,
    fontStyle: 'italic',
  },
  exerciseCard: {
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  exerciseHeader: {
    marginBottom: 6,
  },
  exerciseName: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  setsTable: {
    marginTop: 4,
  },
  setsHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceElevated,
    paddingBottom: 4,
    marginBottom: 2,
  },
  setsHeaderCell: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  setsRow: {
    flexDirection: 'row',
    paddingVertical: 3,
  },
  setsCell: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  setNumCol: {
    width: 36,
  },
  setValueCol: {
    flex: 1,
    textAlign: 'center',
  },
  notes: {
    color: colors.textMuted,
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 6,
  },
  startWorkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 8,
  },
  startWorkoutText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  alarmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  alarmText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
});

const ms = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    width: 260,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  optionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceElevated,
  },
  optionText: {
    color: colors.textPrimary,
    fontSize: 15,
  },
  optionTextSelected: {
    color: colors.accent,
    fontWeight: '600',
  },
  cancelBtn: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 10,
  },
  cancelText: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '600',
  },
});
