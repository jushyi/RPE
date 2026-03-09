import { View, Text, TextInput, type TextInputProps } from 'react-native';

interface InputProps extends Omit<TextInputProps, 'className'> {
  label?: string;
  error?: string;
}

export function Input({
  label,
  error,
  placeholder,
  secureTextEntry,
  value,
  onChangeText,
  ...rest
}: InputProps) {
  return (
    <View className="mb-4">
      {label && (
        <Text className="text-text-secondary text-sm mb-1.5 font-medium">
          {label}
        </Text>
      )}
      <TextInput
        className={`bg-surface text-text-primary text-base px-4 py-3.5 rounded-xl ${
          error ? 'border border-error' : 'border border-surface-elevated'
        }`}
        placeholder={placeholder}
        placeholderTextColor="#737373"
        secureTextEntry={secureTextEntry}
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
        {...rest}
      />
      {error && (
        <Text className="text-error text-xs mt-1">{error}</Text>
      )}
    </View>
  );
}
