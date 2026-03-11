import { ScrollView, StyleSheet } from 'react-native';
import { colors } from '@/constants/theme';
import { ProfileHeader } from '@/features/settings/components/ProfileHeader';
import { PreferencesSection } from '@/features/settings/components/PreferencesSection';
import { NotificationsSection } from '@/features/settings/components/NotificationsSection';
import { AccountSection } from '@/features/settings/components/AccountSection';

export default function SettingsTab() {
  const handleExport = () => {
    console.log('Export data - stub');
  };

  const handleDelete = () => {
    console.log('Delete account - stub');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ProfileHeader />
      <PreferencesSection />
      <NotificationsSection />
      <AccountSection onExport={handleExport} onDelete={handleDelete} />
    </ScrollView>
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
});
