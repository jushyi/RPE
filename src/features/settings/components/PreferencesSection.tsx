import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';

function SegmentedToggle<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={segStyles.container}>
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[segStyles.button, selected && segStyles.buttonSelected]}
          >
            <Text style={[segStyles.label, selected && segStyles.labelSelected]}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const segStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceElevated,
    borderRadius: 8,
    overflow: 'hidden',
  },
  button: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  buttonSelected: {
    backgroundColor: colors.accent,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textMuted,
  },
  labelSelected: {
    color: colors.white,
  },
});

export function PreferencesSection() {
  const preferredUnit = useAuthStore((s) => s.preferredUnit);
  const setPreferredUnit = useAuthStore((s) => s.setPreferredUnit);
  const preferredMeasurementUnit = useAuthStore((s) => s.preferredMeasurementUnit);
  const setPreferredMeasurementUnit = useAuthStore((s) => s.setPreferredMeasurementUnit);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Preferences</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Default weight unit</Text>
          <SegmentedToggle
            options={[
              { label: 'lbs', value: 'lbs' as const },
              { label: 'kg', value: 'kg' as const },
            ]}
            value={preferredUnit}
            onChange={setPreferredUnit}
          />
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Default measurement unit</Text>
          <SegmentedToggle
            options={[
              { label: 'in', value: 'in' as const },
              { label: 'cm', value: 'cm' as const },
            ]}
            value={preferredMeasurementUnit}
            onChange={setPreferredMeasurementUnit}
          />
        </View>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowLabel: {
    fontSize: 16,
    color: colors.textPrimary,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: colors.surfaceElevated,
    marginHorizontal: 16,
  },
});
