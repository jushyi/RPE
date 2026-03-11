import { View, Text, Pressable, Alert, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import { useAuth } from '@/features/auth/hooks/useAuth';

interface AccountSectionProps {
  onExport: () => void;
  onDelete: () => void;
}

export function AccountSection({ onExport, onDelete }: AccountSectionProps) {
  const { signOut } = useAuth();

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
      ],
    );
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Account</Text>
      <View style={styles.card}>
        <Pressable style={styles.row} onPress={onExport}>
          <Ionicons name="download-outline" size={22} color={colors.textSecondary} style={styles.rowIcon} />
          <Text style={styles.rowLabel}>Export Data</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Pressable>

        <View style={styles.divider} />

        <Pressable style={styles.row} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={22} color={colors.textSecondary} style={styles.rowIcon} />
          <Text style={styles.rowLabel}>Sign Out</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Pressable>

        <View style={styles.divider} />

        <Pressable style={styles.row} onPress={onDelete}>
          <Ionicons name="trash-outline" size={22} color={colors.error} style={styles.rowIcon} />
          <Text style={[styles.rowLabel, styles.deleteLabel]}>Delete Account</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowIcon: {
    marginRight: 12,
  },
  rowLabel: {
    fontSize: 16,
    color: colors.textPrimary,
    flex: 1,
  },
  deleteLabel: {
    color: colors.error,
  },
  divider: {
    height: 1,
    backgroundColor: colors.surfaceElevated,
    marginHorizontal: 16,
  },
});
