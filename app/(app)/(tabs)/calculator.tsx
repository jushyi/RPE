import React, { useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PagerView from 'react-native-pager-view';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '@/constants/theme';
import { PlateCalculator } from '@/features/calculator/components/PlateCalculator';
import { RpeCalculator } from '@/features/calculator/components/RpeCalculator';
import { NextSetCalculator } from '@/features/calculator/components/NextSetCalculator';

const TABS = ['Plates', 'RPE/1RM', 'Next Set'] as const;

export default function CalculatorScreen() {
  const pagerRef = useRef<PagerView>(null);
  const [activeTab, setActiveTab] = useState(0);
  const indicatorX = useSharedValue(0);
  const [tabWidth, setTabWidth] = useState(0);

  const handleTabPress = useCallback(
    (index: number) => {
      pagerRef.current?.setPage(index);
    },
    []
  );

  const onPageSelected = useCallback(
    (e: any) => {
      const position = e.nativeEvent.position;
      setActiveTab(position);
      indicatorX.value = withTiming(position * tabWidth, { duration: 200 });
    },
    [tabWidth, indicatorX]
  );

  const onTabBarLayout = useCallback(
    (e: any) => {
      const width = e.nativeEvent.layout.width / TABS.length;
      setTabWidth(width);
      indicatorX.value = activeTab * width;
    },
    [activeTab, indicatorX]
  );

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
    width: tabWidth || 0,
  }));

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Tab Bar */}
      <View style={s.tabBar} onLayout={onTabBarLayout}>
        {TABS.map((tab, index) => (
          <Pressable
            key={tab}
            style={s.tabItem}
            onPress={() => handleTabPress(index)}
          >
            <Text
              style={[
                s.tabText,
                activeTab === index ? s.tabTextActive : s.tabTextInactive,
              ]}
            >
              {tab}
            </Text>
          </Pressable>
        ))}
        <Animated.View style={[s.tabIndicator, indicatorStyle]} />
      </View>

      {/* Pager */}
      <PagerView
        ref={pagerRef}
        style={s.pager}
        initialPage={0}
        onPageSelected={onPageSelected}
        offscreenPageLimit={2}
      >
        <View key="plates" style={s.page}>
          <PlateCalculator />
        </View>
        <View key="rpe" style={s.page}>
          <RpeCalculator />
        </View>
        <View key="nextset" style={s.page}>
          <NextSetCalculator />
        </View>
      </PagerView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceElevated,
    position: 'relative',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '700',
  },
  tabTextActive: {
    color: colors.accent,
  },
  tabTextInactive: {
    color: colors.textSecondary,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    backgroundColor: colors.accent,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
});
