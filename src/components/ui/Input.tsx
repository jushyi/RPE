import { View, Text, TextInput, StyleSheet, type TextInputProps } from 'react-native';
import { colors } from '@/constants/theme';

interface InputProps extends Omit<TextInputProps, 'style'> {
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
    <View style={s.container}>
      {label && (
        <Text style={s.label}>{label}</Text>
      )}
      <TextInput
        style={[s.input, error ? s.inputError : s.inputNormal]}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        secureTextEntry={secureTextEntry}
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
        {...rest}
      />
      {error && (
        <Text style={s.error}>{error}</Text>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 6,
    fontWeight: '500',
  },
  input: {
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  inputNormal: {
    borderColor: colors.surfaceElevated,
  },
  inputError: {
    borderColor: colors.error,
  },
  error: {
    color: colors.error,
    fontSize: 12,
    marginTop: 4,
  },
});
