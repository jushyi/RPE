import { View, StyleSheet } from 'react-native';
import { colors } from '@/constants/theme';

interface StepDotsProps {
  total: number;
  current: number;
}

/**
 * Horizontal row of step progress dots.
 * Active dot uses accent color; inactive dots use surface color.
 */
export function StepDots({ total, current }: StepDotsProps) {
  return (
    <View style={s.container}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={[s.dot, i === current ? s.dotActive : s.dotInactive]}
        />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: colors.accent,
  },
  dotInactive: {
    backgroundColor: colors.surface,
  },
});
