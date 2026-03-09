import { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, Image, StyleSheet, Pressable, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { usePRBaselines } from '@/features/auth/hooks/usePRBaselines';
import { supabase } from '@/lib/supabase/client';
import { colors } from '@/constants/theme';
import type { PRBaseline } from '@/lib/supabase/types/database';

function TappableAvatar({
  displayName,
  avatarUrl,
  onPhotoChanged,
}: {
  displayName: string;
  avatarUrl: string | null;
  onPhotoChanged: (uri: string) => void;
}) {
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handlePress = () => {
    Alert.alert('Profile Photo', 'Choose a photo source', [
      { text: 'Take Photo', onPress: () => pickPhoto('camera') },
      { text: 'Choose from Gallery', onPress: () => pickPhoto('gallery') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const pickPhoto = async (source: 'camera' | 'gallery') => {
    if (source === 'camera') {
      const { granted } = await ImagePicker.requestCameraPermissionsAsync();
      if (!granted) { Alert.alert('Permission Required', 'Camera access is needed.'); return; }
      const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 });
      if (!result.canceled && result.assets[0]) onPhotoChanged(result.assets[0].uri);
    } else {
      const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!granted) { Alert.alert('Permission Required', 'Gallery access is needed.'); return; }
      const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 });
      if (!result.canceled && result.assets[0]) onPhotoChanged(result.assets[0].uri);
    }
  };

  return (
    <Pressable onPress={handlePress} style={{ opacity: 1 }}>
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={ds.avatarImg} />
      ) : (
        <View style={ds.avatar}>
          <Text style={ds.avatarText}>{initials || '?'}</Text>
        </View>
      )}
    </Pressable>
  );
}

function PRCard({ baselines }: { baselines: PRBaseline[] }) {
  const router = useRouter();

  if (baselines.length === 0) {
    return (
      <Card title="Personal Records">
        <Text style={ds.cardDesc}>Set your starting PRs to track progress</Text>
        <View style={{ marginTop: 12 }}>
          <Button
            title="Set PRs"
            onPress={() => router.push('/(app)/onboarding/pr-baseline')}
            variant="secondary"
          />
        </View>
      </Card>
    );
  }

  const liftLabels: Record<string, string> = {
    bench_press: 'Bench Press',
    squat: 'Squat',
    deadlift: 'Deadlift',
  };

  const handleEdit = () => {
    router.push({
      pathname: '/(app)/onboarding/pr-baseline',
      params: {
        mode: 'edit',
        baselines: JSON.stringify(baselines.map((b) => ({
          exercise_name: b.exercise_name,
          weight: b.weight,
          unit: b.unit,
        }))),
      },
    });
  };

  return (
    <Pressable
      onPress={handleEdit}
      style={({ pressed }) => [pressed && { opacity: 0.8 }]}
      android_ripple={{ color: colors.surfaceElevated }}
    >
      <Card title="Personal Records">
        <View style={ds.editHintRow}>
          <Text style={ds.editHint}>Edit &gt;</Text>
        </View>
        {baselines.map((b) => (
          <View key={b.exercise_name} style={ds.prRow}>
            <Text style={ds.prLabel}>{liftLabels[b.exercise_name] ?? b.exercise_name}</Text>
            <Text style={ds.prValue}>{b.weight} {b.unit}</Text>
          </View>
        ))}
      </Card>
    </Pressable>
  );
}

export default function DashboardScreen() {
  const { signOut, user } = useAuth();
  const { getPRBaselines } = usePRBaselines();
  const [baselines, setBaselines] = useState<PRBaseline[]>([]);
  const [signingOut, setSigningOut] = useState(false);

  const displayName =
    user?.user_metadata?.display_name ?? user?.email?.split('@')[0] ?? 'Athlete';

  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    user?.user_metadata?.avatar_url ?? null
  );

  // Sync avatar with auth user metadata on session refresh / reload
  useEffect(() => {
    const url = user?.user_metadata?.avatar_url ?? null;
    if (url) setAvatarUrl(url);
  }, [user?.user_metadata?.avatar_url]);

  const handlePhotoChanged = async (uri: string) => {
    const previousUrl = avatarUrl;
    setAvatarUrl(uri); // Show immediately (optimistic)
    if (!supabase || !user) return;
    try {
      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();

      const filePath = `${user.id}/avatar.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, arrayBuffer, { contentType: 'image/jpeg', upsert: true });

      if (uploadError) {
        setAvatarUrl(previousUrl);
        Alert.alert('Upload Failed', 'Could not update your profile photo. Please try again.');
        return;
      }

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      if (urlData?.publicUrl) {
        const cacheBustedUrl = `${urlData.publicUrl}?t=${Date.now()}`;
        await supabase.auth.updateUser({ data: { avatar_url: cacheBustedUrl } });
        setAvatarUrl(cacheBustedUrl);
      }
    } catch (err) {
      console.warn('Avatar upload failed:', err);
      setAvatarUrl(previousUrl);
      Alert.alert('Upload Failed', 'Could not update your profile photo. Please try again.');
    }
  };

  useFocusEffect(
    useCallback(() => {
      getPRBaselines().then(setBaselines).catch(() => {});
    }, [getPRBaselines])
  );

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } catch {
      setSigningOut(false);
    }
  };

  return (
    <SafeAreaView style={ds.safe} edges={['top']}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={ds.header}>
          <View style={ds.headerLeft}>
            <TappableAvatar
              displayName={displayName}
              avatarUrl={avatarUrl}
              onPhotoChanged={handlePhotoChanged}
            />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={ds.greeting}>Welcome back,</Text>
              <Text style={ds.name} numberOfLines={1}>{displayName}</Text>
            </View>
          </View>
        </View>

        <View style={ds.cardWrap}>
          <Card title="Today's Workout">
            <Text style={ds.cardDesc}>No plan set up yet -- coming soon!</Text>
          </Card>
        </View>

        <View style={ds.cardWrap}>
          <Card title="Recent Activity">
            <Text style={ds.cardDesc}>Start logging workouts to see your history here</Text>
          </Card>
        </View>

        <View style={ds.cardWrap}>
          <Card title="Progress">
            <Text style={ds.cardDesc}>Your progress charts will appear here</Text>
          </Card>
        </View>

        <View style={{ marginBottom: 32 }}>
          <PRCard baselines={baselines} />
        </View>

        <Button title="Sign Out" onPress={handleSignOut} variant="ghost" loading={signingOut} />
      </ScrollView>
    </SafeAreaView>
  );
}

const ds = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  avatarImg: { width: 48, height: 48, borderRadius: 24 },
  greeting: { color: colors.textSecondary, fontSize: 14 },
  name: { color: colors.textPrimary, fontSize: 20, fontWeight: 'bold' },
  cardWrap: { marginBottom: 16 },
  cardDesc: { color: colors.textSecondary, fontSize: 14 },
  prRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  prLabel: { color: colors.textPrimary, fontSize: 16 },
  prValue: { color: colors.accent, fontWeight: 'bold', fontSize: 16 },
  editHintRow: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  editHint: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
});
