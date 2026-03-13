import React from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { colors } from '@/constants/theme';
import { MeasurementHistoryItem } from './MeasurementHistoryItem';
import type { BodyMeasurement } from '../types';
import type { BodyweightEntry } from '@/features/progress/types';

interface MeasurementHistoryListProps {
  measurements: BodyMeasurement[];
  bodyweightEntries?: BodyweightEntry[];
  isLoading: boolean;
  onRefresh: () => Promise<void>;
  onEdit: (entry: BodyMeasurement) => void;
  onDelete: (id: string) => void;
}

export function MeasurementHistoryList({
  measurements,
  bodyweightEntries,
  isLoading,
  onRefresh,
  onEdit,
  onDelete,
}: MeasurementHistoryListProps) {
  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };

  if (isLoading && measurements.length === 0) {
    return (
      <View style={s.centered}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (measurements.length === 0) {
    return (
      <View style={s.centered}>
        <Text style={s.emptyText}>No measurements logged yet</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={measurements}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => {
        const bwEntry = bodyweightEntries?.find(bw => bw.logged_at === item.measured_at);
        return (
          <MeasurementHistoryItem
            entry={item}
            bodyweightEntry={bwEntry ? { weight: bwEntry.weight, unit: bwEntry.unit } : undefined}
            onEdit={() => onEdit(item)}
            onDelete={() => onDelete(item.id)}
          />
        );
      }}
      contentContainerStyle={s.list}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={colors.accent}
          colors={[colors.accent]}
        />
      }
    />
  );
}

const s = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 15,
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
});
