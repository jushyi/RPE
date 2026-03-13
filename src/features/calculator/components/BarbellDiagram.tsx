import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Rect, Text as SvgText, Line } from 'react-native-svg';
import { colors } from '@/constants/theme';
import {
  PLATE_COLORS_LB,
  PLATE_COLORS_KG,
  PLATE_HEIGHTS,
} from '@/features/calculator/constants/plates';

interface BarbellDiagramProps {
  plates: { weight: number; count: number }[];
  unit: 'kg' | 'lbs';
}

const DIAGRAM_HEIGHT = 160;
const BAR_HEIGHT = 14;
const BAR_Y = (DIAGRAM_HEIGHT - BAR_HEIGHT) / 2;
const PLATE_WIDTH = 12;
const PLATE_GAP = 2;
const SLEEVE_WIDTH = 6;
const BAR_COLOR = colors.surfaceElevated;
const MAX_PLATE_HEIGHT = 120;
const MIN_PLATE_HEIGHT = 36;

export function BarbellDiagram({ plates, unit }: BarbellDiagramProps) {
  const plateColors = unit === 'kg' ? PLATE_COLORS_KG : PLATE_COLORS_LB;

  // Build per-side plate array (expanded from {weight, count})
  const expandedPlates: number[] = [];
  for (const p of plates) {
    for (let i = 0; i < p.count; i++) {
      expandedPlates.push(p.weight);
    }
  }

  const totalPlateSlots = expandedPlates.length;
  const sideWidth = totalPlateSlots * (PLATE_WIDTH + PLATE_GAP) + SLEEVE_WIDTH;

  // Total diagram width: left plates + bar center + right plates
  const barCenterWidth = 40;
  const totalWidth = sideWidth * 2 + barCenterWidth;

  const centerX = totalWidth / 2;

  const renderPlates = (side: 'left' | 'right') => {
    return expandedPlates.map((weight, idx) => {
      const heightRatio = PLATE_HEIGHTS[weight] ?? 0.5;
      const plateH = Math.max(
        MIN_PLATE_HEIGHT,
        Math.round(MAX_PLATE_HEIGHT * heightRatio)
      );
      const plateY = (DIAGRAM_HEIGHT - plateH) / 2;
      const color = plateColors[weight] ?? '#666';

      // Position: from bar center outward
      // heaviest first = closest to center (idx 0 closest)
      const offset = SLEEVE_WIDTH + idx * (PLATE_WIDTH + PLATE_GAP);
      const x =
        side === 'right'
          ? centerX + barCenterWidth / 2 + offset
          : centerX - barCenterWidth / 2 - offset - PLATE_WIDTH;

      const showLabel = plateH >= 40;

      return (
        <React.Fragment key={`${side}-${idx}`}>
          <Rect
            x={x}
            y={plateY}
            width={PLATE_WIDTH}
            height={plateH}
            rx={2}
            fill={color}
          />
          {showLabel && (
            <SvgText
              x={x + PLATE_WIDTH / 2}
              y={DIAGRAM_HEIGHT / 2 + 4}
              fontSize={9}
              fill={weight >= 25 || weight === 5 ? '#000' : '#fff'}
              textAnchor="middle"
              fontWeight="bold"
            >
              {weight}
            </SvgText>
          )}
        </React.Fragment>
      );
    });
  };

  return (
    <View style={s.container}>
      <Svg
        width="100%"
        height={DIAGRAM_HEIGHT}
        viewBox={`0 0 ${totalWidth} ${DIAGRAM_HEIGHT}`}
      >
        {/* Bar */}
        <Rect
          x={0}
          y={BAR_Y}
          width={totalWidth}
          height={BAR_HEIGHT}
          rx={3}
          fill={BAR_COLOR}
        />
        {/* Center collar lines */}
        <Line
          x1={centerX - 2}
          y1={BAR_Y - 2}
          x2={centerX - 2}
          y2={BAR_Y + BAR_HEIGHT + 2}
          stroke={colors.textMuted}
          strokeWidth={1}
        />
        <Line
          x1={centerX + 2}
          y1={BAR_Y - 2}
          x2={centerX + 2}
          y2={BAR_Y + BAR_HEIGHT + 2}
          stroke={colors.textMuted}
          strokeWidth={1}
        />

        {/* Plates */}
        {renderPlates('left')}
        {renderPlates('right')}
      </Svg>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    paddingVertical: 8,
    alignItems: 'center',
  },
});
