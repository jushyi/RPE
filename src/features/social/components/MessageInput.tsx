/**
 * MessageInput — expandable text input with send and media attachment buttons.
 *
 * - Expandable TextInput (maxHeight 120dp)
 * - Send button (Ionicons send) disabled when input is empty
 * - Media attachment button (Ionicons attach) opens ChatMediaPicker
 * - Shows pending media preview above input with cancel option
 * - Calls onTypingChange on each keystroke for typing indicator
 */

import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Image,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import type { ChatMediaResult } from '../hooks/useChatMedia';

interface MessageInputProps {
  onSend: (text: string, media?: ChatMediaResult) => void;
  onTypingChange?: (text: string) => void;
  onAttach?: () => void;
  uploading?: boolean;
  // Edit mode
  editingContent?: string | null;
  onCancelEdit?: () => void;
}

export function MessageInput({
  onSend,
  onTypingChange,
  onAttach,
  uploading = false,
  editingContent,
  onCancelEdit,
}: MessageInputProps) {
  const [text, setText] = useState('');
  const [pendingMedia, setPendingMedia] = useState<ChatMediaResult | null>(null);
  const inputRef = useRef<TextInput>(null);

  // When edit mode activates, populate input with existing content
  React.useEffect(() => {
    if (editingContent != null) {
      setText(editingContent);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [editingContent]);

  const canSend = text.trim().length > 0 || pendingMedia != null;

  const handleSend = () => {
    if (!canSend) return;
    onSend(text.trim(), pendingMedia ?? undefined);
    setText('');
    setPendingMedia(null);
  };

  const handleTextChange = (value: string) => {
    setText(value);
    onTypingChange?.(value);
  };

  return (
    <View style={s.wrapper}>
      {/* Edit mode banner */}
      {editingContent != null ? (
        <View style={s.editBanner}>
          <Text style={s.editBannerText} numberOfLines={1}>
            Editing message
          </Text>
          <TouchableOpacity onPress={onCancelEdit}>
            <Ionicons name="close-outline" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Media preview */}
      {pendingMedia ? (
        <View style={s.mediaPreview}>
          <Image
            source={{ uri: pendingMedia.mediaUrl }}
            style={s.mediaThumb}
            resizeMode="cover"
          />
          {pendingMedia.mediaType === 'video' ? (
            <View style={s.videoOverlay}>
              <Ionicons name="play-circle" size={20} color={colors.white} />
            </View>
          ) : null}
          <TouchableOpacity
            style={s.removeMedia}
            onPress={() => setPendingMedia(null)}
          >
            <Ionicons name="close-circle" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={s.row}>
        {/* Attach button */}
        <TouchableOpacity
          style={s.iconBtn}
          onPress={onAttach}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : (
            <Ionicons name="attach" size={22} color={colors.textMuted} />
          )}
        </TouchableOpacity>

        {/* Text input */}
        <TextInput
          ref={inputRef}
          style={s.input}
          value={text}
          onChangeText={handleTextChange}
          placeholder="Message..."
          placeholderTextColor={colors.textMuted}
          multiline
          maxLength={2000}
          returnKeyType="default"
        />

        {/* Send button */}
        <TouchableOpacity
          style={[s.iconBtn, s.sendBtn, canSend ? s.sendBtnActive : null]}
          onPress={handleSend}
          disabled={!canSend}
        >
          <Ionicons
            name="send"
            size={18}
            color={canSend ? colors.white : colors.textMuted}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceElevated,
    paddingBottom: 8,
    paddingTop: 8,
  },
  editBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  editBannerText: {
    fontSize: 12,
    color: colors.accent,
    fontStyle: 'italic',
  },
  mediaPreview: {
    marginHorizontal: 16,
    marginBottom: 8,
    alignSelf: 'flex-start',
    position: 'relative',
  },
  mediaThumb: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: colors.surfaceElevated,
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
  },
  removeMedia: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.surface,
    borderRadius: 11,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
  },
  iconBtn: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 40,
    minHeight: 40,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 15,
    color: colors.textPrimary,
    maxHeight: 120,
    lineHeight: 20,
  },
  sendBtn: {
    borderRadius: 20,
    width: 40,
    height: 40,
  },
  sendBtnActive: {
    backgroundColor: colors.accent,
  },
});
