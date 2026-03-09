import { View, Text, StyleSheet, type ViewProps } from 'react-native';
import { colors } from '@/constants/theme';

interface CardProps extends Omit<ViewProps, 'style'> {
  title?: string;
  children: React.ReactNode;
}

export function Card({ title, children, ...rest }: CardProps) {
  return (
    <View style={s.card} {...rest}>
      {title && <Text style={s.title}>{title}</Text>}
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.surfaceElevated,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
});
