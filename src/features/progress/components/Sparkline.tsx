import React from 'react';
import { View } from 'react-native';
import { CartesianChart, Line } from 'victory-native';
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
  if (data.length < 2) {
    return null;
  }

  const chartData = data as unknown as SparklineRecord[];

  return (
    <View style={{ width, height }}>
      <CartesianChart
        data={chartData}
        xKey="date"
        yKeys={['value']}
        padding={{ left: 2, right: 2, top: 2, bottom: 2 }}
      >
        {({ points }) => (
          <Line
            points={points.value}
            color={color}
            strokeWidth={1.5}
            curveType="natural"
          />
        )}
      </CartesianChart>
    </View>
  );
}
