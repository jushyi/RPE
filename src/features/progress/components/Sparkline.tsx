import React from 'react';
import { View } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';
import type { SparklineData } from '../types';

interface SparklineProps {
  data: SparklineData[];
  color: string;
  width: number;
  height: number;
}

export function Sparkline({ data, color, width, height }: SparklineProps) {
  if (data.length < 2) {
    return null;
  }

  const values = data.map((d) => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const valRange = maxVal - minVal || 1;

  const pad = 2;
  const chartW = width - pad * 2;
  const chartH = height - pad * 2;

  const points = data
    .map((d, i) => {
      const x = pad + (i / (data.length - 1)) * chartW;
      const y = pad + (1 - (d.value - minVal) / valRange) * chartH;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        <Polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}
