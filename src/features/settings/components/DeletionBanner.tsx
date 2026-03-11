import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import { useDeleteAccount } from '@/features/settings/hooks/useDeleteAccount';

export function DeletionBanner() {
  const { deletionScheduledAt, cancelDelete, isDeleting } = useDeleteAccount();

  if (!deletionScheduledAt) return null;

  const deletionDate = new Date(deletionScheduledAt);
  const formattedDate = deletionDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const handleCancel = async () => {
    try {
      await cancelDelete();
    } catch {
      // Error handled silently; user can retry
    }
  };

  return (
    <Pressable
      style={styles.container}
      onPress={handleCancel}
      disabled={isDeleting}
    >
      <Ionicons name="warning-outline" size={20} color={colors.error} style={styles.icon} />
      <Text style={styles.text} numberOfLines={2}>
        Your account is scheduled for deletion on {formattedDate}. Tap to cancel.
      </Text>
      <Pressable onPress={handleCancel} disabled={isDeleting} hitSlop={8}>
        <Ionicons name="close-circle-outline" size={22} color={colors.error} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  icon: {
    marginRight: 10,
  },
  text: {
    flex: 1,
    color: colors.error,
    fontSize: 13,
    lineHeight: 18,
  },
});
