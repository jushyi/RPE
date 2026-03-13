import { useState, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, Alert, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HandleSetup } from '@/features/social/components/HandleSetup';
import { useFriendshipStore } from '@/stores/friendshipStore';
import { colors } from '@/constants/theme';

interface HandleStepProps {
  onNext: () => void;
  onSkip: () => void;
}

/**
 * Onboarding step 0: Choose your handle.
 *
 * Reuses the HandleSetup component in 'step' mode.
 * "Next" saves the handle then advances; "Skip" advances without saving.
 * Handle is optional during onboarding — can be set later in Settings.
 */
export function HandleStep({ onNext, onSkip }: HandleStepProps) {
  const setMyHandle = useFriendshipStore((s) => s.setMyHandle);

  // Track the current valid handle value from HandleSetup
  const [validHandle, setValidHandle] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleValidChange = useCallback((handle: string | null) => {
    setValidHandle(handle);
  }, []);

  const handleNext = useCallback(async () => {
    if (!validHandle) {
      // No valid handle entered — advance without saving (same as skip)
      onNext();
      return;
    }

    setIsSaving(true);
    try {
      await setMyHandle(validHandle);
      onNext();
    } catch (err) {
      Alert.alert('Error', 'Failed to save handle. You can set it later in Settings.');
      onNext();
    } finally {
      setIsSaving(false);
    }
  }, [validHandle, setMyHandle, onNext]);

  return (
    <ScrollView
      style={s.scrollView}
      contentContainerStyle={s.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <Ionicons name="at-circle-outline" size={48} color={colors.accent} style={s.icon} />
      <Text style={s.title}>Choose Your Handle</Text>
      <Text style={s.subtitle}>Friends can find you by your unique handle</Text>

      <View style={s.inputContainer}>
        <HandleSetup
          currentHandle={null}
          onSave={setMyHandle}
          mode="step"
          onValidChange={handleValidChange}
        />
      </View>

      <View style={s.footer}>
        <Pressable
          style={[s.nextButton, (!validHandle || isSaving) && s.nextButtonMuted]}
          onPress={handleNext}
          disabled={isSaving}
        >
          <Text style={s.nextButtonText}>{isSaving ? 'Saving...' : 'Next'}</Text>
        </Pressable>
        <Pressable style={s.skipButton} onPress={onSkip} disabled={isSaving}>
          <Text style={s.skipButtonText}>Skip</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 300,
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
  subtitle: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 32,
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 16,
  },
  footer: {
    paddingBottom: 24,
  },
  nextButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextButtonMuted: {
    opacity: 0.5,
  },
  nextButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  skipButton: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '600',
  },
});
