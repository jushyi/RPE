import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';

/**
 * Post-workout summary screen shell.
 * Stats and weight target prompts will be filled in Plan 04-04.
 */
export default function WorkoutSummaryScreen() {
  const router = useRouter();

  const handleDone = () => {
    router.replace('/(app)/(tabs)' as any);
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.content}>
        <View style={s.iconContainer}>
          <Ionicons name="checkmark-circle" size={64} color={colors.success} />
        </View>
        <Text style={s.heading}>Workout Complete</Text>
        <Text style={s.subheading}>Great work! Your session has been saved.</Text>

        {/* Placeholder for stats card - filled in Plan 04-04 */}
        <View style={s.statsPlaceholder}>
          <Text style={s.placeholderText}>Session stats coming soon</Text>
        </View>

        <Pressable
          onPress={handleDone}
          style={({ pressed }) => [s.doneButton, pressed && s.doneButtonPressed]}
        >
          <Text style={s.doneButtonText}>Done</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  iconContainer: {
    marginBottom: 16,
  },
  heading: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subheading: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
  },
  statsPlaceholder: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceElevated,
    marginBottom: 40,
  },
  placeholderText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  doneButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 48,
    alignItems: 'center',
  },
  doneButtonPressed: {
    opacity: 0.8,
  },
  doneButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
});
