import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import { Button } from '@/components/ui/Button';

interface EmptyStateProps {
  hasFilters: boolean;
  onAddExercise?: () => void;
}

export function EmptyState({ hasFilters, onAddExercise }: EmptyStateProps) {
  return (
    <View style={s.container}>
      <Ionicons name="barbell-outline" size={48} color={colors.textMuted} />
      <Text style={s.title}>No exercises found</Text>
      <Text style={s.subtitle}>
        {hasFilters
          ? 'Try adjusting your filters'
          : 'Add your first custom exercise'}
      </Text>
      {onAddExercise && (
        <View style={s.buttonContainer}>
          <Button title="Add Exercise" onPress={onAddExercise} />
        </View>
      )}
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
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
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
