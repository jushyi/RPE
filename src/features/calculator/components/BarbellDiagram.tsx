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

const DIAGRAM_HEIGHT = 180;
const BAR_HEIGHT = 16;
const BAR_Y = (DIAGRAM_HEIGHT - BAR_HEIGHT) / 2;
const PLATE_WIDTH = 18;
const PLATE_GAP = 3;
const COLLAR_WIDTH = 10;
const BAR_COLOR = colors.surfaceElevated;
const MAX_PLATE_HEIGHT = 150;
const MIN_PLATE_HEIGHT = 44;
const BAR_LEFT_PAD = 20;

export function BarbellDiagram({ plates, unit }: BarbellDiagramProps) {
  const plateColors = unit === 'kg' ? PLATE_COLORS_KG : PLATE_COLORS_LB;

  // Build per-side plate array (expanded from {weight, count})
  const expandedPlates: number[] = [];
  for (const p of plates) {
    for (let i = 0; i < p.count; i++) {
      expandedPlates.push(p.weight);
    }
  }

  const plateAreaWidth =
    expandedPlates.length * (PLATE_WIDTH + PLATE_GAP) + COLLAR_WIDTH;
  const totalWidth = BAR_LEFT_PAD + plateAreaWidth + 20;

  const renderPlates = () => {
    return expandedPlates.map((weight, idx) => {
      const heightRatio = PLATE_HEIGHTS[weight] ?? 0.5;
      const plateH = Math.max(
        MIN_PLATE_HEIGHT,
        Math.round(MAX_PLATE_HEIGHT * heightRatio)
      );
      const plateY = (DIAGRAM_HEIGHT - plateH) / 2;
      const color = plateColors[weight] ?? '#666';

      const x =
        BAR_LEFT_PAD + COLLAR_WIDTH + idx * (PLATE_WIDTH + PLATE_GAP);

      const showLabel = plateH >= 44;

      return (
        <React.Fragment key={`plate-${idx}`}>
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
              y={DIAGRAM_HEIGHT / 2 + 5}
              fontSize={11}
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
        {/* Bar — extends from left edge to end */}
        <Rect
          x={0}
          y={BAR_Y}
          width={totalWidth}
          height={BAR_HEIGHT}
          rx={3}
          fill={BAR_COLOR}
        />
        {/* Collar mark */}
        <Line
          x1={BAR_LEFT_PAD}
          y1={BAR_Y - 3}
          x2={BAR_LEFT_PAD}
          y2={BAR_Y + BAR_HEIGHT + 3}
          stroke={colors.textMuted}
          strokeWidth={2}
        />

        {/* Plates — one side only */}
        {renderPlates()}
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
