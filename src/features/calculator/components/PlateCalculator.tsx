import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, StyleSheet } from 'react-native';
import { colors } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { calculatePlates } from '@/features/calculator/utils/plateCalculator';
import { LB_PLATES, KG_PLATES, BAR_PRESETS } from '@/features/calculator/constants/plates';
import { getMissingPlateMessage } from '@/features/calculator/utils/reverseCalc';
import { usePlateInventory } from '@/features/calculator/hooks/usePlateInventory';
import type { BarPreset } from '@/features/calculator/types';
import { BarWeightPicker } from './BarWeightPicker';
import { BarbellDiagram } from './BarbellDiagram';
import { MyPlatesSection } from './MyPlatesSection';

type CalcUnit = 'kg' | 'lbs';

export function PlateCalculator() {
  const preferredUnit = useAuthStore((s) => s.preferredUnit);
  const [unit, setUnit] = useState<CalcUnit>(preferredUnit === 'kg' ? 'kg' : 'lbs');
  const [weightText, setWeightText] = useState('');
  const [barPreset, setBarPreset] = useState<BarPreset>(BAR_PRESETS[0]);

  const { enabledPlates, allPlates, toggle, enabledCount, totalCount } =
    usePlateInventory(unit);

  const targetWeight = parseFloat(weightText) || 0;
  const barWeight = unit === 'kg' ? barPreset.weightKg : barPreset.weightLb;
  const availablePlates = enabledPlates;
  const fullPlates = unit === 'kg' ? KG_PLATES : LB_PLATES;
  const unitLabel = unit === 'kg' ? 'kg' : 'lb';

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

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      keyboardShouldPersistTaps="handled"
    >
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

      {/* Bar Weight Picker */}
      <View style={s.pickerWrapper}>
        <BarWeightPicker
          selected={barPreset}
          onSelect={setBarPreset}
          unit={unit}
        />
      </View>

      {/* My Plates Inventory */}
      <View style={s.pickerWrapper}>
        <MyPlatesSection
          enabledPlates={enabledPlates}
          allPlates={allPlates}
          unit={unit}
          onToggle={toggle}
        />
      </View>

      {/* Empty inventory warning */}
      {enabledCount === 0 && (
        <View style={s.warningCard}>
          <Text style={s.warningText}>
            Enable at least one plate size in My Plates
          </Text>
        </View>
      )}

      {/* Results */}
      {breakdown === 'below_bar' && (
        <View style={s.messageCard}>
          <Text style={s.messageText}>
            Weight must exceed bar weight ({barWeight} {unitLabel})
          </Text>
        </View>
      )}

      {breakdown && breakdown !== 'below_bar' && (
        <>
          {/* Barbell Diagram — one side only */}
          <BarbellDiagram plates={breakdown.plates} unit={unit} />

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
