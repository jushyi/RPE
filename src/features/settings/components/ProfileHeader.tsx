import { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
        setUserInfo({
          displayName: user.user_metadata?.display_name || 'User',
          email: user.email || '',
          avatarUrl: user.user_metadata?.avatar_url || null,
        });
      }
    })();
  }, []);

  return (
    <View style={styles.container}>
      {userInfo.avatarUrl ? (
        <Image source={{ uri: userInfo.avatarUrl }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarFallback}>
          <Ionicons name="person-circle-outline" size={60} color={colors.textMuted} />
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
    alignItems: 'center',
    justifyContent: 'center',
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
