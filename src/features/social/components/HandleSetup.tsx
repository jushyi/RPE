import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase/client';
import { validateHandle } from '@/features/social/utils/handleValidation';
import { colors } from '@/constants/theme';

interface HandleSetupProps {
  /**
   * The user's current handle, or null if they haven't set one yet.
   */
  currentHandle: string | null;
  /**
   * Called when the user confirms their chosen handle.
   * The caller is responsible for persisting the handle via setMyHandle.
   */
  onSave: (handle: string) => Promise<void>;
  /**
   * 'inline' — shown inside the Settings screen with a Save button.
   * 'step'   — shown in onboarding; save is triggered externally via ref or direct call.
   */
  mode: 'inline' | 'step';
  /**
   * Optional: called whenever the valid state changes.
   * In 'step' mode the parent can use this to enable/disable the Next button
   * and to know the current valid handle value to pass to setMyHandle.
   * validHandle is non-null only when format is valid AND uniqueness check passed.
   */
  onValidChange?: (validHandle: string | null) => void;
}

/**
 * Reusable handle setup / edit component.
 *
 * - Auto-lowercases input
 * - Real-time format validation via validateHandle()
 * - Debounced uniqueness check (500ms) against Supabase profiles table
 * - Visual feedback: error text in red, green checkmark for available handle
 * - 'inline' mode: shows Save button and Edit toggle when a handle already exists
 * - 'step' mode: no Save button — caller calls onSave when ready (e.g., "Next" button)
 */
