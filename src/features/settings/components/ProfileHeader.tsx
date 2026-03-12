import { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase/client';

interface UserInfo {
  displayName: string;
  email: string;
  avatarUrl: string | null;
}

export function ProfileHeader() {
  const [userInfo, setUserInfo] = useState<UserInfo>({
    displayName: 'User',
    email: '',
    avatarUrl: null,
  });

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Check profiles table as fallback for existing accounts
        const { data: profile } = await (supabase.from('profiles') as any)
          .select('avatar_url')
          .eq('id', user.id)
          .single();

        setUserInfo({
          displayName: user.user_metadata?.display_name || 'User',
          email: user.email || '',
          avatarUrl: user.user_metadata?.avatar_url || profile?.avatar_url || null,
        });
      }
    })();
  }, []);

  const initials = userInfo.displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  return (
    <View style={styles.container}>
      {userInfo.avatarUrl ? (
        <Image source={{ uri: userInfo.avatarUrl }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarFallback}>
          <Text style={styles.initialsText}>{initials}</Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.displayName}>{userInfo.displayName}</Text>
        <Text style={styles.email}>{userInfo.email}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.surfaceElevated,
  },
  avatarFallback: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 24,
  },
  info: {
    marginLeft: 14,
    flex: 1,
  },
  displayName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  email: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
