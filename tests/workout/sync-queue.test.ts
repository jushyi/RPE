import {
  enqueueSyncItem,
  flushSyncQueue,
  enqueueCompletedSession,
  getPendingQueue,
  clearPendingQueue,
} from '@/features/workout/hooks/useSyncQueue';
import type { WorkoutSession } from '@/features/workout/types';
import NetInfo from '@react-native-community/netinfo';

// Reset mock storage between tests
beforeEach(() => {
  clearPendingQueue();
  jest.clearAllMocks();
});

describe('Sync Queue', () => {
  describe('enqueueSyncItem', () => {
    it('adds item to pending queue', () => {
      enqueueSyncItem({
        id: 'item-1',
        table: 'workout_sessions',
        operation: 'insert',
        data: { id: 'session-1', user_id: 'user-1' },
        created_at: '2026-03-09T10:00:00Z',
      });

      const queue = getPendingQueue();
      expect(queue).toHaveLength(1);
      expect(queue[0].id).toBe('item-1');
      expect(queue[0].table).toBe('workout_sessions');
    });

    it('appends multiple items to queue', () => {
      enqueueSyncItem({
        id: 'item-1',
        table: 'workout_sessions',
        operation: 'insert',
        data: { id: 's1' },
        created_at: '2026-03-09T10:00:00Z',
      });
      enqueueSyncItem({
        id: 'item-2',
        table: 'set_logs',
        operation: 'insert',
        data: { id: 's2' },
        created_at: '2026-03-09T10:01:00Z',
      });

      const queue = getPendingQueue();
      expect(queue).toHaveLength(2);
    });
  });

  describe('flushSyncQueue', () => {
    const mockSupabase = {
      from: jest.fn().mockReturnValue({
        insert: jest.fn().mockResolvedValue({ data: null, error: null }),
        upsert: jest.fn().mockResolvedValue({ data: null, error: null }),
      }),
    };

    it('processes items and clears queue on success', async () => {
      enqueueSyncItem({
        id: 'item-1',
        table: 'workout_sessions',
        operation: 'insert',
        data: { id: 'session-1' },
        created_at: '2026-03-09T10:00:00Z',
      });

      await flushSyncQueue(mockSupabase as any);

      const queue = getPendingQueue();
      expect(queue).toHaveLength(0);
      expect(mockSupabase.from).toHaveBeenCalledWith('workout_sessions');
    });

    it('keeps failed items in queue', async () => {
      const failingSupabase = {
        from: jest.fn().mockReturnValue({
          insert: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Network error' },
          }),
          upsert: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Network error' },
          }),
        }),
      };

      enqueueSyncItem({
        id: 'item-1',
        table: 'workout_sessions',
        operation: 'insert',
        data: { id: 'session-1' },
        created_at: '2026-03-09T10:00:00Z',
      });

      await flushSyncQueue(failingSupabase as any);

      const queue = getPendingQueue();
      expect(queue).toHaveLength(1);
      expect(queue[0].id).toBe('item-1');
    });

    it('skips when offline', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValueOnce({
        isConnected: false,
      });

      enqueueSyncItem({
        id: 'item-1',
        table: 'workout_sessions',
        operation: 'insert',
        data: { id: 'session-1' },
        created_at: '2026-03-09T10:00:00Z',
      });

      await flushSyncQueue(mockSupabase as any);

      const queue = getPendingQueue();
      expect(queue).toHaveLength(1); // Still in queue
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('returns immediately for empty queue', async () => {
      await flushSyncQueue(mockSupabase as any);
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });
  });

  describe('enqueueCompletedSession', () => {
    it('creates correct number of sync items (1 session + N exercises + M sets)', () => {
      const session: WorkoutSession = {
        id: 'session-1',
        user_id: 'user-1',
        plan_id: 'plan-1',
        plan_day_id: 'day-1',
        title: 'Workout',
        started_at: '2026-03-09T10:00:00Z',
        ended_at: '2026-03-09T11:00:00Z',
        exercises: [
          {
            id: 'se-1',
            exercise_id: 'ex-1',
            exercise_name: 'Bench Press',
            sort_order: 0,
            target_sets: [],
            weight_progression: 'manual',
            unit: 'lbs',
            logged_sets: [
              {
                id: 'set-1',
                set_number: 1,
                weight: 185,
                reps: 8,
                rpe: null,
                unit: 'lbs',
                is_pr: false,
                logged_at: '2026-03-09T10:05:00Z',
              },
              {
                id: 'set-2',
                set_number: 2,
                weight: 185,
                reps: 7,
                rpe: null,
                unit: 'lbs',
                is_pr: false,
                logged_at: '2026-03-09T10:10:00Z',
              },
            ],
          },
          {
            id: 'se-2',
            exercise_id: 'ex-2',
            exercise_name: 'Squat',
            sort_order: 1,
            target_sets: [],
            weight_progression: 'carry_previous',
            unit: 'lbs',
            logged_sets: [
              {
                id: 'set-3',
                set_number: 1,
                weight: 225,
                reps: 5,
                rpe: null,
                unit: 'lbs',
                is_pr: true,
                logged_at: '2026-03-09T10:20:00Z',
              },
            ],
          },
        ],
      };

      enqueueCompletedSession(session);

      const queue = getPendingQueue();
      // 1 session + 2 exercises + 3 sets = 6 items
      expect(queue).toHaveLength(6);

      // First item should be the workout session
      expect(queue[0].table).toBe('workout_sessions');
      expect(queue[0].operation).toBe('insert');

      // Next items should be session exercises
      const exerciseItems = queue.filter((i) => i.table === 'session_exercises');
      expect(exerciseItems).toHaveLength(2);

      // Remaining items should be set logs
      const setItems = queue.filter((i) => i.table === 'set_logs');
      expect(setItems).toHaveLength(3);
    });
  });
});