export function HandleSetup({ currentHandle, onSave, mode, onValidChange }: HandleSetupProps) {
  const [isEditing, setIsEditing] = useState(mode === 'step' || !currentHandle);
  const [inputValue, setInputValue] = useState(currentHandle ?? '');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isCheckingUniqueness, setIsCheckingUniqueness] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // When currentHandle changes externally, sync input if not actively editing
  useEffect(() => {
    if (!isEditing) {
      setInputValue(currentHandle ?? '');
    }
  }, [currentHandle, isEditing]);

  const checkUniqueness = useCallback(async (handle: string) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const query = (supabase as any)
        .from('profiles')
        .select('id')
        .eq('handle', handle);

      // Exclude self so the user can "re-save" their existing handle
      if (session?.user) {
        query.neq('id', session.user.id);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        console.warn('Uniqueness check failed:', error.message);
        setIsAvailable(null);
        onValidChange?.(null);
      } else {
        const available = data === null; // null means no other user has that handle
        setIsAvailable(available);
        onValidChange?.(available ? handle : null);
      }
    } catch (err) {
      console.warn('Uniqueness check error:', err);
      setIsAvailable(null);
      onValidChange?.(null);
    } finally {
      setIsCheckingUniqueness(false);
    }
  }, [onValidChange]);

  const handleInputChange = useCallback(
    (text: string) => {
      const lower = text.toLowerCase();
      setInputValue(lower);

      // Clear previous uniqueness state
      setIsAvailable(null);

      const error = validateHandle(lower);
      setValidationError(error);

      // Only check uniqueness when format is valid
      if (!error && lower.length >= 3) {
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        setIsCheckingUniqueness(true);
        onValidChange?.(null); // not yet confirmed available
        debounceTimer.current = setTimeout(() => {
          checkUniqueness(lower);
        }, 500);
      } else {
        setIsCheckingUniqueness(false);
        onValidChange?.(null);
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
      }
    },
    [checkUniqueness, onValidChange]
  );

  const handleSave = useCallback(async () => {
    const error = validateHandle(inputValue);
    if (error) {
      setValidationError(error);
      return;
    }
    if (!isAvailable) return;

    setIsSaving(true);
    try {
      await onSave(inputValue);
      if (mode === 'inline') {
        setIsEditing(false);
      }
    } catch (err) {
      console.warn('Handle save failed:', err);
    } finally {
      setIsSaving(false);
    }
  }, [inputValue, isAvailable, onSave, mode]);

  // In step mode, expose handleSave so parent can call it
  // Parent can simply call onSave directly with the current input value;
  // HandleSetup also provides a stable isValid for enabling/disabling the parent's Next button.
  // We expose it via the component's visible affordances.

  // --- Inline display mode: current handle is set, not editing ---
  if (mode === 'inline' && !isEditing && currentHandle) {
    return (
      <View style={s.row}>
        <View style={s.handleDisplay}>
          <Text style={s.atSymbol}>@</Text>
          <Text style={s.handleText}>{currentHandle}</Text>
        </View>
        <Pressable onPress={() => setIsEditing(true)} style={s.editButton}>
          <Ionicons name="pencil-outline" size={16} color={colors.accent} />
          <Text style={s.editButtonText}>Edit</Text>
        </Pressable>
      </View>
    );
  }

  // --- Edit / entry mode ---
  const formatValid = !validationError && inputValue.length >= 3;
  const canSave = formatValid && isAvailable === true && !isCheckingUniqueness;

  return (
    <View style={s.container}>
      <View style={s.inputRow}>
        <View style={s.inputWrapper}>
          <Text style={s.atPrefix}>@</Text>
          <TextInput
            style={s.input}
            value={inputValue}
            onChangeText={handleInputChange}
            placeholder="yourhandle"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
            maxLength={20}
          />
          {isCheckingUniqueness && (
            <ActivityIndicator size="small" color={colors.textMuted} style={s.statusIcon} />
          )}
          {!isCheckingUniqueness && formatValid && isAvailable === true && (
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={colors.success}
              style={s.statusIcon}
            />
          )}
          {!isCheckingUniqueness && formatValid && isAvailable === false && (
            <Ionicons
              name="close-circle"
              size={20}
              color={colors.error}
              style={s.statusIcon}
            />
          )}
        </View>

        {mode === 'inline' && (
          <View style={s.inlineButtons}>
            <Pressable
              style={[s.saveButton, !canSave && s.saveButtonDisabled]}
              onPress={handleSave}
              disabled={!canSave || isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={s.saveButtonText}>Save</Text>
              )}
            </Pressable>
            {currentHandle && (
              <Pressable
                onPress={() => {
                  setIsEditing(false);
                  setInputValue(currentHandle);
                  setValidationError(null);
                  setIsAvailable(null);
                }}
                style={s.cancelButton}
              >
                <Text style={s.cancelButtonText}>Cancel</Text>
              </Pressable>
            )}
          </View>
        )}
      </View>

      {/* Validation / availability feedback */}
      {validationError && inputValue.length > 0 && (
        <Text style={s.errorText}>{validationError}</Text>
      )}
      {!validationError && formatValid && isAvailable === false && (
        <Text style={s.errorText}>Handle is already taken</Text>
      )}
      {!validationError && formatValid && isAvailable === true && (
        <Text style={s.successText}>Handle is available</Text>
      )}

      {/* Step mode: expose current validity for parent's Next button */}
      {mode === 'step' && (
        <View style={s.stepHint}>
          <Text style={s.hintText}>
            {'3-20 characters, lowercase letters, numbers and underscores only. Must start with a letter.'}
          </Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  handleDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  atSymbol: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: '600',
    marginRight: 2,
  },
  handleText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '500',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  editButtonText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.surfaceElevated,
    paddingHorizontal: 12,
    height: 48,
  },
  atPrefix: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: '600',
    marginRight: 4,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 16,
    height: '100%',
  },
  statusIcon: {
    marginLeft: 8,
  },
  inlineButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  saveButton: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 56,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  cancelButtonText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    marginTop: 6,
    marginLeft: 2,
  },
  successText: {
    color: colors.success,
    fontSize: 13,
    marginTop: 6,
    marginLeft: 2,
  },
  stepHint: {
    marginTop: 10,
  },
  hintText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
});
