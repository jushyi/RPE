import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Polyline, Line as SvgLine, Text as SvgText } from 'react-native-svg';
import { colors } from '@/constants/theme';
import { formatChartDate } from '../utils/chartHelpers';
import type { ChartMetric } from '../types';

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

interface ChartData {
  date: number;
  estimated_1rm: number;
  max_weight: number;
  total_volume: number;
}

interface ExerciseChartProps {
  data: ChartData[];
  metric: ChartMetric;
  height?: number;
}

const PADDING = { top: 20, right: 16, bottom: 32, left: 48 };

export function ExerciseChart({ data, metric, height = 250 }: ExerciseChartProps) {
  if (data.length < 2) {
    return null;
  }

  const lineColor = METRIC_COLORS[metric];

  // Compute bounds
  const values = data.map((d) => d[metric]);
  const dates = data.map((d) => d.date);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const minDate = Math.min(...dates);
  const maxDate = Math.max(...dates);

  // Chart area dimensions (we'll use 100% width via viewBox)
  const svgWidth = 340;
  const chartW = svgWidth - PADDING.left - PADDING.right;
  const chartH = height - PADDING.top - PADDING.bottom;

  // Avoid division by zero
  const valRange = maxVal - minVal || 1;
  const dateRange = maxDate - minDate || 1;

  // Map data to SVG coordinates
  const points = data
    .map((d) => {
      const x = PADDING.left + ((d.date - minDate) / dateRange) * chartW;
      const y = PADDING.top + (1 - (d[metric] - minVal) / valRange) * chartH;
      return `${x},${y}`;
    })
    .join(' ');

  // Y-axis ticks (4 ticks)
  const yTicks = Array.from({ length: 4 }, (_, i) => {
    const val = minVal + (valRange * i) / 3;
    const y = PADDING.top + (1 - i / 3) * chartH;
    return { val, y };
  });

  // X-axis ticks (up to 5)
  const xTickCount = Math.min(5, data.length);
  const xTicks = Array.from({ length: xTickCount }, (_, i) => {
    const idx = Math.round((i / (xTickCount - 1)) * (data.length - 1));
    const d = data[idx];
    const x = PADDING.left + ((d.date - minDate) / dateRange) * chartW;
    return { label: formatChartDate(d.date), x };
  });

  return (
    <View style={[s.container, { height }]}>
      <Svg width="100%" height={height} viewBox={`0 0 ${svgWidth} ${height}`}>
        {/* Grid lines */}
        {yTicks.map((tick, i) => (
          <SvgLine
            key={`grid-${i}`}
            x1={PADDING.left}
            y1={tick.y}
            x2={svgWidth - PADDING.right}
            y2={tick.y}
            stroke={colors.surfaceElevated}
            strokeWidth={1}
          />
        ))}

        {/* Y-axis labels */}
        {yTicks.map((tick, i) => (
          <SvgText
            key={`ylabel-${i}`}
            x={PADDING.left - 6}
            y={tick.y + 4}
            fill={colors.textMuted}
            fontSize={10}
            textAnchor="end"
          >
            {formatYLabel(tick.val)}
          </SvgText>
        ))}

        {/* X-axis labels */}
        {xTicks.map((tick, i) => (
          <SvgText
            key={`xlabel-${i}`}
            x={tick.x}
            y={height - 8}
            fill={colors.textMuted}
            fontSize={10}
            textAnchor="middle"
          >
            {tick.label}
          </SvgText>
        ))}

        {/* Data line */}
        <Polyline
          points={points}
          fill="none"
          stroke={lineColor}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    width: '100%',
  },
});
