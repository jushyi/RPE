/**
 * CSV Export Utilities
 *
 * Pure functions for generating RFC 4180-compliant CSV from app data.
 * Used by useDataExport hook to create a single combined export file.
 */

export function escapeCSVField(field: string | number | null | undefined): string {
  if (field === null || field === undefined) return '';
  const str = String(field);
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function toCSV(headers: string[], rows: (string | number | null)[][]): string {
  const headerLine = headers.map(escapeCSVField).join(',');
  if (rows.length === 0) return headerLine;
  const dataLines = rows.map((row) => row.map(escapeCSVField).join(','));
  return [headerLine, ...dataLines].join('\n');
}

export function generateWorkoutCSV(sessions: any[]): string {
  const headers = ['Date', 'Title', 'Exercise', 'Set', 'Weight', 'Reps', 'RPE', 'Unit', 'PR', 'Est1RM'];
  const rows: (string | number | null)[][] = [];

  for (const session of sessions) {
    const date = session.started_at ? new Date(session.started_at).toISOString().split('T')[0] : '';
    const title = session.title ?? '';

    for (const se of session.session_exercises ?? []) {
      const exerciseName = se.exercises?.name ?? '';
      for (const log of se.set_logs ?? []) {
        rows.push([
          date,
          title,
          exerciseName,
          log.set_number ?? '',
          log.weight ?? '',
          log.reps ?? '',
          log.rpe ?? '',
          log.unit ?? '',
          log.is_pr ? 'Yes' : 'No',
          log.estimated_1rm ?? '',
        ]);
      }
    }
  }

  return toCSV(headers, rows);
}

export function generatePlansCSV(plans: any[]): string {
  const headers = ['Plan', 'Day', 'Exercise', 'Sets', 'Reps', 'Weight', 'RPE', 'Notes'];
  const rows: (string | number | null)[][] = [];

  for (const plan of plans) {
    const planName = plan.name ?? '';
    for (const day of plan.plan_days ?? []) {
      const dayLabel = day.day_of_week ?? '';
      for (const pde of day.plan_day_exercises ?? []) {
        rows.push([
          planName,
          dayLabel,
          pde.exercises?.name ?? '',
          pde.target_sets ?? '',
          pde.target_reps ?? '',
          pde.target_weight ?? '',
          pde.target_rpe ?? '',
          pde.notes ?? '',
        ]);
      }
    }
  }

  return toCSV(headers, rows);
}

export function generateBodyMetricsCSV(bodyweight: any[], measurements: any[]): string {
  const bwHeaders = ['Date', 'Weight', 'Unit'];
  const bwRows: (string | number | null)[][] = bodyweight.map((bw) => [
    bw.logged_at ? new Date(bw.logged_at).toISOString().split('T')[0] : '',
    bw.weight ?? '',
    bw.unit ?? '',
  ]);
  const bwCSV = toCSV(bwHeaders, bwRows);

  const mHeaders = ['Date', 'Chest', 'Chest Unit', 'Waist', 'Waist Unit', 'Hips', 'Hips Unit', 'Body Fat %'];
  const mRows: (string | number | null)[][] = measurements.map((m) => [
    m.logged_at ? new Date(m.logged_at).toISOString().split('T')[0] : '',
    m.chest ?? '',
    m.chest_unit ?? '',
    m.waist ?? '',
    m.waist_unit ?? '',
    m.hips ?? '',
    m.hips_unit ?? '',
    m.body_fat_pct ?? '',
  ]);
  const mCSV = toCSV(mHeaders, mRows);

  return `${bwCSV}\n\n${mCSV}`;
}

export function generatePRDataCSV(baselines: any[]): string {
  const headers = ['Exercise', 'Weight', 'Unit'];
  const rows: (string | number | null)[][] = baselines.map((b) => [
    b.exercises?.name ?? '',
    b.weight ?? '',
    b.unit ?? '',
  ]);
  return toCSV(headers, rows);
}

export function combineExportSections(sections: { title: string; csv: string }[]): string {
  return sections
    .map((section) => `=== ${section.title} ===\n${section.csv}`)
    .join('\n\n');
}
