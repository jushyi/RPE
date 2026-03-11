import {
  escapeCSVField,
  toCSV,
  generateWorkoutCSV,
  generatePlansCSV,
  generateBodyMetricsCSV,
  generatePRDataCSV,
  combineExportSections,
} from '@/features/settings/utils/csvExport';

describe('escapeCSVField', () => {
  it('returns empty string for null', () => {
    expect(escapeCSVField(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(escapeCSVField(undefined)).toBe('');
  });

  it('returns plain string as-is', () => {
    expect(escapeCSVField('hello')).toBe('hello');
  });

  it('returns number as string', () => {
    expect(escapeCSVField(42)).toBe('42');
  });

  it('wraps string with comma in double quotes', () => {
    expect(escapeCSVField('hello, world')).toBe('"hello, world"');
  });

  it('escapes double quotes by doubling and wraps', () => {
    expect(escapeCSVField('say "hi"')).toBe('"say ""hi"""');
  });

  it('wraps string with newline in double quotes', () => {
    expect(escapeCSVField('line1\nline2')).toBe('"line1\nline2"');
  });
});

describe('toCSV', () => {
  it('produces header line + data lines joined by newline', () => {
    const result = toCSV(['Name', 'Age'], [['Alice', 30], ['Bob', 25]]);
    expect(result).toBe('Name,Age\nAlice,30\nBob,25');
  });

  it('produces header line only for empty rows', () => {
    const result = toCSV(['Name', 'Age'], []);
    expect(result).toBe('Name,Age');
  });

  it('handles null values in rows', () => {
    const result = toCSV(['A', 'B'], [['x', null]]);
    expect(result).toBe('A,B\nx,');
  });
});

describe('generateWorkoutCSV', () => {
  it('produces section with correct headers', () => {
    const sessions = [
      {
        started_at: '2026-01-15T10:00:00Z',
        title: 'Push Day',
        session_exercises: [
          {
            exercises: { name: 'Bench Press' },
            set_logs: [
              { set_number: 1, weight: 135, reps: 10, rpe: 7, unit: 'lbs', is_pr: false, estimated_1rm: 180 },
            ],
          },
        ],
      },
    ];
    const result = generateWorkoutCSV(sessions);
    const lines = result.split('\n');
    expect(lines[0]).toBe('Date,Title,Exercise,Set,Weight,Reps,RPE,Unit,PR,Est1RM');
    expect(lines[1]).toContain('Bench Press');
    expect(lines[1]).toContain('135');
  });

  it('returns header only for empty sessions', () => {
    const result = generateWorkoutCSV([]);
    expect(result).toBe('Date,Title,Exercise,Set,Weight,Reps,RPE,Unit,PR,Est1RM');
  });
});

describe('generatePlansCSV', () => {
  it('produces section with correct headers', () => {
    const plans = [
      {
        name: 'PPL',
        plan_days: [
          {
            day_of_week: 1,
            plan_day_exercises: [
              {
                exercises: { name: 'Squat' },
                target_sets: 3,
                target_reps: 5,
                target_weight: 225,
                target_rpe: 8,
                notes: 'Go deep',
              },
            ],
          },
        ],
      },
    ];
    const result = generatePlansCSV(plans);
    const lines = result.split('\n');
    expect(lines[0]).toBe('Plan,Day,Exercise,Sets,Reps,Weight,RPE,Notes');
    expect(lines[1]).toContain('PPL');
    expect(lines[1]).toContain('Squat');
  });

  it('returns header only for empty plans', () => {
    const result = generatePlansCSV([]);
    expect(result).toBe('Plan,Day,Exercise,Sets,Reps,Weight,RPE,Notes');
  });
});

describe('generateBodyMetricsCSV', () => {
  it('produces sections for bodyweight and measurements', () => {
    const bodyweight = [
      { weight: 180, unit: 'lbs', logged_at: '2026-01-15T10:00:00Z' },
    ];
    const measurements = [
      {
        logged_at: '2026-01-15T10:00:00Z',
        chest: 40, chest_unit: 'in',
        waist: 32, waist_unit: 'in',
        hips: 38, hips_unit: 'in',
        body_fat_pct: 15,
      },
    ];
    const result = generateBodyMetricsCSV(bodyweight, measurements);
    expect(result).toContain('Date,Weight,Unit');
    expect(result).toContain('180');
    expect(result).toContain('Date,Chest,Chest Unit,Waist,Waist Unit,Hips,Hips Unit,Body Fat %');
    expect(result).toContain('40');
  });

  it('handles empty arrays', () => {
    const result = generateBodyMetricsCSV([], []);
    expect(result).toContain('Date,Weight,Unit');
    expect(result).toContain('Date,Chest,Chest Unit,Waist,Waist Unit,Hips,Hips Unit,Body Fat %');
  });
});

describe('generatePRDataCSV', () => {
  it('produces section for PR baselines', () => {
    const baselines = [
      { exercises: { name: 'Deadlift' }, weight: 405, unit: 'lbs' },
    ];
    const result = generatePRDataCSV(baselines);
    const lines = result.split('\n');
    expect(lines[0]).toBe('Exercise,Weight,Unit');
    expect(lines[1]).toContain('Deadlift');
    expect(lines[1]).toContain('405');
  });

  it('returns header only for empty baselines', () => {
    const result = generatePRDataCSV([]);
    expect(result).toBe('Exercise,Weight,Unit');
  });
});

describe('combineExportSections', () => {
  it('joins sections with blank line separators and section headers', () => {
    const sections = [
      { title: 'Workouts', csv: 'Date,Title\n2026-01-15,Push' },
      { title: 'Plans', csv: 'Plan,Day\nPPL,1' },
    ];
    const result = combineExportSections(sections);
    expect(result).toContain('=== Workouts ===');
    expect(result).toContain('=== Plans ===');
    expect(result).toContain('Date,Title');
    expect(result).toContain('Plan,Day');
  });

  it('handles single section', () => {
    const sections = [{ title: 'Test', csv: 'A,B\n1,2' }];
    const result = combineExportSections(sections);
    expect(result).toContain('=== Test ===');
    expect(result).toContain('A,B');
  });
});
