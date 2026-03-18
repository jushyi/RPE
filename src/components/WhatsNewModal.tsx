import { Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';

interface WhatsNewModalProps {
  visible: boolean;
  title: string;
  items: string[];
  onDismiss: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function WhatsNewModal({ visible, title, items, onDismiss }: WhatsNewModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={styles.modal}>
          <View style={styles.iconContainer}>
            <Ionicons name="sparkles-outline" size={36} color={colors.accent} />
          </View>

          <Text style={styles.title}>{title}</Text>

          <View style={styles.items}>
            {items.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <Text style={styles.bullet}>{'\u2022'}</Text>
                <Text style={styles.itemText}>{item}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.button} onPress={onDismiss} activeOpacity={0.8}>
            <Text style={styles.buttonText}>Got it</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: Math.min(SCREEN_WIDTH * 0.88, 380),
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 20,
  },
  items: {
    alignSelf: 'stretch',
    marginBottom: 24,
  },
  itemRow: {
    flexDirection: 'row',
    marginBottom: 10,
    paddingRight: 8,
  },
  bullet: {
    fontSize: 14,
    color: colors.accent,
    marginRight: 10,
    marginTop: 1,
  },
  itemText: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  button: {
    alignSelf: 'stretch',
    backgroundColor: colors.accent,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
});
