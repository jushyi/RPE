import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';

interface FirstPlanPromptStepProps {
  onCreatePlan: () => void;
  onComplete: () => void;
}

/**
 * Step 4 (final step): Explains what workout plans are and offers
 * a CTA to create a first plan or skip to dashboard.
 *
 * The parent component is responsible for calling setOnboardingComplete()
 * BEFORE navigating to the plan builder (per research pitfall #2).
 */
export function FirstPlanPromptStep({ onCreatePlan, onComplete }: FirstPlanPromptStepProps) {
  return (
    <View style={s.container}>
      <View style={s.content}>
        <Ionicons name="clipboard-outline" size={48} color={colors.accent} style={s.icon} />
        <Text style={s.title}>Create Your First Plan</Text>
        <Text style={s.description}>
          Workout plans let you organize exercises by day of the week, set targets for sets and
          reps, and track your progress against your plan.
        </Text>
        <Text style={s.description}>
          The app will remind you on your planned training days so you never miss a session.
        </Text>
      </View>

      <View style={s.footer}>
        <Pressable style={s.primaryButton} onPress={onCreatePlan}>
          <Ionicons name="add-circle-outline" size={20} color={colors.white} style={s.buttonIcon} />
          <Text style={s.primaryButtonText}>Create Your First Plan</Text>
        </Pressable>
        <Pressable style={s.secondaryButton} onPress={onComplete}>
          <Text style={s.secondaryButtonText}>Skip for Now</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  icon: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  description: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24,
  },
  footer: {
    paddingBottom: 24,
  },
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '600',
  },
});
