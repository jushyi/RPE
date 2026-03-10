import { useMemo } from 'react';
import { useBodyMeasurementStore } from '@/stores/bodyMeasurementStore';
import { convertMeasurement } from '../utils/unitConversion';
import type { BodyMetric, CircumferenceUnit, CircumferenceMetric } from '../types';

interface ChartDataPoint {
  date: number;
  value: number;
}

const CIRCUMFERENCE_METRICS: CircumferenceMetric[] = ['chest', 'waist', 'hips'];

/**
 * Returns chart-ready data for a specific body metric.
 * For circumference metrics, converts all values to the specified displayUnit.
 * For body_fat_pct, displayUnit is ignored (percentage is unitless).
 * Returns sorted (ascending by date) array of { date, value }.
 */
export function useBodyMetricsChartData(
  metric: BodyMetric,
  displayUnit: CircumferenceUnit,
): ChartDataPoint[] {
  const measurements = useBodyMeasurementStore((s) => s.measurements);

  return useMemo(() => {
    const isCircumference = CIRCUMFERENCE_METRICS.includes(metric as CircumferenceMetric);
    const unitKey = `${metric}_unit` as const;

    const points: ChartDataPoint[] = [];

    for (const m of measurements) {
      const value = m[metric as keyof typeof m] as number | null;
      if (value == null) continue;

      let converted: number;
      if (isCircumference) {
        const fromUnit = m[unitKey as keyof typeof m] as CircumferenceUnit;
        converted = convertMeasurement(value, fromUnit, displayUnit);
      } else {
        converted = value;
      }

      points.push({
        date: new Date(m.measured_at).getTime(),
        value: converted,
      });
    }

    // Sort ascending by date
    points.sort((a, b) => a.date - b.date);

    return points;
  }, [measurements, metric, displayUnit]);
}
