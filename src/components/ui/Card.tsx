import { View, Text, type ViewProps } from 'react-native';

interface CardProps extends Omit<ViewProps, 'className'> {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Reusable dark-themed card component.
 * Surface background with rounded corners and subtle border.
 */
export function Card({ title, children, className = '', ...rest }: CardProps) {
  return (
    <View
      className={`bg-surface rounded-2xl p-4 border border-surface-elevated ${className}`}
      {...rest}
    >
      {title && (
        <Text className="text-text-primary text-lg font-bold mb-3">
          {title}
        </Text>
      )}
      {children}
    </View>
  );
}
