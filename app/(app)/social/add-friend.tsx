import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { colors } from '@/constants/theme';
import { useFriendshipStore } from '@/stores/friendshipStore';
import type { FriendProfile } from '@/features/social/types';

export default function AddFriendScreen() {
  const generateFriendInviteCode = useFriendshipStore((s) => s.generateFriendInviteCode);
  const redeemFriendInviteCode = useFriendshipStore((s) => s.redeemFriendInviteCode);
  const searchByHandle = useFriendshipStore((s) => s.searchByHandle);
  const sendFriendRequest = useFriendshipStore((s) => s.sendFriendRequest);

  // Invite code - generate side
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Invite code - enter side
  const [enteredCode, setEnteredCode] = useState('');
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemMessage, setRedeemMessage] = useState<{ text: string; success: boolean } | null>(null);

  // Handle search
  const [handleQuery, setHandleQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FriendProfile[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleGenerate = useCallback(async () => {
    setGenerateLoading(true);
    try {
      const code = await generateFriendInviteCode();
      setGeneratedCode(code);
    } finally {
      setGenerateLoading(false);
    }
  }, [generateFriendInviteCode]);

  const handleCopy = useCallback(async () => {
    if (!generatedCode) return;
    await Clipboard.setStringAsync(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [generatedCode]);

  const handleRedeem = useCallback(async () => {
    const code = enteredCode.trim().toUpperCase();
    if (code.length < 6) return;
    setRedeemLoading(true);
    setRedeemMessage(null);
    try {
      await redeemFriendInviteCode(code);
      setRedeemMessage({ text: 'Friend request sent!', success: true });
      setEnteredCode('');
    } catch {
      setRedeemMessage({ text: 'Invalid or expired code. Please try again.', success: false });
    } finally {
      setRedeemLoading(false);
    }
  }, [enteredCode, redeemFriendInviteCode]);

  const runSearch = useCallback(
    async (query: string) => {
      const cleaned = query.replace(/^@/, '').toLowerCase().trim();
      if (cleaned.length < 2) {
        setSearchResults([]);
        return;
      }
      setSearchLoading(true);
      try {
        const results = await searchByHandle(cleaned);
        setSearchResults(results);
      } finally {
        setSearchLoading(false);
      }
    },
    [searchByHandle]
  );

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      runSearch(handleQuery);
    }, 300);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [handleQuery, runSearch]);

  const handleSendRequest = useCallback(
    async (userId: string) => {
      await sendFriendRequest(userId);
      setSentIds((prev) => new Set(prev).add(userId));
    },
    [sendFriendRequest]
  );

  return (
    <>
      <Stack.Screen options={{ title: 'Add Friend' }} />
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets
      >
        {/* Section A: Invite Code */}
        <Text style={s.sectionTitle}>Invite Code</Text>
        <View style={s.card}>
          <Text style={s.label}>Generate a Code</Text>
          <Text style={s.description}>
            Generate a 6-character code and share it with a friend. Expires in 24 hours.
          </Text>
          {generatedCode ? (
            <View style={s.codeDisplay}>
              <Text style={s.codeText}>{generatedCode}</Text>
            </View>
          ) : null}
          <Pressable
            style={[s.btn, generateLoading && s.btnDisabled]}
            onPress={handleGenerate}
            disabled={generateLoading}
          >
            {generateLoading ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Text style={s.btnText}>{generatedCode ? 'Generate New Code' : 'Generate Code'}</Text>
            )}
          </Pressable>
          {generatedCode ? (
            <Pressable style={s.copyBtn} onPress={handleCopy}>
              <Ionicons
                name={copied ? 'checkmark-outline' : 'copy-outline'}
                size={16}
                color={colors.textPrimary}
              />
              <Text style={s.copyBtnText}>{copied ? 'Copied' : 'Copy Code'}</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={s.card}>
          <Text style={s.label}>Enter a Code</Text>
          <TextInput
            style={s.codeInput}
            value={enteredCode}
            onChangeText={(t) => {
              setEnteredCode(t.toUpperCase());
              setRedeemMessage(null);
            }}
            placeholder="ABC123"
            placeholderTextColor={colors.textMuted}
            maxLength={6}
            autoCapitalize="characters"
            autoCorrect={false}
          />
          {redeemMessage ? (
            <Text
              style={[
                s.feedbackText,
                redeemMessage.success ? s.feedbackSuccess : s.feedbackError,
              ]}
            >
              {redeemMessage.text}
            </Text>
          ) : null}
          <Pressable
            style={[s.btn, (redeemLoading || enteredCode.trim().length < 6) && s.btnDisabled]}
            onPress={handleRedeem}
            disabled={redeemLoading || enteredCode.trim().length < 6}
          >
            {redeemLoading ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Text style={s.btnText}>Connect</Text>
            )}
          </Pressable>
        </View>

        {/* Section B: Handle Search */}
        <Text style={[s.sectionTitle, s.sectionTitleSpaced]}>Search by Handle</Text>
        <View style={s.card}>
          <View style={s.searchRow}>
            <Text style={s.atPrefix}>@</Text>
            <TextInput
              style={s.searchInput}
              value={handleQuery}
              onChangeText={(t) => setHandleQuery(t.replace(/^@/, ''))}
              placeholder="username"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchLoading ? (
              <ActivityIndicator color={colors.accent} size="small" />
            ) : null}
          </View>
          {searchResults.length > 0 ? (
            <View style={s.resultsList}>
              {searchResults.map((profile) => {
                const sent = sentIds.has(profile.id);
                return (
                  <View key={profile.id} style={s.resultItem}>
                    <View style={s.resultInfo}>
                      <Text style={s.resultName} numberOfLines={1}>
                        {profile.display_name}
                      </Text>
                      <Text style={s.resultHandle}>@{profile.handle}</Text>
                    </View>
                    <Pressable
                      style={[s.addBtn, sent && s.addBtnSent]}
                      onPress={() => !sent && handleSendRequest(profile.id)}
                      disabled={sent}
                    >
                      <Text style={[s.addBtnText, sent && s.addBtnTextSent]}>
                        {sent ? 'Sent' : 'Add Friend'}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          ) : null}
          {!searchLoading && handleQuery.replace(/^@/, '').trim().length >= 2 && searchResults.length === 0 ? (
            <Text style={s.noResults}>No users found</Text>
          ) : null}
        </View>
      </ScrollView>
    </>
  );
}

const s = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  sectionTitleSpaced: {
    marginTop: 20,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 14,
    lineHeight: 18,
  },
  codeDisplay: {
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 12,
  },
  codeText: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.accent,
    letterSpacing: 8,
  },
  btn: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.white,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.surfaceElevated,
  },
  copyBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  codeInput: {
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: 6,
    marginBottom: 10,
  },
  feedbackText: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 10,
  },
  feedbackSuccess: {
    color: colors.success,
  },
  feedbackError: {
    color: colors.error,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 4,
  },
  atPrefix: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
  },
  resultsList: {
    marginTop: 12,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceElevated,
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  resultHandle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  addBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  addBtnSent: {
    backgroundColor: colors.surfaceElevated,
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.white,
  },
  addBtnTextSent: {
    color: colors.textMuted,
  },
  noResults: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 12,
  },
});
