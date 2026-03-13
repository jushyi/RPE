import React, { useRef, useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import PagerView from 'react-native-pager-view';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '@/constants/theme';
import { useBodyMeasurements } from '@/features/body-metrics/hooks/useBodyMeasurements';
import { useBodyweightData } from '@/features/progress/hooks/useBodyweightData';
import { useBodyMetricsChartData } from '@/features/body-metrics/hooks/useBodyMetricsChartData';
import { MeasurementForm } from '@/features/body-metrics/components/MeasurementForm';
import { MeasurementChart } from '@/features/body-metrics/components/MeasurementChart';
import { MeasurementHistoryList } from '@/features/body-metrics/components/MeasurementHistoryList';
import type { BodyMeasurement, CircumferenceUnit } from '@/features/body-metrics/types';

const TABS = ['Charts', 'History'] as const;

export default function BodyMetricsScreen() {
  const router = useRouter();
  const pagerRef = useRef<PagerView>(null);
  const [activeTab, setActiveTab] = useState(0);
  const indicatorX = useSharedValue(0);
  const [tabWidth, setTabWidth] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const {
    measurements,
    isLoading,
    fetchMeasurements,
    addMeasurement,
    updateMeasurement,
    deleteMeasurement,
  } = useBodyMeasurements();

  const {
    entries: bodyweightEntries,
    fetchEntries: fetchBodyweight,
    addEntry: logWeight,
  } = useBodyweightData();

  const [editEntry, setEditEntry] = useState<BodyMeasurement | null>(null);
  const [circumferenceUnit, setCircumferenceUnit] = useState<CircumferenceUnit>('in');
  const [weightUnit, setWeightUnit] = useState<'lbs' | 'kg'>('lbs');

  // Fetch on mount
  useEffect(() => {
    fetchMeasurements();
    fetchBodyweight();
  }, []);

  // Chart data hooks
  const chestData = useBodyMetricsChartData('chest', circumferenceUnit);
  const waistData = useBodyMetricsChartData('waist', circumferenceUnit);
  const bicepsData = useBodyMetricsChartData('biceps', circumferenceUnit);
  const quadData = useBodyMetricsChartData('quad', circumferenceUnit);
  const bodyFatData = useBodyMetricsChartData('body_fat_pct', circumferenceUnit);

  // Bodyweight chart data
  const bodyweightChartData = React.useMemo(() => {
    return bodyweightEntries
      .slice(0, 30)
      .map((e) => ({ date: new Date(e.logged_at).getTime(), value: e.weight }))
      .reverse();
  }, [bodyweightEntries]);

  const handleTabPress = useCallback(
    (index: number) => {
      pagerRef.current?.setPage(index);
    },
    [],
  );

  const onPageSelected = useCallback(
    (e: any) => {
      const position = e.nativeEvent.position;
      setActiveTab(position);
      indicatorX.value = withTiming(position * tabWidth, { duration: 200 });
    },
    [tabWidth, indicatorX],
  );

  const onTabBarLayout = useCallback(
    (e: any) => {
      const width = e.nativeEvent.layout.width / TABS.length;
      setTabWidth(width);
      indicatorX.value = activeTab * width;
    },
    [activeTab, indicatorX],
  );

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
    width: tabWidth || 0,
  }));

  const handleSave = useCallback(
    async (data: {
      bodyweight?: number | null;
      bodyweight_unit?: 'lbs' | 'kg';
      chest?: number | null;
      chest_unit?: CircumferenceUnit | null;
      waist?: number | null;
      waist_unit?: CircumferenceUnit | null;
      biceps?: number | null;
      biceps_unit?: CircumferenceUnit | null;
      quad?: number | null;
      quad_unit?: CircumferenceUnit | null;
      body_fat_pct?: number | null;
      measured_at: string;
      editId?: string;
    }) => {
      // Save bodyweight to Phase 6 bodyweight_logs table
      if (data.bodyweight != null && data.bodyweight_unit) {
        await logWeight(data.bodyweight, data.bodyweight_unit, data.measured_at);
      }

      // Save/update body measurements
      const hasMeasurement =
        data.chest != null ||
        data.waist != null ||
        data.biceps != null ||
        data.quad != null ||
        data.body_fat_pct != null;

      if (hasMeasurement) {
        const measurementData = {
          chest: data.chest ?? null,
          chest_unit: data.chest != null ? (data.chest_unit ?? 'in') : null,
          waist: data.waist ?? null,
          waist_unit: data.waist != null ? (data.waist_unit ?? 'in') : null,
          biceps: data.biceps ?? null,
          biceps_unit: data.biceps != null ? (data.biceps_unit ?? 'in') : null,
          quad: data.quad ?? null,
          quad_unit: data.quad != null ? (data.quad_unit ?? 'in') : null,
          body_fat_pct: data.body_fat_pct ?? null,
          measured_at: data.measured_at,
        };

        if (data.editId) {
          await updateMeasurement(data.editId, measurementData);
        } else {
          await addMeasurement(measurementData);
        }
      }

      setEditEntry(null);
    },
    [logWeight, addMeasurement, updateMeasurement],
  );

  const handleEdit = useCallback(
    (entry: BodyMeasurement) => {
      setEditEntry(entry);
      // Switch to Charts tab and scroll to top
      pagerRef.current?.setPage(0);
      setTimeout(() => {
        scrollRef.current?.scrollTo({ y: 0, animated: true });
      }, 300);
    },
    [],
  );

  const handleDelete = useCallback(
    (id: string) => {
      deleteMeasurement(id);
    },
    [deleteMeasurement],
  );

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={s.headerTitle}>Body Metrics</Text>
        <View style={s.headerSpacer} />
      </View>

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
        offscreenPageLimit={1}
      >
        {/* Charts Tab */}
        <View key="charts" style={s.page}>
          <ScrollView
            ref={scrollRef}
            style={s.scroll}
            contentContainerStyle={s.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <MeasurementForm
              onSave={handleSave}
              editEntry={editEntry}
              onCancelEdit={() => setEditEntry(null)}
              latestMeasurement={measurements[0] ?? null}
            />

            {/* Bodyweight Chart */}
            <MeasurementChart
              label="Bodyweight"
              data={bodyweightChartData}
              unit={weightUnit}
              onToggleUnit={() => setWeightUnit((u) => (u === 'lbs' ? 'kg' : 'lbs'))}
              showUnitToggle
              emptyMessage="No bodyweight data yet"
              singlePointMessage="Log more entries to see trends"
            />

            {/* Chest Chart */}
            <MeasurementChart
              label="Chest"
              data={chestData}
              unit={circumferenceUnit}
              onToggleUnit={() => setCircumferenceUnit((u) => (u === 'in' ? 'cm' : 'in'))}
              showUnitToggle
              emptyMessage="No chest data yet"
              singlePointMessage="Log more entries to see trends"
            />

            {/* Waist Chart */}
            <MeasurementChart
              label="Waist"
              data={waistData}
              unit={circumferenceUnit}
              onToggleUnit={() => setCircumferenceUnit((u) => (u === 'in' ? 'cm' : 'in'))}
              showUnitToggle
              emptyMessage="No waist data yet"
              singlePointMessage="Log more entries to see trends"
            />

            {/* Biceps Chart */}
            <MeasurementChart
              label="Biceps"
              data={bicepsData}
              unit={circumferenceUnit}
              onToggleUnit={() => setCircumferenceUnit((u) => (u === 'in' ? 'cm' : 'in'))}
              showUnitToggle
              emptyMessage="No biceps data yet"
              singlePointMessage="Log more entries to see trends"
            />

            {/* Quad Chart */}
            <MeasurementChart
              label="Quad"
              data={quadData}
              unit={circumferenceUnit}
              onToggleUnit={() => setCircumferenceUnit((u) => (u === 'in' ? 'cm' : 'in'))}
              showUnitToggle
              emptyMessage="No quad data yet"
              singlePointMessage="Log more entries to see trends"
            />

            {/* Body Fat Chart */}
            <MeasurementChart
              label="Body Fat"
              data={bodyFatData}
              unit="%"
              showUnitToggle={false}
              emptyMessage="No body fat data yet"
              singlePointMessage="Log more entries to see trends"
            />
          </ScrollView>
        </View>

        {/* History Tab */}
        <View key="history" style={s.page}>
          <MeasurementHistoryList
            measurements={measurements}
            bodyweightEntries={bodyweightEntries}
            isLoading={isLoading}
            onRefresh={fetchMeasurements}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
});
