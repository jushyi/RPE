import { useCallback } from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import { useAlarmStore } from '@/stores/alarmStore';
import { usePlanStore } from '@/stores/planStore';
import { cancelPlanAlarms, syncActiveAlarms } from '@/features/alarms/hooks/useAlarmScheduler';

export function NotificationsSection() {
  const isPaused = useAlarmStore((s) => s.isPaused);
  const setPaused = useAlarmStore((s) => s.setPaused);
  const plans = usePlanStore((s) => s.plans);

  const handleTogglePause = useCallback(
    async (value: boolean) => {
      setPaused(value);

      try {
        if (value) {
          for (const plan of plans) {
            await cancelPlanAlarms(plan.plan_days);
          }
        } else {
          await syncActiveAlarms(plans);
        }
      } catch (_) {
        // Alarm scheduling failure is non-blocking
      }
    },
    [plans, setPaused],
  );

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Notifications</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <Ionicons
            name="notifications-off-outline"
            size={22}
            color={colors.textSecondary}
            style={styles.rowIcon}
          />
          <View style={styles.rowContent}>
            <Text style={styles.rowLabel}>Pause all alarms</Text>
            {isPaused && (
              <Text style={styles.rowHint}>Alarms and reminders are paused</Text>
            )}
          </View>
          <Switch
            value={isPaused}
            onValueChange={handleTogglePause}
            trackColor={{ false: colors.surfaceElevated, true: colors.accent }}
            thumbColor={colors.textPrimary}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowIcon: {
    marginRight: 12,
  },
  rowContent: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  rowHint: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
});
