/**
 * MessageBubble — renders a single chat message.
 *
 * Own messages: right-aligned, accent background, no avatar.
 * Others' messages: left-aligned, surface background, avatar + name.
 * Deleted: "This message was deleted" placeholder in italics.
 * Edited: "edited" label below content.
 * Read receipts: single checkmark (delivered), double blue (read).
 * Media: Image tap opens fullscreen; Video shows thumbnail + play icon.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Modal,
  Pressable,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VideoView, useVideoPlayer } from 'expo-video';
import { colors } from '@/constants/theme';
import type { Message } from '@/features/social/types/chat';

interface MessageBubbleProps {
  message: Message;
  isMine: boolean;
  readStatus: 'sent' | 'delivered' | 'read';
  onLongPress?: () => void;
}

export function MessageBubble({
  message,
  isMine,
  readStatus,
  onLongPress,
}: MessageBubbleProps) {
  const [videoVisible, setVideoVisible] = useState(false);
  const [imageVisible, setImageVisible] = useState(false);

  const isDeleted = !!message.deleted_at;
  const isEdited = !!message.edited_at && !isDeleted;

  const senderName = message.profiles?.display_name ?? 'Someone';
  const senderAvatar = message.profiles?.avatar_url;

  const timestamp = formatTime(message.created_at);

  return (
    <View style={[s.row, isMine ? s.rowMine : s.rowOther]}>
      {/* Avatar for others */}
      {!isMine && (
        <View style={s.avatarContainer}>
          {senderAvatar ? (
            <Image source={{ uri: senderAvatar }} style={s.avatar} />
          ) : (
            <View style={s.avatarPlaceholder}>
              <Text style={s.avatarInitial}>
                {senderName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
      )}

      <View style={[s.bubbleWrapper, isMine ? s.bubbleWrapperMine : s.bubbleWrapperOther]}>
        {/* Sender name for others */}
        {!isMine && (
          <Text style={s.senderName}>{senderName}</Text>
        )}

        <TouchableOpacity
          activeOpacity={0.8}
          onLongPress={onLongPress}
          disabled={!onLongPress && !isDeleted}
        >
          <View style={[s.bubble, isMine ? s.bubbleMine : s.bubbleOther]}>
            {isDeleted ? (
              <Text style={s.deletedText}>This message was deleted</Text>
            ) : (
              <>
                {/* Text content */}
                {message.content ? (
                  <Text style={[s.messageText, isMine ? s.messageTextMine : null]}>
                    {message.content}
                  </Text>
                ) : null}

                {/* Media content */}
                {message.media_url && message.media_type === 'image' ? (
                  <TouchableOpacity onPress={() => setImageVisible(true)}>
                    <Image
                      source={{ uri: message.media_url }}
                      style={s.mediaImage}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                ) : null}

                {message.media_url && message.media_type === 'video' ? (
                  <TouchableOpacity
                    onPress={() => setVideoVisible(true)}
                    style={s.videoContainer}
                  >
                    <Image
                      source={{ uri: message.media_url }}
                      style={s.mediaImage}
                      resizeMode="cover"
                    />
                    <View style={s.playOverlay}>
                      <Ionicons name="play-circle" size={40} color={colors.white} />
                    </View>
                  </TouchableOpacity>
                ) : null}

                {/* Edited label */}
                {isEdited ? (
                  <Text style={s.editedLabel}>edited</Text>
                ) : null}
              </>
            )}
          </View>
        </TouchableOpacity>

        {/* Timestamp + read receipt */}
        <View style={[s.metaRow, isMine ? s.metaRowMine : null]}>
          <Text style={s.timestamp}>{timestamp}</Text>
          {isMine && !isDeleted ? (
            <ReadReceiptIcon status={readStatus} />
          ) : null}
        </View>
      </View>

      {/* Spacer for own messages (no avatar) */}
      {isMine && <View style={s.avatarSpacer} />}

      {/* Fullscreen image modal */}
      {imageVisible && message.media_url ? (
        <Modal visible transparent animationType="fade">
          <Pressable style={s.modalBackdrop} onPress={() => setImageVisible(false)}>
            <Image
              source={{ uri: message.media_url }}
              style={s.fullscreenImage}
              resizeMode="contain"
            />
          </Pressable>
        </Modal>
      ) : null}

      {/* Fullscreen video modal */}
      {videoVisible && message.media_url ? (
        <VideoPlayerModal
          uri={message.media_url}
          onClose={() => setVideoVisible(false)}
        />
      ) : null}
    </View>
  );
}

// ─── Read receipt icon ─────────────────────────────────────────────────────

function ReadReceiptIcon({ status }: { status: 'sent' | 'delivered' | 'read' }) {
  if (status === 'sent') {
    return (
      <Ionicons
        name="checkmark-outline"
        size={13}
        color={colors.textMuted}
        style={s.receiptIcon}
      />
    );
  }
  if (status === 'delivered') {
    return (
      <Ionicons
        name="checkmark-done-outline"
        size={13}
        color={colors.textMuted}
        style={s.receiptIcon}
      />
    );
  }
  // read
  return (
    <Ionicons
      name="checkmark-done"
      size={13}
      color="#3b82f6"
      style={s.receiptIcon}
    />
  );
}

// ─── Video player modal ────────────────────────────────────────────────────

function VideoPlayerModal({ uri, onClose }: { uri: string; onClose: () => void }) {
  const player = useVideoPlayer(uri, (p) => {
    p.play();
  });

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <View style={s.videoModal}>
        <Pressable style={s.videoCloseBtn} onPress={onClose}>
          <Ionicons name="close" size={28} color={colors.textPrimary} />
        </Pressable>
        <VideoView
          player={player}
          style={s.videoPlayer}
          contentFit="contain"
          allowsFullscreen
        />
      </View>
    </Modal>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function formatTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

// ─── Styles ───────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingHorizontal: 12,
    alignItems: 'flex-end',
  },
  rowMine: {
    justifyContent: 'flex-end',
  },
  rowOther: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    marginRight: 8,
    alignSelf: 'flex-end',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceElevated,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  avatarSpacer: {
    width: 40,
  },
  bubbleWrapper: {
    maxWidth: '72%',
  },
  bubbleWrapperMine: {
    alignItems: 'flex-end',
  },
  bubbleWrapperOther: {
    alignItems: 'flex-start',
  },
  senderName: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 2,
    marginLeft: 4,
  },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 48,
  },
  bubbleMine: {
    backgroundColor: colors.accent,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: colors.surfaceElevated,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  messageTextMine: {
    color: colors.white,
  },
  deletedText: {
    fontSize: 14,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  editedLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  mediaImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginTop: 4,
  },
  videoContainer: {
    position: 'relative',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    paddingHorizontal: 4,
  },
  metaRowMine: {
    justifyContent: 'flex-end',
  },
  timestamp: {
    fontSize: 10,
    color: colors.textMuted,
  },
  receiptIcon: {
    marginLeft: 3,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullscreenImage: {
    width: '100%',
    height: '80%',
  },
  videoModal: {
    flex: 1,
    backgroundColor: colors.black,
  },
  videoCloseBtn: {
    position: 'absolute',
    top: 48,
    right: 16,
    zIndex: 10,
    padding: 8,
  },
  videoPlayer: {
    flex: 1,
  },
});
