import { useState } from 'react';
import { ScrollView, StyleSheet, Alert, Platform, Modal, View, Text, TextInput, Pressable } from 'react-native';
import { colors } from '@/constants/theme';
import { ProfileHeader } from '@/features/settings/components/ProfileHeader';
import { PreferencesSection } from '@/features/settings/components/PreferencesSection';
import { NotificationsSection } from '@/features/settings/components/NotificationsSection';
import { AccountSection } from '@/features/settings/components/AccountSection';
import { useDataExport } from '@/features/settings/hooks/useDataExport';
import { useDeleteAccount } from '@/features/settings/hooks/useDeleteAccount';

export default function SettingsTab() {
  const { exportData, isExporting } = useDataExport();
  const { scheduleDelete, isDeleting } = useDeleteAccount();
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [password, setPassword] = useState('');

  const handleExport = () => {
    exportData();
  };

  const showPasswordPrompt = () => {
    if (Platform.OS === 'ios') {
      Alert.prompt(
        'Confirm Password',
        'Enter your password to confirm account deletion.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: (pwd) => {
              if (pwd) handleScheduleDelete(pwd);
            },
          },
        ],
        'secure-text',
      );
    } else {
      // Android: use a modal with TextInput
      setPassword('');
      setPasswordModalVisible(true);
    }
  };

  const handleScheduleDelete = async (pwd: string) => {
    try {
      await scheduleDelete(pwd);
      // User is signed out automatically by scheduleDelete
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to delete account. Please try again.');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Account',
      'This will schedule your account for deletion after a 7-day grace period. You can sign back in to cancel.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export Data First',
          onPress: async () => {
            await exportData();
            // Re-show delete confirmation after export
            handleDelete();
          },
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: showPasswordPrompt,
        },
      ],
    );
  };

  const handleAndroidPasswordSubmit = () => {
    setPasswordModalVisible(false);
    if (password) {
      handleScheduleDelete(password);
    }
  };

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <ProfileHeader />
        <PreferencesSection />
        <NotificationsSection />
        <AccountSection
          onExport={handleExport}
          onDelete={handleDelete}
          isExporting={isExporting}
        />
      </ScrollView>

      {/* Android password input modal */}
      <Modal
        visible={passwordModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPasswordModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setPasswordModalVisible(false)}>
          <Pressable style={styles.modalContent} onPress={() => {}}>
            <Text style={styles.modalTitle}>Confirm Password</Text>
            <Text style={styles.modalMessage}>
              Enter your password to confirm account deletion.
            </Text>
            <TextInput
              style={styles.modalInput}
              secureTextEntry
              placeholder="Password"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              autoFocus
              onSubmitEditing={handleAndroidPasswordSubmit}
            />
            <View style={styles.modalButtons}>
              <Pressable
                style={styles.modalButton}
                onPress={() => setPasswordModalVisible(false)}
              >
                <Text style={styles.modalButtonCancel}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.modalButton}
                onPress={handleAndroidPasswordSubmit}
                disabled={isDeleting}
              >
                <Text style={styles.modalButtonDelete}>Delete</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 20,
    width: '85%',
    maxWidth: 340,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  modalInput: {
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.surfaceElevated,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  modalButtonCancel: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  modalButtonDelete: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error,
  },
});
