import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Stack } from 'expo-router';
import { colors } from '@/constants/theme';
import { useFriendshipStore } from '@/stores/friendshipStore';
import { FriendRequestCard } from '@/features/social/components/FriendRequestCard';
import { supabase } from '@/lib/supabase/client';
import type { FriendRequest, FriendProfile } from '@/features/social/types';

export default function FriendRequestsScreen() {
  const pendingRequests = useFriendshipStore((s) => s.pendingRequests);
  const sentRequests = useFriendshipStore((s) => s.sentRequests);
  const loading = useFriendshipStore((s) => s.loading);
  const fetchPendingRequests = useFriendshipStore((s) => s.fetchPendingRequests);
  const fetchSentRequests = useFriendshipStore((s) => s.fetchSentRequests);
  const acceptRequest = useFriendshipStore((s) => s.acceptRequest);
  const rejectRequest = useFriendshipStore((s) => s.rejectRequest);

  const [senderProfiles, setSenderProfiles] = useState<Record<string, FriendProfile>>({});
  const [sentProfiles, setSentProfiles] = useState<Record<string, FriendProfile>>({});

  const fetchSenderProfiles = useCallback(async (requests: FriendRequest[]) => {
    if (requests.length === 0) return;
    const ids = requests.map((r) => r.sender_id);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url, handle')
      .in('id', ids);
    if (error || !data) return;
    const map: Record<string, FriendProfile> = {};
    for (const p of data as any[]) {
      map[p.id] = {
        id: p.id,
        display_name: p.display_name ?? '',
        avatar_url: p.avatar_url ?? null,
        handle: p.handle ?? '',
      };
    }
    setSenderProfiles(map);
  }, []);

  const fetchReceiverProfiles = useCallback(async (requests: FriendRequest[]) => {
    if (requests.length === 0) return;
    const ids = requests.map((r) => r.receiver_id);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url, handle')
      .in('id', ids);
    if (error || !data) return;
    const map: Record<string, FriendProfile> = {};
    for (const p of data as any[]) {
      map[p.id] = {
        id: p.id,
        display_name: p.display_name ?? '',
        avatar_url: p.avatar_url ?? null,
        handle: p.handle ?? '',
      };
    }
    setSentProfiles(map);
  }, []);

  useEffect(() => {
    fetchPendingRequests();
    fetchSentRequests();
  }, []);

  useEffect(() => {
    fetchSenderProfiles(pendingRequests);
  }, [pendingRequests]);

  useEffect(() => {
    fetchReceiverProfiles(sentRequests);
  }, [sentRequests]);

  const handleRefresh = useCallback(async () => {
    await Promise.all([fetchPendingRequests(), fetchSentRequests()]);
  }, [fetchPendingRequests, fetchSentRequests]);

  const renderPendingRequest = useCallback(
    ({ item }: { item: FriendRequest }) => (
      <FriendRequestCard
        request={item}
        sender={senderProfiles[item.sender_id] ?? null}
        onAccept={acceptRequest}
        onReject={rejectRequest}
      />
    ),
    [senderProfiles, acceptRequest, rejectRequest]
  );

  return (
    <>
      <Stack.Screen options={{ title: 'Friend Requests' }} />
      <FlatList
        data={pendingRequests}
        keyExtractor={(item) => item.id}
        renderItem={renderPendingRequest}
        style={s.list}
        contentContainerStyle={s.content}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
          />
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={colors.accent} style={s.loader} />
          ) : (
            <View style={s.emptyState}>
              <Text style={s.emptyText}>No pending requests</Text>
            </View>
          )
        }
        ListHeaderComponent={
          pendingRequests.length > 0 ? (
            <Text style={s.sectionTitle}>Pending</Text>
          ) : null
        }
        ListFooterComponent={
          sentRequests.length > 0 ? (
            <View>
              <Text style={s.sectionTitle}>Sent</Text>
              {sentRequests.map((req) => {
                const receiver = sentProfiles[req.receiver_id];
                return (
                  <View key={req.id} style={s.sentItem}>
                    <View style={s.sentInfo}>
                      <Text style={s.sentName} numberOfLines={1}>
                        {receiver?.display_name ?? 'Unknown'}
                      </Text>
                      {receiver?.handle ? (
                        <Text style={s.sentHandle}>@{receiver.handle}</Text>
                      ) : null}
                    </View>
                    <View style={s.pendingBadge}>
                      <Text style={s.pendingBadgeText}>Pending</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : null
        }
      />
    </>
  );
}

const s = StyleSheet.create({
  list: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 12,
    marginTop: 4,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  loader: {
    marginTop: 40,
  },
  sentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  sentInfo: {
    flex: 1,
  },
  sentName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  sentHandle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  pendingBadge: {
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  pendingBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
});
