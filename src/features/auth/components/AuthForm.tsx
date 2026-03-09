import { useState } from 'react';
import { View, Text, Pressable, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ProfilePhotoPicker } from './ProfilePhotoPicker';
import { colors } from '@/constants/theme';

const authSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  displayName: z.string().optional(),
});

const signInSchema = authSchema;

const signUpSchema = authSchema.refine(
  (data) => data.displayName && data.displayName.length >= 2,
  { message: 'Display name must be at least 2 characters', path: ['displayName'] }
);

type AuthFormData = z.infer<typeof authSchema>;

interface AuthFormProps {
  onSignIn: (data: { email: string; password: string }) => Promise<void>;
  onSignUp: (data: {
    email: string;
    password: string;
    displayName: string;
    photoUri?: string;
  }) => Promise<void>;
  isOffline?: boolean;
}

export function AuthForm({ onSignIn, onSignUp, isOffline = false }: AuthFormProps) {
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const isSignUp = mode === 'signUp';

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<AuthFormData>({
    resolver: zodResolver(isSignUp ? signUpSchema : signInSchema) as any,
    defaultValues: {
      email: '',
      password: '',
      displayName: '',
    },
  });

  const displayNameValue = watch('displayName');

  const toggleMode = () => {
    setMode(mode === 'signIn' ? 'signUp' : 'signIn');
    setFormError(null);
    reset();
    setPhotoUri(null);
  };

  const onSubmit = async (data: AuthFormData) => {
    setFormError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        await onSignUp({
          email: data.email,
          password: data.password,
          displayName: data.displayName ?? '',
          photoUri: photoUri ?? undefined,
        });
      } else {
        await onSignIn({
          email: data.email,
          password: data.password,
        });
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setFormError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={s.flex1}
    >
      <ScrollView
        contentContainerStyle={s.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.header}>
          <Text style={s.title}>
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </Text>
          <Text style={s.subtitle}>
            {isSignUp
              ? 'Start tracking your gains'
              : 'Sign in to continue your journey'}
          </Text>
        </View>

        {isSignUp && isOffline && (
          <View style={[s.alertBox, { borderColor: colors.warning }]}>
            <Text style={[s.alertText, { color: colors.warning }]}>
              Connect to the internet to create your account
            </Text>
          </View>
        )}

        {formError && (
          <View style={[s.alertBox, { borderColor: colors.error }]}>
            <Text style={[s.alertText, { color: colors.error }]}>{formError}</Text>
          </View>
        )}

        {isSignUp && (
          <ProfilePhotoPicker
            onPhotoSelected={setPhotoUri}
            displayName={displayNameValue}
          />
        )}

        {isSignUp && (
          <Controller
            control={control}
            name="displayName"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Display Name"
                placeholder="Your name"
                value={value}
                onChangeText={onChange}
                error={errors.displayName?.message}
                autoCapitalize="words"
              />
            )}
          />
        )}

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Email"
              placeholder="you@example.com"
              value={value}
              onChangeText={onChange}
              error={errors.email?.message}
              keyboardType="email-address"
              autoComplete="email"
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Password"
              placeholder="At least 6 characters"
              value={value}
              onChangeText={onChange}
              error={errors.password?.message}
              secureTextEntry
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
            />
          )}
        />

        <View style={{ marginTop: 8 }}>
          <Button
            title={isSignUp ? 'Create Account' : 'Sign In'}
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            disabled={isSignUp && isOffline}
          />
        </View>

        <Pressable onPress={toggleMode} style={s.toggleBtn}>
          <Text style={s.toggleText}>
            {isSignUp
              ? 'Already have an account? '
              : "Don't have an account? "}
            <Text style={s.toggleAccent}>
              {isSignUp ? 'Sign in' : 'Sign up'}
            </Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flex1: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: { marginBottom: 32 },
  title: {
    color: colors.textPrimary,
    fontSize: 30,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
  },
  alertBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  alertText: {
    fontSize: 14,
    textAlign: 'center',
  },
  toggleBtn: {
    marginTop: 24,
    paddingVertical: 8,
  },
  toggleText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
  toggleAccent: {
    color: colors.accent,
    fontWeight: '600',
  },
});
