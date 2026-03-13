import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';
import { supabase } from '@/lib/supabase/client';
import type { Group, GroupMember, SharedItem, Reaction } from '@/features/social/types';

// Named MMKV instance to avoid colliding with other stores
const storage = createMMKV({ id: 'social-store' });

const mmkvStorage = {
  getItem: (name: string) => storage.getString(name) ?? null,
  setItem: (name: string, value: string) => storage.set(name, value),
  removeItem: (name: string) => {
    storage.remove(name);
  },
};

/** Feed page size for cursor-based pagination */
const FEED_PAGE_SIZE = 20;

interface SocialState {
  groups: Group[];
  groupMembers: Record<string, GroupMember[]>;
  feedItems: Record<string, SharedItem[]>;
  feedCursors: Record<string, string>;
  reactions: Record<string, Reaction[]>;
  loading: boolean;
}

interface SocialActions {
  fetchGroups: () => Promise<void>;
  createGroup: (name: string, memberIds: string[]) => Promise<Group | null>;
  leaveGroup: (groupId: string) => Promise<void>;
  addMemberToGroup: (groupId: string, userId: string) => Promise<void>;
  removeMemberFromGroup: (groupId: string, userId: string) => Promise<void>;
  toggleMuteGroup: (groupId: string) => Promise<void>;
  fetchFeed: (groupId: string, cursor?: string) => Promise<void>;
  shareToGroups: (groupIds: string[], items: Omit<SharedItem, 'id' | 'group_id' | 'created_at'>[]) => Promise<void>;
  addReaction: (sharedItemId: string, emoji: string) => Promise<void>;
  removeReaction: (reactionId: string) => Promise<void>;
  fetchReactions: (sharedItemId: string) => Promise<void>;
}

