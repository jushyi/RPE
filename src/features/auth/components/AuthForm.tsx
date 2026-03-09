import { useState } from 'react';
import { View, Text, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ProfilePhotoPicker } from './ProfilePhotoPicker';

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
      className="flex-1"
    >
      <ScrollView
        contentContainerClassName="flex-grow justify-center px-6 py-8"
        keyboardShouldPersistTaps="handled"
      >
        <View className="mb-8">
          <Text className="text-text-primary text-3xl font-bold text-center">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </Text>
          <Text className="text-text-secondary text-base text-center mt-2">
            {isSignUp
              ? 'Start tracking your gains'
              : 'Sign in to continue your journey'}
          </Text>
        </View>

        {isSignUp && isOffline && (
          <View className="bg-warning/10 border border-warning rounded-xl p-4 mb-6">
            <Text className="text-warning text-sm font-medium text-center">
              Connect to the internet to create your account
            </Text>
          </View>
        )}

        {formError && (
          <View className="bg-error/10 border border-error rounded-xl p-4 mb-6">
            <Text className="text-error text-sm text-center">{formError}</Text>
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

        <View className="mt-2">
          <Button
            title={isSignUp ? 'Create Account' : 'Sign In'}
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            disabled={isSignUp && isOffline}
          />
        </View>

        <Pressable onPress={toggleMode} className="mt-6 py-2">
          <Text className="text-text-secondary text-sm text-center">
            {isSignUp
              ? 'Already have an account? '
              : "Don't have an account? "}
            <Text className="text-accent font-semibold">
              {isSignUp ? 'Sign in' : 'Sign up'}
            </Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
