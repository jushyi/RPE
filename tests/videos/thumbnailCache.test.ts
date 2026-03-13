/**
 * Unit tests for thumbnailCache pure logic.
 * MMKV is mocked with an in-memory map (via moduleNameMapper).
 */

import {
  getCachedThumbnail,
  cacheThumbnail,
  invalidateThumbnail,
} from '@/features/videos/utils/thumbnailCache';

const mmkvModule = require('react-native-mmkv');

beforeEach(() => {
  const instance = mmkvModule.createMMKV();
  instance.clearAll();
  jest.clearAllMocks();
});

describe('thumbnailCache', () => {
  test('cacheThumbnail stores URI and getCachedThumbnail retrieves it', () => {
    cacheThumbnail('set-1', '/thumbs/set-1.jpg');

    const result = getCachedThumbnail('set-1');
    expect(result).toBe('/thumbs/set-1.jpg');
  });

  test('getCachedThumbnail returns null for unknown setLogId', () => {
    const result = getCachedThumbnail('unknown-id');
    expect(result).toBeNull();
  });

  test('invalidateThumbnail removes cached entry', () => {
    cacheThumbnail('set-1', '/thumbs/set-1.jpg');
    invalidateThumbnail('set-1');

    const result = getCachedThumbnail('set-1');
    expect(result).toBeNull();
  });

  test('overwriting a cached thumbnail replaces the old value', () => {
    cacheThumbnail('set-1', '/thumbs/old.jpg');
    cacheThumbnail('set-1', '/thumbs/new.jpg');

    const result = getCachedThumbnail('set-1');
    expect(result).toBe('/thumbs/new.jpg');
  });
});
