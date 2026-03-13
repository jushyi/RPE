import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors } from '@/constants/theme';
import { getWeightForRpeAndReps } from '@/features/calculator/utils/rpeTable';

interface RpeTableProps {
  e1rm: number;
}

const RPE_ROWS = [10, 9.5, 9, 8.5, 8, 7.5, 7, 6.5, 6];
const REP_COLS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export function RpeTable({ e1rm }: RpeTableProps) {
  const hasData = e1rm > 0;

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      {/* Header Row */}
      <View style={s.row}>
        <View style={[s.cell, s.headerCell, s.rpeCol]}>
          <Text style={s.headerText}>RPE</Text>
        </View>
        {REP_COLS.map((rep) => (
          <View key={rep} style={[s.cell, s.headerCell]}>
            <Text style={s.headerText}>{rep}</Text>
          </View>
        ))}
      </View>

      {/* Data Rows */}
      {RPE_ROWS.map((rpe) => (
        <View key={rpe} style={s.row}>
          <View style={[s.cell, s.rpeCol, s.rpeCell]}>
            <Text style={s.rpeText}>{rpe}</Text>
          </View>
          {REP_COLS.map((rep) => {
            const weight = hasData
              ? Math.round(getWeightForRpeAndReps(e1rm, rpe, rep))
              : 0;
            return (
              <View key={rep} style={s.cell}>
                <Text style={s.cellText}>
                  {hasData ? weight : '--'}
                </Text>
              </View>
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: {
    marginTop: 12,
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    flex: 1,
    minWidth: 32,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: colors.surfaceElevated,
    backgroundColor: colors.surface,
  },
  headerCell: {
    backgroundColor: colors.surfaceElevated,
    height: 30,
  },
  headerText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  rpeCol: {
    minWidth: 38,
    maxWidth: 38,
  },
  rpeCell: {
    backgroundColor: colors.surfaceElevated,
  },
  rpeText: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '700',
  },
  cellText: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: '500',
  },
});
