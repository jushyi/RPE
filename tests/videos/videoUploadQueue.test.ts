/**
 * Unit tests for videoUploadQueue pure logic.
 * MMKV is mocked with an in-memory map (via moduleNameMapper).
 */

import {
  enqueueVideoUpload,
  getVideoQueue,
  removeFromQueue,
} from '@/features/videos/utils/videoUploadQueue';
import type { VideoUploadItem } from '@/features/videos/types';

// Clear MMKV mock storage between tests
const mmkvModule = require('react-native-mmkv');

function makeItem(overrides: Partial<VideoUploadItem> = {}): VideoUploadItem {
  return {
    setLogId: 'set-1',
    userId: 'user-1',
    localUri: '/cache/video.mp4',
    thumbnailUri: '/cache/thumb.jpg',
    createdAt: '2026-03-12T00:00:00Z',
    ...overrides,
  };
}

beforeEach(() => {
  // Reset MMKV mock storage
  const instance = mmkvModule.createMMKV();
  instance.clearAll();
  jest.clearAllMocks();
});

describe('videoUploadQueue', () => {
  test('getVideoQueue returns empty array when no items queued', () => {
    expect(getVideoQueue()).toEqual([]);
  });

  test('enqueueVideoUpload adds item to queue and getVideoQueue returns it', async () => {
    const item = makeItem();
    await enqueueVideoUpload(item);

    const queue = getVideoQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0].setLogId).toBe('set-1');
    expect(queue[0].userId).toBe('user-1');
  });

  test('enqueuing multiple items returns all in getVideoQueue', async () => {
    await enqueueVideoUpload(makeItem({ setLogId: 'set-1' }));
    await enqueueVideoUpload(makeItem({ setLogId: 'set-2' }));
    await enqueueVideoUpload(makeItem({ setLogId: 'set-3' }));

    const queue = getVideoQueue();
    expect(queue).toHaveLength(3);
    expect(queue.map((q) => q.setLogId)).toEqual(['set-1', 'set-2', 'set-3']);
  });

  test('removeFromQueue removes the correct item by setLogId', async () => {
    await enqueueVideoUpload(makeItem({ setLogId: 'set-1' }));
    await enqueueVideoUpload(makeItem({ setLogId: 'set-2' }));

    removeFromQueue('set-1');

    const queue = getVideoQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0].setLogId).toBe('set-2');
  });

  test('removeFromQueue with non-existent setLogId does not throw', async () => {
    await enqueueVideoUpload(makeItem({ setLogId: 'set-1' }));

    expect(() => removeFromQueue('non-existent')).not.toThrow();

    const queue = getVideoQueue();
    expect(queue).toHaveLength(1);
  });

  test('queue persists across calls (MMKV mock retains state within test)', async () => {
    await enqueueVideoUpload(makeItem({ setLogId: 'set-1' }));

    // Call getVideoQueue multiple times to verify persistence
    const queue1 = getVideoQueue();
    const queue2 = getVideoQueue();
    expect(queue1).toEqual(queue2);
    expect(queue1).toHaveLength(1);
  });
});
