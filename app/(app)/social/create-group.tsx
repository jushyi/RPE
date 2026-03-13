import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import { useFriendshipStore } from '@/stores/friendshipStore';
import { useGroups } from '@/features/social/hooks/useGroups';
import type { FriendProfile } from '@/features/social/types';

export default function CreateGroupScreen() {
  const router = useRouter();
  const friends = useFriendshipStore((s) => s.friends);
  const { createGroup } = useGroups();

  const [groupName, setGroupName] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);

  const toggleFriend = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleCreate = useCallback(async () => {
    const trimmed = groupName.trim();
    if (!trimmed) {
      Alert.alert('Name required', 'Please enter a group name.');
      return;
    }
    if (trimmed.length > 50) {
      Alert.alert('Name too long', 'Group name must be 50 characters or less.');
      return;
    }

    setCreating(true);
    try {
      const result = await createGroup(trimmed, Array.from(selectedIds));
      if (result) {
        router.back();
      } else {
        Alert.alert('Error', 'Failed to create group. Please try again.');
      }
    } finally {
      setCreating(false);
    }
  }, [groupName, selectedIds, createGroup, router]);

  const renderFriend = useCallback(
    ({ item }: { item: FriendProfile }) => {
      const isSelected = selectedIds.has(item.id);
      const initial = (item.display_name ?? 'U').charAt(0).toUpperCase();

      return (
        <Pressable
          style={[s.friendRow, isSelected && s.friendRowSelected]}
          onPress={() => toggleFriend(item.id)}
        >
          {item.avatar_url ? (
            <Image source={{ uri: item.avatar_url }} style={s.avatar} />
          ) : (
            <View style={s.avatarFallback}>
              <Text style={s.avatarText}>{initial}</Text>
            </View>
          )}
          <View style={s.friendInfo}>
            <Text style={s.friendName} numberOfLines={1}>
              {item.display_name}
            </Text>
            {item.handle ? (
              <Text style={s.friendHandle} numberOfLines={1}>
                @{item.handle}
              </Text>
            ) : null}
          </View>
          <View style={[s.checkbox, isSelected && s.checkboxSelected]}>
            {isSelected ? (
              <Ionicons name="checkmark" size={16} color={colors.white} />
            ) : null}
          </View>
        </Pressable>
      );
    },
    [selectedIds, toggleFriend]
  );

  const isValid = groupName.trim().length > 0 && groupName.trim().length <= 50;

  return (
    <SafeAreaView style={s.safeArea} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Create Group',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.textPrimary,
          headerTitleStyle: { color: colors.textPrimary, fontWeight: '700' },
          headerRight: () => (
            <Pressable
              onPress={handleCreate}
              disabled={!isValid || creating}
              style={s.createBtn}
            >
              {creating ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : (
                <Text
                  style={[s.createBtnText, (!isValid || creating) && s.createBtnDisabled]}
                >
                  Create
                </Text>
              )}
            </Pressable>
          ),
        }}
      />

      <View style={s.content}>
        {/* Group name input */}
        <View style={s.inputSection}>
          <Text style={s.label}>Group Name</Text>
          <TextInput
            style={s.input}
            value={groupName}
            onChangeText={setGroupName}
            placeholder="e.g. Gym Squad"
            placeholderTextColor={colors.textMuted}
            maxLength={50}
            returnKeyType="done"
            autoFocus
          />
          <Text style={s.charCount}>{groupName.length}/50</Text>
        </View>

        {/* Friend picker */}
        <View style={s.friendsSection}>
          <Text style={s.label}>
            Add Friends
            {selectedIds.size > 0 ? (
              <Text style={s.selectedCount}> ({selectedIds.size} selected)</Text>
            ) : null}
          </Text>
        </View>

        {friends.length === 0 ? (
          <View style={s.emptyFriends}>
            <Text style={s.emptyText}>
              No friends yet. Add friends first to include them in a group.
            </Text>
          </View>
        ) : (
          <FlatList
            data={friends}
            keyExtractor={(item) => item.id}
            renderItem={renderFriend}
            contentContainerStyle={s.friendList}
            keyboardShouldPersistTaps="handled"
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  inputSection: {
    marginTop: 16,
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.surfaceElevated,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.textPrimary,
  },
  charCount: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'right',
    marginTop: 4,
  },
  friendsSection: {
    marginBottom: 8,
  },
  selectedCount: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.accent,
    textTransform: 'none',
  },
  friendList: {
    paddingBottom: 24,
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.surfaceElevated,
  },
  friendRowSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accent + '11',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent + '22',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.accent,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  friendHandle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  emptyFriends: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  createBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  createBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.accent,
  },
  createBtnDisabled: {
    color: colors.textMuted,
  },
});