export const useSocialStore = create<SocialState & SocialActions>()(
  persist(
    (set, get) => ({
      // State
      groups: [],
      groupMembers: {},
      feedItems: {},
      feedCursors: {},
      reactions: {},
      loading: false,

      // Actions
      fetchGroups: async () => {
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
            .from('groups')
            .select('id, name, created_by, created_at')
            .order('created_at', { ascending: false });

          if (error) {
            console.warn('Failed to fetch groups:', error.message);
            set({ loading: false });
            return;
          }

          set({ groups: (data ?? []) as Group[], loading: false });
        } catch (err) {
          console.warn('Failed to fetch groups:', err);
          set({ loading: false });
        }
      },

      createGroup: async (name: string, memberIds: string[]) => {
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (!session?.user) return null;

          const userId = session.user.id;

          // Insert group
          const { data: groupData, error: groupError } = await (supabase as any)
            .from('groups')
            .insert({ name, created_by: userId })
            .select('*')
            .single();

          if (groupError || !groupData) {
            console.warn('Failed to create group:', groupError?.message);
            return null;
          }

          const group = groupData as Group;

          // Auto-add creator as member (Pitfall 3 from RESEARCH.md)
          const allMemberIds = Array.from(new Set([userId, ...memberIds]));
          const memberInserts = allMemberIds.map((mid) => ({
            group_id: group.id,
            user_id: mid,
          }));

          const { error: memberError } = await (supabase as any)
            .from('group_members')
            .insert(memberInserts);

          if (memberError) {
            console.warn('Failed to add members to group:', memberError.message);
          }

          await get().fetchGroups();
          return group;
        } catch (err) {
          console.warn('Failed to create group:', err);
          return null;
        }
      },

      leaveGroup: async (groupId: string) => {
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (!session?.user) return;

          const { error } = await (supabase as any)
            .from('group_members')
            .delete()
            .eq('group_id', groupId)
            .eq('user_id', session.user.id);

          if (error) {
            console.warn('Failed to leave group:', error.message);
            return;
          }

          // Remove from local state
          set((state) => ({
            groups: state.groups.filter((g) => g.id !== groupId),
          }));
        } catch (err) {
          console.warn('Failed to leave group:', err);
        }
      },

      addMemberToGroup: async (groupId: string, userId: string) => {
        try {
          const { error } = await (supabase as any)
            .from('group_members')
            .insert({ group_id: groupId, user_id: userId });

          if (error) {
            console.warn('Failed to add member to group:', error.message);
            return;
          }

          // Refresh members for this group
          const { data, error: fetchError } = await (supabase as any)
            .from('group_members')
            .select('*')
            .eq('group_id', groupId);

          if (!fetchError) {
            set((state) => ({
              groupMembers: {
                ...state.groupMembers,
                [groupId]: (data ?? []) as GroupMember[],
              },
            }));
          }
        } catch (err) {
          console.warn('Failed to add member to group:', err);
        }
      },

      removeMemberFromGroup: async (groupId: string, userId: string) => {
        try {
          const { error } = await (supabase as any)
            .from('group_members')
            .delete()
            .eq('group_id', groupId)
            .eq('user_id', userId);

          if (error) {
            console.warn('Failed to remove member from group:', error.message);
            return;
          }

          set((state) => ({
            groupMembers: {
              ...state.groupMembers,
              [groupId]: (state.groupMembers[groupId] ?? []).filter(
                (m) => m.user_id !== userId
              ),
            },
          }));
        } catch (err) {
          console.warn('Failed to remove member from group:', err);
        }
      },

      toggleMuteGroup: async (groupId: string) => {
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (!session?.user) return;

          const userId = session.user.id;

          // Get current mute state
          const { data: memberData, error: fetchError } = await (supabase as any)
            .from('group_members')
            .select('muted')
            .eq('group_id', groupId)
            .eq('user_id', userId)
            .single();

          if (fetchError || !memberData) {
            console.warn('Failed to fetch group member for mute toggle:', fetchError?.message);
            return;
          }

          const newMuted = !memberData.muted;

          const { error } = await (supabase as any)
            .from('group_members')
            .update({ muted: newMuted })
            .eq('group_id', groupId)
            .eq('user_id', userId);

          if (error) {
            console.warn('Failed to toggle mute:', error.message);
            return;
          }

          // Update local state
          set((state) => ({
            groupMembers: {
              ...state.groupMembers,
              [groupId]: (state.groupMembers[groupId] ?? []).map((m) =>
                m.user_id === userId ? { ...m, muted: newMuted } : m
              ),
            },
          }));
        } catch (err) {
          console.warn('Failed to toggle mute:', err);
        }
      },

      fetchFeed: async (groupId: string, cursor?: string) => {
        set({ loading: true });
        try {
          // Cursor-based pagination using created_at (Pattern 5 from RESEARCH.md)
          let query = (supabase as any)
            .from('shared_items')
            .select('*')
            .eq('group_id', groupId)
            .order('created_at', { ascending: false })
            .limit(FEED_PAGE_SIZE);

          if (cursor) {
            query = query.lt('created_at', cursor);
          }

          const { data, error } = await query;

          if (error) {
            console.warn('Failed to fetch feed:', error.message);
            set({ loading: false });
            return;
          }

          const newItems = (data ?? []) as SharedItem[];
          const state = get();
          const existingItems = cursor ? (state.feedItems[groupId] ?? []) : [];

          // Track the cursor for the next page load (oldest item's created_at)
          const newCursor =
            newItems.length === FEED_PAGE_SIZE
              ? newItems[newItems.length - 1].created_at
              : undefined;

          set((s) => ({
            feedItems: {
              ...s.feedItems,
              [groupId]: [...existingItems, ...newItems],
            },
            feedCursors: newCursor
              ? { ...s.feedCursors, [groupId]: newCursor }
              : s.feedCursors,
            loading: false,
          }));
        } catch (err) {
          console.warn('Failed to fetch feed:', err);
          set({ loading: false });
        }
      },

      shareToGroups: async (
        groupIds: string[],
        items: Omit<SharedItem, 'id' | 'group_id' | 'created_at'>[]
      ) => {
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (!session?.user) return;

          const userId = session.user.id;

          // Build all insert records: each item goes to each group
          const inserts: any[] = [];
          for (const groupId of groupIds) {
            for (const item of items) {
              inserts.push({
                group_id: groupId,
                user_id: userId,
                content_type: item.content_type,
                payload: item.payload,
              });
            }
          }

          if (inserts.length === 0) return;

          const { error } = await (supabase as any)
            .from('shared_items')
            .insert(inserts);

          if (error) {
            console.warn('Failed to share items:', error.message);
            return;
          }

          // Refresh feed for each group that was shared to
          await Promise.all(groupIds.map((id) => get().fetchFeed(id)));
        } catch (err) {
          console.warn('Failed to share to groups:', err);
        }
      },

      addReaction: async (sharedItemId: string, emoji: string) => {
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (!session?.user) return;

          const { error } = await (supabase as any)
            .from('reactions')
            .insert({
              shared_item_id: sharedItemId,
              user_id: session.user.id,
              emoji,
            });

          if (error) {
            console.warn('Failed to add reaction:', error.message);
            return;
          }

          await get().fetchReactions(sharedItemId);
        } catch (err) {
          console.warn('Failed to add reaction:', err);
        }
      },

      removeReaction: async (reactionId: string) => {
        try {
          const { error } = await (supabase as any)
            .from('reactions')
            .delete()
            .eq('id', reactionId);

          if (error) {
            console.warn('Failed to remove reaction:', error.message);
            return;
          }

          // Optimistically remove from local reactions cache
          set((state) => {
            const updatedReactions: Record<string, Reaction[]> = {};
            for (const [itemId, reactionList] of Object.entries(state.reactions)) {
              updatedReactions[itemId] = reactionList.filter((r) => r.id !== reactionId);
            }
            return { reactions: updatedReactions };
          });
        } catch (err) {
          console.warn('Failed to remove reaction:', err);
        }
      },

      fetchReactions: async (sharedItemId: string) => {
        try {
          const { data, error } = await (supabase as any)
            .from('reactions')
            .select('*')
            .eq('shared_item_id', sharedItemId)
            .order('created_at', { ascending: true });

          if (error) {
            console.warn('Failed to fetch reactions:', error.message);
            return;
          }

          set((state) => ({
            reactions: {
              ...state.reactions,
              [sharedItemId]: (data ?? []) as Reaction[],
            },
          }));
        } catch (err) {
          console.warn('Failed to fetch reactions:', err);
        }
      },
    }),
    {
      name: 'social-store',
      version: 1,
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
