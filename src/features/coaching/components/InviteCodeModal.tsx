import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
let Clipboard: typeof import('expo-clipboard') | null = null;
try {
  Clipboard = require('expo-clipboard');
} catch {
  // Native module not available (e.g., Expo Go)
}
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import { useCoaching } from '@/features/coaching/hooks/useCoaching';
import type { InviteCode } from '@/features/coaching/types';

interface InviteCodeModalProps {
  visible: boolean;
  onClose: () => void;
}

type TabMode = 'generate' | 'enter';

export function InviteCodeModal({ visible, onClose }: InviteCodeModalProps) {
  const { generateCode, redeemCode, getActiveInviteCode } = useCoaching();
  const [tab, setTab] = useState<TabMode>('generate');
  const [activeCode, setActiveCode] = useState<InviteCode | null>(null);
  const [loading, setLoading] = useState(false);
  const [enteredCode, setEnteredCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);

  // Slide-up animation for the bottom sheet content
  const translateY = useSharedValue(300);

  useEffect(() => {
    translateY.value = visible
      ? withTiming(0, { duration: 300 })
      : withTiming(300, { duration: 200 });
  }, [visible]);

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  // Check for existing active code on open
  useEffect(() => {
    if (visible) {
      checkExistingCode();
      setEnteredCode('');
      setErrorMsg('');
      setCopied(false);
    }
  }, [visible]);

  const checkExistingCode = async () => {
    const existing = await getActiveInviteCode();
    setActiveCode(existing);
  };

  const handleGenerate = useCallback(async () => {
    setLoading(true);
    try {
      const code = await generateCode();
      const existing = await getActiveInviteCode();
      setActiveCode(existing);
    } catch (err) {
      Alert.alert('Error', 'Failed to generate invite code. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [generateCode, getActiveInviteCode]);

  const handleCopy = useCallback(async () => {
    if (activeCode) {
      await Clipboard?.setStringAsync(activeCode.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [activeCode]);

  const handleRedeem = useCallback(async () => {
    if (!enteredCode.trim()) return;
    setLoading(true);
    setErrorMsg('');
    try {
      await redeemCode(enteredCode.trim());
      Alert.alert('Connected', 'You are now connected with your coach.');
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message ?? 'Invalid, expired, or already-redeemed code');
    } finally {
      setLoading(false);
    }
  }, [enteredCode, redeemCode, onClose]);

  const getTimeRemaining = (): string => {
    if (!activeCode) return '';
    const expiresAt = new Date(activeCode.expires_at).getTime();
    const now = Date.now();
    const diff = expiresAt - now;
    if (diff <= 0) return 'Expired';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m remaining`;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={s.overlay} onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={s.keyboardAvoid}
        >
          <Animated.View
            style={[s.modal, sheetAnimatedStyle]}
            onStartShouldSetResponder={() => true}
          >
            {/* Header */}
            <View style={s.header}>
              <Text style={s.title}>Coaching Connection</Text>
              <Pressable onPress={onClose} hitSlop={12}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>

            {/* Tab Selector */}
            <View style={s.tabs}>
              <Pressable
                style={[s.tab, tab === 'generate' && s.tabActive]}
                onPress={() => setTab('generate')}
              >
                <Text style={[s.tabText, tab === 'generate' && s.tabTextActive]}>
                  Generate Code
                </Text>
              </Pressable>
              <Pressable
                style={[s.tab, tab === 'enter' && s.tabActive]}
                onPress={() => setTab('enter')}
              >
                <Text style={[s.tabText, tab === 'enter' && s.tabTextActive]}>
                  Enter Code
                </Text>
              </Pressable>
            </View>

            {/* Content */}
            {tab === 'generate' ? (
              <View style={s.content}>
                {activeCode ? (
                  <>
                    <Text style={s.label}>Your Invite Code</Text>
                    <View style={s.codeDisplay}>
                      <Text style={s.codeText}>{activeCode.code}</Text>
                    </View>
                    <Text style={s.expiry}>{getTimeRemaining()}</Text>
                    <Pressable style={s.copyBtn} onPress={handleCopy}>
                      <Ionicons
                        name={copied ? 'checkmark-outline' : 'copy-outline'}
                        size={18}
                        color={colors.white}
                      />
                      <Text style={s.copyBtnText}>
                        {copied ? 'Copied' : 'Copy Code'}
                      </Text>
                    </Pressable>
                  </>
                ) : (
                  <>
                    <Text style={s.description}>
                      Generate an invite code to share with someone you want to coach. The code expires in 24 hours.
                    </Text>
                  </>
                )}
                <Pressable
                  style={[s.actionBtn, loading && s.actionBtnDisabled]}
                  onPress={handleGenerate}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.white} size="small" />
                  ) : (
                    <Text style={s.actionBtnText}>
                      {activeCode ? 'Generate New Code' : 'Generate Code'}
                    </Text>
                  )}
                </Pressable>
              </View>
            ) : (
              <View style={s.content}>
                <Text style={s.label}>Enter Invite Code</Text>
                <Text style={s.description}>
                  Enter the 6-character code from your coach to connect.
                </Text>
                <TextInput
                  style={s.input}
                  value={enteredCode}
                  onChangeText={(text) => {
                    setEnteredCode(text.toUpperCase());
                    setErrorMsg('');
                  }}
                  placeholder="ABC123"
                  placeholderTextColor={colors.textMuted}
                  maxLength={6}
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
                {errorMsg ? <Text style={s.errorText}>{errorMsg}</Text> : null}
                <Pressable
                  style={[
                    s.actionBtn,
                    (loading || enteredCode.trim().length < 6) && s.actionBtnDisabled,
                  ]}
                  onPress={handleRedeem}
                  disabled={loading || enteredCode.trim().length < 6}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.white} size="small" />
                  ) : (
                    <Text style={s.actionBtnText}>Connect</Text>
                  )}
                </Pressable>
              </View>
            )}
          </Animated.View>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  keyboardAvoid: {
    width: '100%',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 3,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: colors.accent,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.white,
  },
  content: {
    paddingHorizontal: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 16,
    lineHeight: 20,
  },
  codeDisplay: {
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingVertical: 20,
    alignItems: 'center',
    marginBottom: 8,
  },
  codeText: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.accent,
    letterSpacing: 8,
  },
  expiry: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 12,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 8,
    paddingVertical: 10,
    marginBottom: 16,
  },
  copyBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: 6,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 13,
    color: colors.error,
    textAlign: 'center',
    marginBottom: 12,
  },
  actionBtn: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  actionBtnDisabled: {
    opacity: 0.5,
  },
  actionBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
});
