import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';
import { supabase } from '@/lib/supabase/client';
import type { FriendProfile, FriendRequest } from '@/features/social/types';
import {
  generateFriendInviteCode,
  FRIEND_INVITE_CODE_EXPIRY_HOURS,
} from '@/features/social/utils/friendInviteCode';

// Named MMKV instance to avoid colliding with other stores
const storage = createMMKV({ id: 'friendship-store' });

const mmkvStorage = {
  getItem: (name: string) => storage.getString(name) ?? null,
  setItem: (name: string, value: string) => storage.set(name, value),
  removeItem: (name: string) => {
    storage.remove(name);
  },
};

interface FriendshipState {
  friends: FriendProfile[];
  pendingRequests: FriendRequest[];
  sentRequests: FriendRequest[];
  myHandle: string | null;
  loading: boolean;
}

interface FriendshipActions {
  fetchFriends: () => Promise<void>;
  fetchPendingRequests: () => Promise<void>;
  fetchSentRequests: () => Promise<void>;
  sendFriendRequest: (receiverId: string) => Promise<void>;
  acceptRequest: (requestId: string) => Promise<void>;
  rejectRequest: (requestId: string) => Promise<void>;
  unfriend: (friendshipId: string) => Promise<void>;
  generateFriendInviteCode: () => Promise<string | null>;
  redeemFriendInviteCode: (code: string) => Promise<void>;
  searchByHandle: (query: string) => Promise<FriendProfile[]>;
  setMyHandle: (handle: string) => Promise<void>;
  fetchMyHandle: () => Promise<void>;
}

