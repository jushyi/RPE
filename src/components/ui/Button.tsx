import { Pressable, Text, ActivityIndicator, View } from 'react-native';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
}

const variantStyles: Record<ButtonVariant, { container: string; text: string }> = {
  primary: {
    container: 'bg-accent rounded-xl py-4 px-6',
    text: 'text-white font-bold text-base',
  },
  secondary: {
    container: 'bg-surface border border-surface-elevated rounded-xl py-4 px-6',
    text: 'text-text-primary font-bold text-base',
  },
  ghost: {
    container: 'py-4 px-6',
    text: 'text-accent font-semibold text-base',
  },
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
}: ButtonProps) {
  const styles = variantStyles[variant];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={`${styles.container} items-center justify-center flex-row ${
        isDisabled ? 'opacity-50' : 'active:opacity-80'
      }`}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? '#ffffff' : '#3b82f6'}
          size="small"
        />
      ) : (
        <Text className={styles.text}>{title}</Text>
      )}
    </Pressable>
  );
}
