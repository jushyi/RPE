import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/theme';
import { useBodyweightData } from '@/features/progress/hooks/useBodyweightData';
import { Sparkline } from '@/features/progress/components/Sparkline';

type WeightUnit = 'kg' | 'lbs';

export function BodyweightCard() {
  const { entries, latest, sparklineData, fetchEntries, addEntry } =
    useBodyweightData();

  const [expanded, setExpanded] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<WeightUnit>(
    latest?.unit ?? 'lbs'
  );
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchEntries();
    }, [fetchEntries])
  );

  // Update default unit when latest changes
  React.useEffect(() => {
    if (latest?.unit) {
      setSelectedUnit(latest.unit);
    }
  }, [latest?.unit]);

  // Check if entry exists for today
  const today = new Date().toISOString().split('T')[0];
  const hasTodayEntry = entries.some((e) => e.logged_at === today);

  const handleWeightChange = (text: string) => {
    // Allow digits, at most one decimal point with one digit after
    if (/^\d*\.?\d{0,1}$/.test(text)) {
      setWeightInput(text);
    }
  };

  const handleSave = async () => {
    const weight = parseFloat(weightInput);
    if (isNaN(weight) || weight <= 0) return;

    setSaving(true);
    try {
      await addEntry(weight, selectedUnit);
      setWeightInput('');
      setExpanded(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setWeightInput('');
    setExpanded(false);
  };

  return (
    <Card title="Bodyweight">
      {/* Top section: Latest weight + sparkline */}
      <View style={s.topRow}>
        <View style={s.weightDisplay}>
          <Text style={s.weightValue}>
            {latest ? String(latest.weight) : '--'}
          </Text>
          <Text style={s.weightUnit}>
            {latest?.unit ?? 'lbs'}
          </Text>
        </View>
        <Sparkline
          data={sparklineData}
          color={colors.accent}
          width={80}
          height={32}
        />
      </View>

      {/* Log / Update button */}
      {!expanded && (
        <View style={s.btnRow}>
          <Button
            title={hasTodayEntry ? 'Update Weight' : 'Log Weight'}
            onPress={() => setExpanded(true)}
            variant="secondary"
          />
        </View>
      )}

      {/* Inline input area */}
      {expanded && (
        <View style={s.inputArea}>
          <View style={s.inputRow}>
            <TextInput
              style={s.textInput}
              value={weightInput}
              onChangeText={handleWeightChange}
              keyboardType="decimal-pad"
              placeholder="Weight"
              placeholderTextColor={colors.textMuted}
              autoFocus
            />
            <View style={s.unitRow}>
              <Pressable
                onPress={() => setSelectedUnit('kg')}
                style={[s.unitChip, selectedUnit === 'kg' && s.unitChipSelected]}
              >
                <Text
                  style={[
                    s.unitChipText,
                    selectedUnit === 'kg' && s.unitChipTextSelected,
                  ]}
                >
                  kg
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setSelectedUnit('lbs')}
                style={[s.unitChip, selectedUnit === 'lbs' && s.unitChipSelected]}
              >
                <Text
                  style={[
                    s.unitChipText,
                    selectedUnit === 'lbs' && s.unitChipTextSelected,
                  ]}
                >
                  lbs
                </Text>
              </Pressable>
            </View>
          </View>
          <View style={s.actionRow}>
            <Pressable onPress={handleCancel} hitSlop={8}>
              <Text style={s.cancelText}>Cancel</Text>
            </Pressable>
            <Button
              title="Save"
              onPress={handleSave}
              loading={saving}
              disabled={!weightInput || parseFloat(weightInput) <= 0}
            />
          </View>
        </View>
      )}
    </Card>
  );
}

const s = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  weightDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  weightValue: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '700',
  },
  weightUnit: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: '500',
  },
  btnRow: {
    marginTop: 4,
  },
  inputArea: {
    marginTop: 8,
    gap: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    borderWidth: 1,
    borderColor: colors.surfaceElevated,
  },
  unitRow: {
    flexDirection: 'row',
    gap: 4,
  },
  unitChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.surfaceElevated,
  },
  unitChipSelected: {
    backgroundColor: `${colors.accent}33`,
    borderColor: colors.accent,
  },
  unitChipText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  unitChipTextSelected: {
    color: colors.accent,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cancelText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
});
