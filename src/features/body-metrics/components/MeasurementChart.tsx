import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { CartesianChart, Line } from 'victory-native';
import { useFont } from '@shopify/react-native-skia';
import { colors } from '@/constants/theme';
import { formatChartDate } from '@/features/progress/utils/chartHelpers';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const interFont = require('@/assets/fonts/Inter-Regular.ttf');

type ChartRecord = Record<string, unknown> & { date: number; value: number };

interface MeasurementChartProps {
  label: string;
  data: { date: number; value: number }[];
  unit: string;
  onToggleUnit?: () => void;
  showUnitToggle: boolean;
  emptyMessage: string;
  singlePointMessage: string;
}

export function MeasurementChart({
  label,
  data,
  unit,
  onToggleUnit,
  showUnitToggle,
  emptyMessage,
  singlePointMessage,
}: MeasurementChartProps) {
  const font = useFont(interFont, 11);

  return (
    <View style={s.container}>
      {/* Header row */}
      <View style={s.header}>
        <Text style={s.label}>{label}</Text>
        {showUnitToggle && onToggleUnit && (
          <Pressable style={s.unitToggle} onPress={onToggleUnit}>
            <Text style={s.unitToggleText}>{unit}</Text>
          </Pressable>
        )}
      </View>

      {/* Chart area */}
      {data.length === 0 ? (
        <View style={s.emptyContainer}>
          <Text style={s.emptyText}>{emptyMessage}</Text>
        </View>
      ) : data.length === 1 ? (
        <View style={s.singlePointContainer}>
          <Text style={s.singlePointValue}>
            {data[0].value} {unit}
          </Text>
          <Text style={s.singlePointMessage}>{singlePointMessage}</Text>
        </View>
      ) : font ? (
        <View style={s.chartContainer}>
          <CartesianChart
            data={data as unknown as ChartRecord[]}
            xKey="date"
            yKeys={['value']}
            padding={{ left: 10, right: 10, bottom: 5, top: 10 }}
            xAxis={{
              font,
              tickCount: 4,
              labelColor: colors.textMuted,
              lineColor: colors.surfaceElevated,
              formatXLabel: (l) => formatChartDate(l as number),
            }}
            yAxis={[
              {
                font,
                tickCount: 4,
                labelColor: colors.textMuted,
                lineColor: colors.surfaceElevated,
                formatYLabel: (l) => String(Math.round(l as number)),
              },
            ]}
            frame={{
              lineColor: colors.surfaceElevated,
              lineWidth: 1,
            }}
          >
            {({ points }) => (
              <Line
                points={points.value}
                color={colors.accent}
                strokeWidth={2}
                curveType="natural"
              />
            )}
          </CartesianChart>
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  unitToggle: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  unitToggleText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '700',
  },
  emptyContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  singlePointContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  singlePointValue: {
    color: colors.accent,
    fontSize: 22,
    fontWeight: '700',
  },
  singlePointMessage: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 6,
  },
  chartContainer: {
    height: 180,
    width: '100%',
  },
});
