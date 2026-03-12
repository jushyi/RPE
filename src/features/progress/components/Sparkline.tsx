import React from 'react';
import { View, Text } from 'react-native';
import { CartesianChart, Line } from 'victory-native';
import { colors } from '@/constants/theme';
import type { SparklineData } from '../types';

interface SparklineProps {
  data: SparklineData[];
  color: string;
  width: number;
  height: number;
}

// Victory Native requires Record<string, unknown> compatible data
type SparklineRecord = Record<string, unknown> & { date: number; value: number };

export function Sparkline({ data, color, width, height }: SparklineProps) {
  if (data.length < 3) {
    return (
      <View style={{ width, height, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: colors.textMuted, fontSize: 10 }}>Not enough data</Text>
      </View>
    );
  }

  const chartData = data as unknown as SparklineRecord[];

  const values = data.map((d) => d.value);
  const yMin = Math.min(...values);
  const yMax = Math.max(...values);
  const padding = (yMax - yMin) * 0.1 || 1;

  return (
    <View style={{ width, height }}>
      <CartesianChart
        data={chartData}
        xKey="date"
        yKeys={['value']}
        padding={{ left: 2, right: 2, top: 2, bottom: 2 }}
        domain={{ y: [yMin - padding, yMax + padding] }}
      >
        {({ points }) => (
          <Line
            points={points.value}
            color={color}
            strokeWidth={1.5}
            curveType="linear"
          />
        )}
      </CartesianChart>
    </View>
  );
}
