import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ProfileHeader } from './ProfileHeader';
import { HandleSetup } from '@/features/social/components/HandleSetup';
import { useFriendshipStore } from '@/stores/friendshipStore';
import { colors } from '@/constants/theme';

/**
 * Settings profile section.
 * Renders the user's avatar + display name (via ProfileHeader) and a handle
 * setup/edit widget below it.
 */
export function ProfileSection() {
  const myHandle = useFriendshipStore((s) => s.myHandle);
  const fetchMyHandle = useFriendshipStore((s) => s.fetchMyHandle);
  const setMyHandle = useFriendshipStore((s) => s.setMyHandle);

  useEffect(() => {
    fetchMyHandle();
  }, [fetchMyHandle]);

  return (
    <View style={s.container}>
      <ProfileHeader />
      <View style={s.handleRow}>
        <Text style={s.handleLabel}>Handle</Text>
        <View style={s.handleInput}>
          <HandleSetup
            currentHandle={myHandle}
            onSave={setMyHandle}
            mode="inline"
          />
        </View>
      </View>
      {!myHandle && (
        <Text style={s.nudgeText}>
          Set a handle so friends can find you by @username.
        </Text>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  handleRow: {
    marginBottom: 8,
  },
  handleLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  handleInput: {
    // width is constrained by parent padding
  },
  nudgeText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
});
