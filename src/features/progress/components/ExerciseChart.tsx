import React from 'react';
import { View, StyleSheet } from 'react-native';
import { CartesianChart, Line } from 'victory-native';
import { useFont } from '@shopify/react-native-skia';
import { colors } from '@/constants/theme';
import { formatChartDate } from '../utils/chartHelpers';
import type { ChartMetric } from '../types';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const interFont = require('@/assets/fonts/Inter-Regular.ttf');

const METRIC_COLORS: Record<ChartMetric, string> = {
  estimated_1rm: colors.accent,
  max_weight: colors.success,
  total_volume: colors.warning,
};

function formatYLabel(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return String(Math.round(value));
}

// Use a Record<string, unknown> compatible type for victory-native
type ChartData = Record<string, unknown> & {
  date: number;
  estimated_1rm: number;
  max_weight: number;
  total_volume: number;
};

interface ExerciseChartProps {
  data: ChartData[];
  metric: ChartMetric;
  height?: number;
}

export function ExerciseChart({ data, metric, height = 250 }: ExerciseChartProps) {
  const font = useFont(interFont, 12);

  if (!font || data.length < 2) {
    return null;
  }

  const lineColor = METRIC_COLORS[metric];

  return (
    <View style={[s.container, { height }]}>
      <CartesianChart
        data={data}
        xKey="date"
        yKeys={[metric]}
        padding={{ left: 10, right: 10, bottom: 5, top: 10 }}
        xAxis={{
          font,
          tickCount: 5,
          labelColor: colors.textMuted,
          lineColor: colors.surfaceElevated,
          formatXLabel: (label) => formatChartDate(label as number),
        }}
        yAxis={[
          {
            font,
            tickCount: 4,
            labelColor: colors.textMuted,
            lineColor: colors.surfaceElevated,
            formatYLabel: (label) => formatYLabel(label as number),
          },
        ]}
        frame={{
          lineColor: colors.surfaceElevated,
          lineWidth: 1,
        }}
      >
        {({ points }) => (
          <Line
            points={points[metric]}
            color={lineColor}
            strokeWidth={2}
            curveType="natural"
          />
        )}
      </CartesianChart>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    width: '100%',
  },
});
