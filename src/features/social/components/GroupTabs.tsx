/**
 * GroupTabs — Feed | Chat tab switcher within a group screen.
 *
 * - Simple Pressable-based tab bar at the top
 * - Active tab has magenta underline (accent color)
 * - Renders feed content (children) or ChatScreen based on active tab
 * - Unread count badge on Chat tab
 */

import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors } from '@/constants/theme';
import { useChatStore } from '@/stores/chatStore';
import { ChatScreen } from './ChatScreen';

type Tab = 'feed' | 'chat';

interface GroupTabsProps {
  groupId: string;
  feedContent: React.ReactNode;
}

export function GroupTabs({ groupId, feedContent }: GroupTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('feed');
  const unreadCount = useChatStore((s) => s.unreadCounts[groupId] ?? 0);

  return (
    <View style={s.container}>
      {/* Tab bar */}
      <View style={s.tabBar}>
        <Pressable
          style={[s.tab, activeTab === 'feed' && s.tabActive]}
          onPress={() => setActiveTab('feed')}
        >
          <Text style={[s.tabLabel, activeTab === 'feed' && s.tabLabelActive]}>
            Feed
          </Text>
          {activeTab === 'feed' && <View style={s.underline} />}
        </Pressable>

        <Pressable
          style={[s.tab, activeTab === 'chat' && s.tabActive]}
          onPress={() => setActiveTab('chat')}
        >
          <View style={s.chatTabContent}>
            <Text style={[s.tabLabel, activeTab === 'chat' && s.tabLabelActive]}>
              Chat
            </Text>
            {unreadCount > 0 && activeTab !== 'chat' ? (
              <View style={s.badge}>
                <Text style={s.badgeText}>
                  {unreadCount > 99 ? '99+' : String(unreadCount)}
                </Text>
              </View>
            ) : null}
          </View>
          {activeTab === 'chat' && <View style={s.underline} />}
        </Pressable>
      </View>

      {/* Tab content */}
      <View style={s.content}>
        {activeTab === 'feed' ? feedContent : <ChatScreen groupId={groupId} />}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceElevated,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    position: 'relative',
  },
  tabActive: {},
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },
  tabLabelActive: {
    color: colors.accent,
  },
  underline: {
    position: 'absolute',
    bottom: 0,
    left: 16,
    right: 16,
    height: 2,
    backgroundColor: colors.accent,
    borderRadius: 1,
  },
  chatTabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badge: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.white,
  },
  content: {
    flex: 1,
  },
});
