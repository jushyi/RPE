import { useState, useEffect, useCallback } from 'react';
import { createMMKV } from 'react-native-mmkv';
import { LB_PLATES, KG_PLATES } from '@/features/calculator/constants/plates';

const storage = createMMKV({ id: 'plate-inventory' });

const KEYS = {
  lb: 'inventory-lb',
  kg: 'inventory-kg',
} as const;

function getAllPlates(unit: 'kg' | 'lbs'): number[] {
  return unit === 'kg' ? KG_PLATES : LB_PLATES;
}

function readEnabled(unit: 'kg' | 'lbs'): number[] {
  const key = unit === 'kg' ? KEYS.kg : KEYS.lb;
  const raw = storage.getString(key);
  if (!raw) return getAllPlates(unit); // default: all enabled
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as number[];
    return getAllPlates(unit);
  } catch {
    return getAllPlates(unit);
  }
}

function writeEnabled(unit: 'kg' | 'lbs', plates: number[]): void {
  const key = unit === 'kg' ? KEYS.kg : KEYS.lb;
  storage.set(key, JSON.stringify(plates));
}

/**
 * Hook providing plate inventory management with MMKV persistence.
 *
 * Maintains independent enabled plate lists for lb and kg.
 * Default state: all plates enabled.
 */
export function usePlateInventory(unit: 'kg' | 'lbs') {
  const allPlates = getAllPlates(unit);
  const [enabledPlates, setEnabledPlates] = useState<number[]>(() =>
    readEnabled(unit)
  );

  // Re-read from MMKV when unit changes
  useEffect(() => {
    setEnabledPlates(readEnabled(unit));
  }, [unit]);

  const toggle = useCallback(
    (weight: number) => {
      setEnabledPlates((prev) => {
        const next = prev.includes(weight)
          ? prev.filter((w) => w !== weight)
          : [...prev, weight].sort((a, b) => b - a); // keep descending
        writeEnabled(unit, next);
        return next;
      });
    },
    [unit]
  );

  return {
    enabledPlates,
    allPlates,
    toggle,
    enabledCount: enabledPlates.length,
    totalCount: allPlates.length,
  };
}
