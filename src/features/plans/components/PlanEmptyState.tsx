import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import { Button } from '@/components/ui/Button';

interface PlanEmptyStateProps {
  onCreatePress: () => void;
}

export function PlanEmptyState({ onCreatePress }: PlanEmptyStateProps) {
  return (
    <View style={s.container}>
      <Ionicons name="clipboard-outline" size={48} color={colors.textMuted} />
      <Text style={s.title}>Create your first workout plan</Text>
      <Text style={s.subtitle}>
        Build a structured plan with training days and exercises to guide your
        workouts.
      </Text>
      <View style={s.buttonContainer}>
        <Button title="Create Plan" onPress={onCreatePress} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 240,
  },
});
