import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Platform,
  StyleSheet,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import type { BodyMeasurement, CircumferenceUnit } from '../types';

interface MeasurementFormProps {
  onSave: (data: {
    bodyweight?: number | null;
    bodyweight_unit?: 'lbs' | 'kg';
    chest?: number | null;
    chest_unit?: CircumferenceUnit | null;
    waist?: number | null;
    waist_unit?: CircumferenceUnit | null;
    hips?: number | null;
    hips_unit?: CircumferenceUnit | null;
    body_fat_pct?: number | null;
    measured_at: string;
    editId?: string;
  }) => Promise<void>;
  editEntry?: BodyMeasurement | null;
  onCancelEdit?: () => void;
  latestMeasurement?: BodyMeasurement | null;
}

function formatDate(date: Date): string {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function toISODate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function MeasurementForm({
  onSave,
  editEntry,
  onCancelEdit,
  latestMeasurement,
}: MeasurementFormProps) {
  const [bodyweight, setBodyweight] = useState('');
  const [bodyweightUnit, setBodyweightUnit] = useState<'lbs' | 'kg'>('lbs');
  const [chest, setChest] = useState('');
  const [chestUnit, setChestUnit] = useState<CircumferenceUnit>('in');
  const [waist, setWaist] = useState('');
  const [waistUnit, setWaistUnit] = useState<CircumferenceUnit>('in');
  const [hips, setHips] = useState('');
  const [hipsUnit, setHipsUnit] = useState<CircumferenceUnit>('in');
  const [bodyFat, setBodyFat] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Pre-fill units from latest measurement
  useEffect(() => {
    if (latestMeasurement && !editEntry) {
      if (latestMeasurement.chest_unit) setChestUnit(latestMeasurement.chest_unit);
      if (latestMeasurement.waist_unit) setWaistUnit(latestMeasurement.waist_unit);
      if (latestMeasurement.hips_unit) setHipsUnit(latestMeasurement.hips_unit);
    }
  }, [latestMeasurement, editEntry]);

  // Pre-fill form when editing
  useEffect(() => {
    if (editEntry) {
      setChest(editEntry.chest != null ? String(editEntry.chest) : '');
      setChestUnit(editEntry.chest_unit ?? 'in');
      setWaist(editEntry.waist != null ? String(editEntry.waist) : '');
      setWaistUnit(editEntry.waist_unit ?? 'in');
      setHips(editEntry.hips != null ? String(editEntry.hips) : '');
      setHipsUnit(editEntry.hips_unit ?? 'in');
      setBodyFat(editEntry.body_fat_pct != null ? String(editEntry.body_fat_pct) : '');
      setDate(new Date(editEntry.measured_at));
      setBodyweight('');
      setError('');
    }
  }, [editEntry]);

  const clearForm = () => {
    setBodyweight('');
    setChest('');
    setWaist('');
    setHips('');
    setBodyFat('');
    setDate(new Date());
    setError('');
  };

  const handleSave = async () => {
    const bw = bodyweight.trim() ? parseFloat(bodyweight) : null;
    const ch = chest.trim() ? parseFloat(chest) : null;
    const wa = waist.trim() ? parseFloat(waist) : null;
    const hi = hips.trim() ? parseFloat(hips) : null;
    const bf = bodyFat.trim() ? parseFloat(bodyFat) : null;

    // Validate at least one field
    if (bw == null && ch == null && wa == null && hi == null && bf == null) {
      setError('Enter at least one measurement');
      return;
    }

    setError('');
    setSaving(true);

    try {
      await onSave({
        bodyweight: bw,
        bodyweight_unit: bw != null ? bodyweightUnit : undefined,
        chest: ch,
        chest_unit: ch != null ? chestUnit : null,
        waist: wa,
        waist_unit: wa != null ? waistUnit : null,
        hips: hi,
        hips_unit: hi != null ? hipsUnit : null,
        body_fat_pct: bf,
        measured_at: toISODate(date),
        editId: editEntry?.id,
      });

      // Haptic feedback on success
      try {
        const Haptics = require('expo-haptics');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        // Haptics not available
      }

      clearForm();
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDateChange = (_event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  return (
    <View style={s.container}>
      <Text style={s.sectionTitle}>
        {editEntry ? 'Edit Measurement' : 'Log Measurement'}
      </Text>

      {/* Date Picker */}
      <Pressable
        style={s.dateRow}
        onPress={() => setShowDatePicker(true)}
      >
        <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
        <Text style={s.dateText}>{formatDate(date)}</Text>
        <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
      </Pressable>

      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          maximumDate={new Date()}
          onChange={handleDateChange}
          themeVariant="dark"
        />
      )}

      {/* Bodyweight */}
      <FieldRow
        label="Bodyweight"
        value={bodyweight}
        onChangeText={setBodyweight}
        unit={bodyweightUnit}
        onToggleUnit={() => setBodyweightUnit((u) => (u === 'lbs' ? 'kg' : 'lbs'))}
        showUnitToggle
      />

      {/* Chest */}
      <FieldRow
        label="Chest"
        value={chest}
        onChangeText={setChest}
        unit={chestUnit}
        onToggleUnit={() => setChestUnit((u) => (u === 'in' ? 'cm' : 'in'))}
        showUnitToggle
      />

      {/* Waist */}
      <FieldRow
        label="Waist"
        value={waist}
        onChangeText={setWaist}
        unit={waistUnit}
        onToggleUnit={() => setWaistUnit((u) => (u === 'in' ? 'cm' : 'in'))}
        showUnitToggle
      />

      {/* Hips */}
      <FieldRow
        label="Hips"
        value={hips}
        onChangeText={setHips}
        unit={hipsUnit}
        onToggleUnit={() => setHipsUnit((u) => (u === 'in' ? 'cm' : 'in'))}
        showUnitToggle
      />

      {/* Body Fat % */}
      <FieldRow
        label="Body Fat"
        value={bodyFat}
        onChangeText={setBodyFat}
        unit="%"
        showUnitToggle={false}
      />

      {/* Error */}
      {error ? <Text style={s.errorText}>{error}</Text> : null}

      {/* Buttons */}
      <View style={s.buttonRow}>
        {editEntry && (
          <Pressable
            style={s.cancelBtn}
            onPress={() => {
              clearForm();
              onCancelEdit?.();
            }}
          >
            <Text style={s.cancelBtnText}>Cancel</Text>
          </Pressable>
        )}
        <Pressable
          style={[s.saveBtn, saving && s.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={s.saveBtnText}>
            {editEntry ? 'Update' : 'Save'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

/** Reusable field row with label, input, and optional unit toggle */
function FieldRow({
  label,
  value,
  onChangeText,
  unit,
  onToggleUnit,
  showUnitToggle,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  unit: string;
  onToggleUnit?: () => void;
  showUnitToggle: boolean;
}) {
  return (
    <View style={s.fieldRow}>
      <Text style={s.fieldLabel}>{label}</Text>
      <View style={s.fieldInputGroup}>
        <TextInput
          style={s.fieldInput}
          value={value}
          onChangeText={onChangeText}
          keyboardType="decimal-pad"
          placeholder="--"
          placeholderTextColor={colors.textMuted}
        />
        {showUnitToggle && onToggleUnit ? (
          <Pressable style={s.unitToggle} onPress={onToggleUnit}>
            <Text style={s.unitToggleText}>{unit}</Text>
          </Pressable>
        ) : (
          <View style={s.unitLabel}>
            <Text style={s.unitLabelText}>{unit}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    gap: 8,
  },
  dateText: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  fieldLabel: {
    width: 90,
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  fieldInputGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fieldInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: colors.textPrimary,
    fontSize: 16,
  },
  unitToggle: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 48,
    alignItems: 'center',
  },
  unitToggleText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '700',
  },
  unitLabel: {
    paddingHorizontal: 8,
    minWidth: 48,
    alignItems: 'center',
  },
  unitLabelText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    marginTop: 4,
    marginBottom: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '700',
  },
  saveBtn: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
