import { Pressable, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '@/constants/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const containerStyle = [
    s.base,
    variant === 'primary' && s.primary,
    variant === 'secondary' && s.secondary,
    variant === 'ghost' && s.ghost,
    isDisabled && s.disabled,
  ];

  const textColor =
    variant === 'primary' ? colors.white :
    variant === 'ghost' ? colors.accent :
    colors.textPrimary;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={containerStyle}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? colors.white : colors.accent}
          size="small"
        />
      ) : (
        <Text style={[s.text, { color: textColor }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const s = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  primary: {
    backgroundColor: colors.accent,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceElevated,
  },
  ghost: {},
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: 'bold',
    fontSize: 16,
  },
});
