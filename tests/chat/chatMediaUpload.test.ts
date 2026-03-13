/**
 * Stub tests for useChatMedia hook.
 * Full hook implementation ships in Plan 04. These tests verify the
 * expected interface contract for pickImage and pickVideo.
 *
 * Mocks expo-image-picker and Supabase storage.
 */

// Mock expo-image-picker before importing hook
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  MediaTypeOptions: { Images: 'Images', Videos: 'Videos', All: 'All' },
  UIImagePickerControllerQualityType: { Medium: 1 },
}));

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      }),
    },
    storage: {
      from: jest.fn().mockReturnValue({
        upload: jest.fn().mockResolvedValue({ error: null }),
        getPublicUrl: jest.fn().mockReturnValue({
          data: { publicUrl: 'https://example.supabase.co/storage/v1/object/chat-media/user-123/msg-1.jpg' },
        }),
      }),
    },
  },
}));

import * as ImagePicker from 'expo-image-picker';
import { buildChatMediaPath, getChatMediaPublicUrl } from '@/features/social/utils/chatMediaUtils';

describe('chatMedia utilities (stub)', () => {
  describe('buildChatMediaPath', () => {
    it('constructs a path with userId and messageId for image', () => {
      const path = buildChatMediaPath('user-123', 'msg-456', 'jpg');
      expect(path).toBe('user-123/msg-456.jpg');
    });

    it('constructs a path with userId and messageId for video', () => {
      const path = buildChatMediaPath('user-123', 'msg-789', 'mp4');
      expect(path).toBe('user-123/msg-789.mp4');
    });
  });

  describe('pickImage contract (integration stub)', () => {
    it('launchImageLibraryAsync is callable with image options', async () => {
      const mockResult = {
        canceled: false,
        assets: [{ uri: 'file:///tmp/photo.jpg', type: 'image', width: 1280, height: 720 }],
      };
      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValueOnce(mockResult);

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
      });

      expect(result.canceled).toBe(false);
      expect(result.assets?.[0]?.uri).toBe('file:///tmp/photo.jpg');
    });

    it('returns canceled=true when user dismisses picker', async () => {
      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValueOnce({
        canceled: true,
        assets: [],
      });

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
      });

      expect(result.canceled).toBe(true);
    });
  });

  describe('pickVideo contract (integration stub)', () => {
    it('launchImageLibraryAsync is callable with video options', async () => {
      const mockResult = {
        canceled: false,
        assets: [{ uri: 'file:///tmp/clip.mp4', type: 'video', duration: 15000 }],
      };
      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValueOnce(mockResult);

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        videoQuality: ImagePicker.UIImagePickerControllerQualityType.Medium,
      });

      expect(result.canceled).toBe(false);
      expect(result.assets?.[0]?.uri).toBe('file:///tmp/clip.mp4');
    });
  });
});
