import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, StyleSheet } from 'react-native';
import { colors } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { calculatePlates } from '@/features/calculator/utils/plateCalculator';
import { LB_PLATES, KG_PLATES, BAR_PRESETS } from '@/features/calculator/constants/plates';
import { getMissingPlateMessage, calculateTotalWeight, countsToBreakdown } from '@/features/calculator/utils/reverseCalc';
import { usePlateInventory } from '@/features/calculator/hooks/usePlateInventory';
import type { BarPreset, PlateCount } from '@/features/calculator/types';
import { BarWeightPicker } from './BarWeightPicker';
import { BarbellDiagram } from './BarbellDiagram';
import { MyPlatesSection } from './MyPlatesSection';
import { PlateStepperList } from './PlateStepperList';

type CalcUnit = 'kg' | 'lbs';
type CalcMode = 'weight-to-plates' | 'plates-to-weight';

export function PlateCalculator() {
  const preferredUnit = useAuthStore((s) => s.preferredUnit);
  const [unit, setUnit] = useState<CalcUnit>(preferredUnit === 'kg' ? 'kg' : 'lbs');
  const [mode, setMode] = useState<CalcMode>('weight-to-plates');
  const [weightText, setWeightText] = useState('');
  const [barPreset, setBarPreset] = useState<BarPreset>(BAR_PRESETS[0]);
  const [plateCounts, setPlateCounts] = useState<PlateCount>({});

  const { enabledPlates, allPlates, toggle, enabledCount, totalCount } =
    usePlateInventory(unit);

  // Reset plateCounts when unit changes
  useEffect(() => {
    setPlateCounts({});
  }, [unit]);

  const targetWeight = parseFloat(weightText) || 0;
  const barWeight = unit === 'kg' ? barPreset.weightKg : barPreset.weightLb;
  const availablePlates = enabledPlates;
  const fullPlates = unit === 'kg' ? KG_PLATES : LB_PLATES;
  const unitLabel = unit === 'kg' ? 'kg' : 'lb';

  // Weight-to-plates breakdown
  const breakdown = useMemo(() => {
    if (targetWeight <= 0) return null;
    if (targetWeight <= barWeight) return 'below_bar';
    return calculatePlates(targetWeight, barWeight, availablePlates);
  }, [targetWeight, barWeight, availablePlates]);

  const perSideSummary = useMemo(() => {
    if (!breakdown || breakdown === 'below_bar') return '';
    return breakdown.plates
      .map((p) => `${p.count}x${p.weight}`)
      .join(' + ');
  }, [breakdown]);

  // Reverse mode computed values
  const reverseTotalWeight = useMemo(
    () => calculateTotalWeight(plateCounts, barWeight),
    [plateCounts, barWeight]
  );

  const reverseBreakdown = useMemo(
    () => countsToBreakdown(plateCounts),
    [plateCounts]
  );

  const handleIncrement = (weight: number) => {
    setPlateCounts((prev) => ({
      ...prev,
      [weight]: (prev[weight] || 0) + 1,
    }));
  };

  const handleDecrement = (weight: number) => {
    setPlateCounts((prev) => {
      const c = (prev[weight] || 0) - 1;
      return { ...prev, [weight]: Math.max(0, c) };
    });
  };

  const handleClearAll = () => {
    setPlateCounts({});
  };

  const isReverse = mode === 'plates-to-weight';

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Mode Toggle */}
      <View style={s.toggleRow}>
        <Pressable
          style={[s.modeBtn, !isReverse && s.toggleBtnActive]}
          onPress={() => setMode('weight-to-plates')}
        >
          <Text style={[s.toggleText, !isReverse && s.toggleTextActive]}>
            Calculate
          </Text>
        </Pressable>
        <Pressable
          style={[s.modeBtn, isReverse && s.toggleBtnActive]}
          onPress={() => setMode('plates-to-weight')}
        >
          <Text style={[s.toggleText, isReverse && s.toggleTextActive]}>
            Load
          </Text>
        </Pressable>
      </View>

      {/* Unit Toggle */}
      <View style={s.toggleRow}>
        <Pressable
          style={[s.toggleBtn, unit === 'lbs' && s.toggleBtnActive]}
          onPress={() => setUnit('lbs')}
        >
          <Text style={[s.toggleText, unit === 'lbs' && s.toggleTextActive]}>lb</Text>
        </Pressable>
        <Pressable
          style={[s.toggleBtn, unit === 'kg' && s.toggleBtnActive]}
          onPress={() => setUnit('kg')}
        >
          <Text style={[s.toggleText, unit === 'kg' && s.toggleTextActive]}>kg</Text>
        </Pressable>
      </View>

      {/* ===== WEIGHT-TO-PLATES MODE ===== */}
      {!isReverse && (
        <>
          {/* Weight Input */}
          <Text style={s.label}>Target Weight ({unitLabel})</Text>
          <TextInput
            style={s.input}
            value={weightText}
            onChangeText={setWeightText}
            keyboardType="decimal-pad"
            placeholder={`Enter weight in ${unitLabel}`}
            placeholderTextColor={colors.textMuted}
            returnKeyType="done"
          />
        </>
      )}

      {/* ===== PLATES-TO-WEIGHT MODE: Total Weight Display ===== */}
      {isReverse && (
        <View style={s.totalWeightCard}>
          <Text style={s.totalWeightLabel}>Total Weight</Text>
          <Text style={s.totalWeightValue}>
            {reverseTotalWeight} {unitLabel}
          </Text>
        </View>
      )}

      {/* Bar Weight Picker (shared) */}
      <View style={s.pickerWrapper}>
        <BarWeightPicker
          selected={barPreset}
          onSelect={setBarPreset}
          unit={unit}
        />
      </View>

      {/* ===== PLATES-TO-WEIGHT MODE: Barbell Diagram ===== */}
      {isReverse && (
        <BarbellDiagram plates={reverseBreakdown} unit={unit} />
      )}

      {/* ===== PLATES-TO-WEIGHT MODE: Stepper List ===== */}
      {isReverse && (
        <View style={s.pickerWrapper}>
          <PlateStepperList
            enabledPlates={enabledPlates}
            plateCounts={plateCounts}
            unit={unit}
            onIncrement={handleIncrement}
            onDecrement={handleDecrement}
          />
        </View>
      )}

      {/* ===== PLATES-TO-WEIGHT MODE: Clear All ===== */}
      {isReverse && (
        <Pressable style={s.clearBtn} onPress={handleClearAll}>
          <Text style={s.clearBtnText}>Clear All</Text>
        </Pressable>
      )}

      {/* My Plates Inventory (Load mode — before results) */}
      {isReverse && (
        <View style={s.pickerWrapper}>
          <MyPlatesSection
            enabledPlates={enabledPlates}
            allPlates={allPlates}
            unit={unit}
            onToggle={toggle}
          />
        </View>
      )}

      {/* Empty inventory warning */}
      {enabledCount === 0 && (
        <View style={s.warningCard}>
          <Text style={s.warningText}>
            Enable at least one plate size in My Plates
          </Text>
        </View>
      )}

      {/* ===== WEIGHT-TO-PLATES MODE: Results ===== */}
      {!isReverse && breakdown === 'below_bar' && (
        <View style={s.messageCard}>
          <Text style={s.messageText}>
            Weight must exceed bar weight ({barWeight} {unitLabel})
          </Text>
        </View>
      )}

      {/* ===== WEIGHT-TO-PLATES MODE: Barbell Diagram (always visible) ===== */}
      {!isReverse && (
        <BarbellDiagram
          plates={breakdown && breakdown !== 'below_bar' ? breakdown.plates : []}
          unit={unit}
        />
      )}

      {!isReverse && breakdown && breakdown !== 'below_bar' && (
        <>
          {/* Per Side Summary */}
          {perSideSummary.length > 0 && (
            <View style={s.summaryCard}>
              <Text style={s.summaryLabel}>Per side</Text>
              <Text style={s.summaryText}>{perSideSummary}</Text>
            </View>
          )}

          {/* Remainder Warning */}
          {breakdown.remainder > 0 && (
            <View style={s.warningCard}>
              <Text style={s.warningText}>
                {getMissingPlateMessage(
                  breakdown.remainder,
                  enabledPlates,
                  fullPlates,
                  unitLabel
                )}
              </Text>
            </View>
          )}
        </>
      )}

      {/* My Plates Inventory (Calculate mode — after results) */}
      {!isReverse && (
        <View style={s.pickerWrapper}>
          <MyPlatesSection
            enabledPlates={enabledPlates}
            allPlates={allPlates}
            unit={unit}
            onToggle={toggle}
          />
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  toggleRow: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.surfaceElevated,
    marginBottom: 16,
    overflow: 'hidden',
  },
  toggleBtn: {
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  modeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  toggleBtnActive: {
    backgroundColor: colors.accent,
  },
  toggleText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '700',
  },
  toggleTextActive: {
    color: '#fff',
  },
  label: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.surfaceElevated,
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '700',
    paddingHorizontal: 16,
    paddingVertical: 14,
    textAlign: 'center',
  },
  pickerWrapper: {
    marginTop: 12,
  },
  totalWeightCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.surfaceElevated,
    padding: 16,
    alignItems: 'center',
    marginBottom: 4,
  },
  totalWeightLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  totalWeightValue: {
    color: colors.textPrimary,
    fontSize: 36,
    fontWeight: '800',
  },
  clearBtn: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  clearBtnText: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: '700',
  },
  messageCard: {
    marginTop: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.surfaceElevated,
  },
  messageText: {
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.surfaceElevated,
    marginTop: 12,
  },
  summaryLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  summaryText: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  warningCard: {
    marginTop: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  warningText: {
    color: colors.warning,
    fontSize: 14,
    textAlign: 'center',
  },
});