export const useFriendshipStore = create<FriendshipState & FriendshipActions>()(
  persist(
    (set, get) => ({
      // State
      friends: [],
      pendingRequests: [],
      sentRequests: [],
      myHandle: null,
      loading: false,

      // Actions
      fetchFriends: async () => {
        set({ loading: true });
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (!session?.user) {
            set({ loading: false });
            return;
          }

          const userId = session.user.id;

          // Friendships are canonical: user_a < user_b
          // Fetch where user is either party, then look up the friend's profile
          const { data, error } = await (supabase as any)
            .from('friendships')
            .select('id, user_a, user_b, created_at')
            .or(`user_a.eq.${userId},user_b.eq.${userId}`);

          if (error) {
            console.warn('Failed to fetch friendships:', error.message);
            set({ loading: false });
            return;
          }

          const friendships = data ?? [];
          const friendIds: string[] = friendships.map((f: any) =>
            f.user_a === userId ? f.user_b : f.user_a
          );

          if (friendIds.length === 0) {
            set({ friends: [], loading: false });
            return;
          }

          const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('id, display_name, avatar_url, handle')
            .in('id', friendIds);

          if (profileError) {
            console.warn('Failed to fetch friend profiles:', profileError.message);
            set({ loading: false });
            return;
          }

          const friends: FriendProfile[] = (profiles ?? [])
            .filter((p: any) => p.handle != null)
            .map((p: any) => ({
              id: p.id,
              display_name: p.display_name ?? '',
              avatar_url: p.avatar_url ?? null,
              handle: p.handle,
            }));

          set({ friends, loading: false });
        } catch (err) {
          console.warn('Failed to fetch friends:', err);
          set({ loading: false });
        }
      },

      fetchPendingRequests: async () => {
        set({ loading: true });
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (!session?.user) {
            set({ loading: false });
            return;
          }

          const { data, error } = await (supabase as any)
            .from('friend_requests')
            .select('*')
            .eq('receiver_id', session.user.id)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

          if (error) {
            console.warn('Failed to fetch pending requests:', error.message);
            set({ loading: false });
            return;
          }

          set({ pendingRequests: (data ?? []) as FriendRequest[], loading: false });
        } catch (err) {
          console.warn('Failed to fetch pending requests:', err);
          set({ loading: false });
        }
      },

      fetchSentRequests: async () => {
        set({ loading: true });
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (!session?.user) {
            set({ loading: false });
            return;
          }

          const { data, error } = await (supabase as any)
            .from('friend_requests')
            .select('*')
            .eq('sender_id', session.user.id)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

          if (error) {
            console.warn('Failed to fetch sent requests:', error.message);
            set({ loading: false });
            return;
          }

          set({ sentRequests: (data ?? []) as FriendRequest[], loading: false });
        } catch (err) {
          console.warn('Failed to fetch sent requests:', err);
          set({ loading: false });
        }
      },

      sendFriendRequest: async (receiverId: string) => {
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (!session?.user) return;

          const { error } = await (supabase as any)
            .from('friend_requests')
            .insert({ sender_id: session.user.id, receiver_id: receiverId });

          if (error) {
            console.warn('Failed to send friend request:', error.message);
            return;
          }

          await get().fetchSentRequests();
        } catch (err) {
          console.warn('Failed to send friend request:', err);
        }
      },

      acceptRequest: async (requestId: string) => {
        try {
          const { error } = await (supabase as any)
            .from('friend_requests')
            .update({ status: 'accepted' })
            .eq('id', requestId);

          if (error) {
            console.warn('Failed to accept friend request:', error.message);
            return;
          }

          // DB trigger auto-inserts friendship; refetch to update local state
          await Promise.all([
            get().fetchPendingRequests(),
            get().fetchFriends(),
          ]);
        } catch (err) {
          console.warn('Failed to accept friend request:', err);
        }
      },

      rejectRequest: async (requestId: string) => {
        try {
          const { error } = await (supabase as any)
            .from('friend_requests')
            .update({ status: 'rejected' })
            .eq('id', requestId);

          if (error) {
            console.warn('Failed to reject friend request:', error.message);
            return;
          }

          await get().fetchPendingRequests();
        } catch (err) {
          console.warn('Failed to reject friend request:', err);
        }
      },

      unfriend: async (friendshipId: string) => {
        try {
          const { error } = await (supabase as any)
            .from('friendships')
            .delete()
            .eq('id', friendshipId);

          if (error) {
            console.warn('Failed to unfriend:', error.message);
            return;
          }

          await get().fetchFriends();
        } catch (err) {
          console.warn('Failed to unfriend:', err);
        }
      },

      generateFriendInviteCode: async () => {
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (!session?.user) return null;

          const code = generateFriendInviteCode();
          const expiresAt = new Date(
            Date.now() + FRIEND_INVITE_CODE_EXPIRY_HOURS * 60 * 60 * 1000
          ).toISOString();

          const { error } = await (supabase as any)
            .from('friend_invite_codes')
            .insert({ user_id: session.user.id, code, expires_at: expiresAt });

          if (error) {
            console.warn('Failed to create friend invite code:', error.message);
            return null;
          }

          return code;
        } catch (err) {
          console.warn('Failed to generate friend invite code:', err);
          return null;
        }
      },

      redeemFriendInviteCode: async (code: string) => {
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (!session?.user) return;

          // Find the code
          const { data: codeRecord, error: findError } = await (supabase as any)
            .from('friend_invite_codes')
            .select('*')
            .eq('code', code)
            .is('redeemed_by', null)
            .gt('expires_at', new Date().toISOString())
            .single();

          if (findError || !codeRecord) {
            console.warn('Invalid or expired friend invite code');
            return;
          }

          // Mark code as redeemed
          await (supabase as any)
            .from('friend_invite_codes')
            .update({ redeemed_by: session.user.id })
            .eq('id', codeRecord.id);

          // Send a friend request to the code owner
          await get().sendFriendRequest(codeRecord.user_id);
        } catch (err) {
          console.warn('Failed to redeem friend invite code:', err);
        }
      },

      searchByHandle: async (query: string) => {
        try {
          const { data, error } = await (supabase.rpc as any)('search_profiles_by_handle', {
            query,
          });

          if (error) {
            console.warn('Failed to search by handle:', error.message);
            return [];
          }

          return (data ?? []) as FriendProfile[];
        } catch (err) {
          console.warn('Failed to search by handle:', err);
          return [];
        }
      },

      setMyHandle: async (handle: string) => {
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (!session?.user) return;

          const { error } = await (supabase
            .from('profiles')
            .update({ handle } as any)
            .eq('id', session.user.id) as any);

          if (error) {
            console.warn('Failed to set handle:', error.message);
            return;
          }

          set({ myHandle: handle });
        } catch (err) {
          console.warn('Failed to set handle:', err);
        }
      },

      fetchMyHandle: async () => {
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (!session?.user) return;

          const { data, error } = await supabase
            .from('profiles')
            .select('handle')
            .eq('id', session.user.id)
            .single();

          if (error) {
            console.warn('Failed to fetch handle:', error.message);
            return;
          }

          set({ myHandle: (data as any)?.handle ?? null });
        } catch (err) {
          console.warn('Failed to fetch handle:', err);
        }
      },
    }),
    {
      name: 'friendship-store',
      version: 1,
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
