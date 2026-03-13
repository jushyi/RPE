import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
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

const DIAGRAM_HEIGHT = 267;
const BAR_HEIGHT = 36;
const LEFT_BAR_Y = (DIAGRAM_HEIGHT - BAR_HEIGHT) / 2;
const SLEEVE_HEIGHT = 42;
const SLEEVE_Y = (DIAGRAM_HEIGHT - SLEEVE_HEIGHT) / 2;
const PLATE_WIDTH = 29;
const PLATE_GAP = 5;
const BAR_COLOR = colors.surfaceElevated;
const MAX_PLATE_HEIGHT = 253;
const MIN_PLATE_HEIGHT = 84;

const COLLAR_X = 29;
const COLLAR_WIDTH = 15;
const COLLAR_HEIGHT = 70;
const COLLAR_Y = (DIAGRAM_HEIGHT - COLLAR_HEIGHT) / 2;
const COLLAR_COLOR = '#555';

const PLATE_START_X = COLLAR_X + COLLAR_WIDTH + 3;
const MIN_PLATES_FOR_SIZING = 10;

export function BarbellDiagram({ plates, unit }: BarbellDiagramProps) {
  const plateColors = unit === 'kg' ? PLATE_COLORS_KG : PLATE_COLORS_LB;

  // Build per-side plate array (expanded from {weight, count})
  const expandedPlates: number[] = [];
  for (const p of plates) {
    for (let i = 0; i < p.count; i++) {
      expandedPlates.push(p.weight);
    }
  }

  // Dynamic width based on actual plate count
  const plateCount = expandedPlates.length;
  const SLEEVE_WIDTH = Math.max(
    MIN_PLATES_FOR_SIZING * (PLATE_WIDTH + PLATE_GAP),
    plateCount * (PLATE_WIDTH + PLATE_GAP)
  );
  const TOTAL_WIDTH = COLLAR_X + COLLAR_WIDTH + SLEEVE_WIDTH + 10;

  const renderPlates = () => {
    return expandedPlates.map((weight, idx) => {
      const heightRatio = PLATE_HEIGHTS[weight] ?? 0.5;
      const plateH = Math.max(
        MIN_PLATE_HEIGHT,
        Math.round(MAX_PLATE_HEIGHT * heightRatio)
      );
      const plateY = (DIAGRAM_HEIGHT - plateH) / 2;
      const color = plateColors[weight] ?? '#666';

      const x = PLATE_START_X + idx * (PLATE_WIDTH + PLATE_GAP);

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
              fill={[10, 25, 15, 35].includes(weight) ? '#000' : '#fff'}
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
        viewBox={`0 0 ${TOTAL_WIDTH} ${DIAGRAM_HEIGHT}`}
        preserveAspectRatio="xMinYMid meet"
      >
        {/* Left bar stub */}
        <Rect
          x={0}
          y={LEFT_BAR_Y}
          width={COLLAR_X}
          height={BAR_HEIGHT}
          rx={0}
          fill={BAR_COLOR}
        />
        {/* Right sleeve */}
        <Rect
          x={COLLAR_X + COLLAR_WIDTH}
          y={SLEEVE_Y}
          width={TOTAL_WIDTH - COLLAR_X - COLLAR_WIDTH}
          height={SLEEVE_HEIGHT}
          rx={0}
          fill={BAR_COLOR}
        />
        {/* Collar clamp */}
        <Rect
          x={COLLAR_X}
          y={COLLAR_Y}
          width={COLLAR_WIDTH}
          height={COLLAR_HEIGHT}
          rx={1}
          fill={COLLAR_COLOR}
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
  },
});
