/**
 * Developer test screen for notification testing.
 * Hidden behind long-press on version text in Settings.
 * Provides trigger buttons for all 6 notification types and a debug log.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { ScrollView, StyleSheet, View, Text, Pressable } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase/client';

interface DebugEntry {
  type: string;
  timestamp: string;
  data: string;
}

type ButtonStatus = 'idle' | 'sending' | 'success' | 'error';

export default function DevToolsScreen() {
  const [debugLog, setDebugLog] = useState<DebugEntry[]>([]);
  const [buttonStatus, setButtonStatus] = useState<Record<string, ButtonStatus>>({
    alarm: 'idle',
    nudge: 'idle',
    plan_update: 'idle',
    weekly_summary: 'idle',
  });
  const timerRefs = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Listen for received notifications (foreground)
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener((notification) => {
      const data = notification.request.content.data;
      const entry: DebugEntry = {
        type: (data?.type as string) ?? 'unknown',
        timestamp: new Date().toLocaleTimeString(),
        data: JSON.stringify(data ?? {}, null, 2),
      };
      setDebugLog((prev) => [entry, ...prev].slice(0, 10));
    });

    return () => subscription.remove();
  }, []);

  // Clean up timers
  useEffect(() => {
    return () => {
      Object.values(timerRefs.current).forEach(clearTimeout);
    };
  }, []);

  const updateStatus = useCallback((type: NotificationType, status: ButtonStatus) => {
    setButtonStatus((prev) => ({ ...prev, [type]: status }));
    if (status === 'success' || status === 'error') {
      if (timerRefs.current[type]) clearTimeout(timerRefs.current[type]);
      timerRefs.current[type] = setTimeout(() => {
        setButtonStatus((prev) => ({ ...prev, [type]: 'idle' }));
      }, 2000);
    }
  }, []);

  const triggerAlarm = async () => {
    updateStatus('alarm', 'sending');
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Wake-up alarm',
          body: 'Time to train',
          data: { type: 'alarm' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 3,
        },
      });
      updateStatus('alarm', 'success');
    } catch {
      updateStatus('alarm', 'error');
    }
  };

  const triggerNudge = async () => {
    updateStatus('nudge', 'sending');
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Missed workout',
          body: "You missed today's session",
          data: { type: 'nudge' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 3,
        },
      });
      updateStatus('nudge', 'success');
    } catch {
      updateStatus('nudge', 'error');
    }
  };

  const triggerPlanUpdate = async () => {
    updateStatus('plan_update', 'sending');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      await supabase.functions.invoke('send-push', {
        body: {
          recipient_ids: [user.id],
          title: 'Plan Updated',
          body: 'Your training plan has been updated',
          data: { type: 'plan_update', plan_id: 'test-plan' },
        },
      });
      updateStatus('plan_update', 'success');
    } catch {
      updateStatus('plan_update', 'error');
    }
  };

  const triggerWeeklySummary = async () => {
    updateStatus('weekly_summary', 'sending');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      await supabase.functions.invoke('send-push', {
        body: {
          recipient_ids: [user.id],
          title: 'Weekly Summary',
          body: 'Your weekly training summary is ready',
          data: { type: 'weekly_summary' },
        },
      });
      updateStatus('weekly_summary', 'success');
    } catch {
      updateStatus('weekly_summary', 'error');
    }
  };

  const getStatusIcon = (status: ButtonStatus): { name: keyof typeof Ionicons.glyphMap; color: string } | null => {
    switch (status) {
      case 'sending': return { name: 'time-outline', color: colors.warning };
      case 'success': return { name: 'checkmark-circle-outline', color: colors.success };
      case 'error': return { name: 'alert-circle-outline', color: colors.error };
      default: return null;
    }
  };

  const buttons: { type: string; label: string; onPress: () => void; icon: keyof typeof Ionicons.glyphMap }[] = [
    { type: 'alarm', label: 'Alarm', onPress: triggerAlarm, icon: 'alarm-outline' },
    { type: 'nudge', label: 'Nudge', onPress: triggerNudge, icon: 'notifications-outline' },
    { type: 'plan_update', label: 'Plan Update', onPress: triggerPlanUpdate, icon: 'document-text-outline' },
    { type: 'weekly_summary', label: 'Weekly Summary', onPress: triggerWeeklySummary, icon: 'stats-chart-outline' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.buttonGrid}>
        {buttons.map(({ type, label, onPress, icon }) => {
          const statusIcon = getStatusIcon(buttonStatus[type]);
          return (
            <Pressable
              key={type}
              style={({ pressed }) => [styles.triggerButton, pressed && styles.triggerButtonPressed]}
              onPress={onPress}
              disabled={buttonStatus[type] === 'sending'}
            >
              <Ionicons name={icon} size={20} color={colors.textPrimary} />
              <Text style={styles.triggerButtonText}>{label}</Text>
              {statusIcon && (
                <Ionicons name={statusIcon.name} size={18} color={statusIcon.color} style={styles.statusIcon} />
              )}
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.sectionHeading}>Debug Log</Text>
      {debugLog.length === 0 ? (
        <Text style={styles.emptyText}>No notifications received yet</Text>
      ) : (
        debugLog.map((entry, index) => (
          <View key={`${entry.timestamp}-${index}`} style={styles.debugCard}>
            <View style={styles.debugHeader}>
              <Text style={styles.debugType}>{entry.type}</Text>
              <Text style={styles.debugTimestamp}>{entry.timestamp}</Text>
            </View>
            <Text style={styles.debugData}>{entry.data}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  buttonGrid: {
    gap: 10,
    marginBottom: 32,
  },
  triggerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  triggerButtonPressed: {
    opacity: 0.7,
  },
  triggerButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  statusIcon: {
    marginLeft: 'auto',
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: 20,
  },
  debugCard: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  debugHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  debugType: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
  },
  debugTimestamp: {
    fontSize: 12,
    color: colors.textMuted,
  },
  debugData: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: 'monospace',
  },
});
