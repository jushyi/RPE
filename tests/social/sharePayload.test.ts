import {
  buildWorkoutPayload,
  buildPRPayload,
  buildVideoPayload,
} from '@/features/social/utils/sharePayload';
import type { WorkoutSession, SessionExercise, SetLog } from '@/features/workout/types';

// Minimal mock session for testing
const mockSession: WorkoutSession = {
  id: 'session-1',
  user_id: 'user-1',
  plan_id: null,
  plan_day_id: null,
  title: 'Morning Workout',
  started_at: '2026-03-13T08:00:00Z',
  ended_at: '2026-03-13T09:00:00Z',
  exercises: [
    {
      id: 'ex-1',
      exercise_id: 'exid-1',
      exercise_name: 'Bench Press',
      sort_order: 0,
      target_sets: [],
      weight_progression: 'manual',
      unit: 'kg',
      logged_sets: [
        { id: 's1', set_number: 1, weight: 100, reps: 5, rpe: null, unit: 'kg', is_pr: false, logged_at: '2026-03-13T08:10:00Z' },
        { id: 's2', set_number: 2, weight: 100, reps: 5, rpe: null, unit: 'kg', is_pr: false, logged_at: '2026-03-13T08:15:00Z' },
        { id: 's3', set_number: 3, weight: 100, reps: 5, rpe: null, unit: 'kg', is_pr: false, logged_at: '2026-03-13T08:20:00Z' },
      ],
    },
    {
      id: 'ex-2',
      exercise_id: 'exid-2',
      exercise_name: 'Squat',
      sort_order: 1,
      target_sets: [],
      weight_progression: 'manual',
      unit: 'kg',
      logged_sets: [
        { id: 's4', set_number: 1, weight: 120, reps: 5, rpe: null, unit: 'kg', is_pr: false, logged_at: '2026-03-13T08:30:00Z' },
        { id: 's5', set_number: 2, weight: 120, reps: 5, rpe: null, unit: 'kg', is_pr: false, logged_at: '2026-03-13T08:35:00Z' },
      ],
    },
  ],
};

describe('buildWorkoutPayload', () => {
  it('returns content_type "workout"', () => {
    const result = buildWorkoutPayload(mockSession);
    expect(result.content_type).toBe('workout');
  });

  it('includes exercise names array', () => {
    const result = buildWorkoutPayload(mockSession);
    expect(result.payload.exercise_names).toEqual(['Bench Press', 'Squat']);
  });

  it('calculates total_sets correctly', () => {
    const result = buildWorkoutPayload(mockSession);
    expect(result.payload.total_sets).toBe(5); // 3 + 2
  });

  it('calculates total_volume correctly', () => {
    const result = buildWorkoutPayload(mockSession);
    // Bench: 100*5*3=1500, Squat: 120*5*2=1200, total=2700
    expect(result.payload.total_volume).toBe(2700);
  });

  it('calculates duration_minutes from started_at and ended_at', () => {
    const result = buildWorkoutPayload(mockSession);
    expect(result.payload.duration_minutes).toBe(60); // 1 hour session
  });

  it('returns 0 duration if ended_at missing', () => {
    const sessionNoFinish: WorkoutSession = { ...mockSession, ended_at: null };
    const result = buildWorkoutPayload(sessionNoFinish);
    expect(result.payload.duration_minutes).toBe(0);
  });
});

describe('buildPRPayload', () => {
  it('returns content_type "pr"', () => {
    const result = buildPRPayload('Bench Press', 100, 5, 'kg');
    expect(result.content_type).toBe('pr');
  });

  it('includes correct exercise_name', () => {
    const result = buildPRPayload('Deadlift', 200, 1, 'kg');
    expect(result.payload.exercise_name).toBe('Deadlift');
  });

  it('includes correct weight and reps', () => {
    const result = buildPRPayload('Bench Press', 100, 5, 'kg');
    expect(result.payload.weight).toBe(100);
    expect(result.payload.reps).toBe(5);
  });

  it('includes unit', () => {
    const result = buildPRPayload('Squat', 225, 3, 'lbs');
    expect(result.payload.unit).toBe('lbs');
  });
});

describe('buildVideoPayload', () => {
  it('returns content_type "video"', () => {
    const result = buildVideoPayload(
      'https://example.com/video.mp4',
      'Bench Press',
      100,
      5,
      'kg',
      3
    );
    expect(result.content_type).toBe('video');
  });

  it('includes correct video_url', () => {
    const url = 'https://xyz.supabase.co/storage/v1/object/set-videos/foo.mp4';
    const result = buildVideoPayload(url, 'Squat', 120, 5, 'kg', 2);
    expect(result.payload.video_url).toBe(url);
  });

  it('includes exercise_name, weight, reps, unit, set_number', () => {
    const result = buildVideoPayload(
      'https://example.com/video.mp4',
      'Deadlift',
      200,
      1,
      'kg',
      1
    );
    expect(result.payload.exercise_name).toBe('Deadlift');
    expect(result.payload.weight).toBe(200);
    expect(result.payload.reps).toBe(1);
    expect(result.payload.unit).toBe('kg');
    expect(result.payload.set_number).toBe(1);
  });
});
