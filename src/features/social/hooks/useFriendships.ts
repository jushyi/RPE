import { useEffect } from 'react';
import { useFriendshipStore } from '@/stores/friendshipStore';

/**
 * Thin wrapper around friendshipStore.
 * Triggers data fetching on mount and exposes state + actions.
 */
export function useFriendships() {
  const friends = useFriendshipStore((s) => s.friends);
  const pendingRequests = useFriendshipStore((s) => s.pendingRequests);
  const sentRequests = useFriendshipStore((s) => s.sentRequests);
  const loading = useFriendshipStore((s) => s.loading);
  const fetchFriends = useFriendshipStore((s) => s.fetchFriends);
  const fetchPendingRequests = useFriendshipStore((s) => s.fetchPendingRequests);
  const fetchSentRequests = useFriendshipStore((s) => s.fetchSentRequests);
  const sendFriendRequest = useFriendshipStore((s) => s.sendFriendRequest);
  const acceptRequest = useFriendshipStore((s) => s.acceptRequest);
  const rejectRequest = useFriendshipStore((s) => s.rejectRequest);
  const unfriend = useFriendshipStore((s) => s.unfriend);
  const searchByHandle = useFriendshipStore((s) => s.searchByHandle);
  const generateFriendInviteCode = useFriendshipStore((s) => s.generateFriendInviteCode);
  const redeemFriendInviteCode = useFriendshipStore((s) => s.redeemFriendInviteCode);

  useEffect(() => {
    fetchFriends();
    fetchPendingRequests();
    fetchSentRequests();
  }, []);

  const pendingCount = pendingRequests.length;

  return {
    friends,
    pendingRequests,
    sentRequests,
    loading,
    pendingCount,
    actions: {
      sendFriendRequest,
      acceptRequest,
      rejectRequest,
      unfriend,
      searchByHandle,
      generateFriendInviteCode,
      redeemFriendInviteCode,
      fetchFriends,
      fetchPendingRequests,
      fetchSentRequests,
    },
  };
}
