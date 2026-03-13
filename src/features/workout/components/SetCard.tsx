import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import {
  MAX_WEIGHT,
  MAX_REPS,
} from '@/features/workout/constants';
import { VideoCaptureButton } from '@/features/videos/components/VideoCaptureButton';
import { useVideoUpload } from '@/features/videos/hooks/useVideoUpload';
import type { TargetSet } from '@/features/plans/types';
import type { SetLog } from '@/features/workout/types';

interface SetCardProps {
  targetSet?: TargetSet;
  setNumber: number;
  unit: 'kg' | 'lbs';
  onLog: (weight: number, reps: number, rpe: number | null) => void;
  onDelete?: () => void;
  isLogged?: boolean;
  loggedSet?: SetLog;
  onVideoAttached?: (setLogId: string, localUri: string, thumbnailUri: string, source?: 'camera' | 'gallery') => void;
  onVideoDeleted?: (setLogId: string) => void;
}

export function SetCard({ targetSet, setNumber, unit, onLog, onDelete, isLogged, loggedSet, onVideoAttached, onVideoDeleted }: SetCardProps) {
  const { deleteVideo } = useVideoUpload();
  const [localVideoUri, setLocalVideoUri] = useState<string | null>(null);
  const [localThumbnailUri, setLocalThumbnailUri] = useState<string | null>(null);
  const [pendingVideo, setPendingVideo] = useState<{ localUri: string; thumbnailUri: string; source: 'camera' | 'gallery' } | null>(null);
  const [weight, setWeight] = useState(() => {
    if (loggedSet) return String(loggedSet.weight);
    if (targetSet?.weight && targetSet.weight > 0) return String(targetSet.weight);
    return '';
  });
  const [reps, setReps] = useState(() => {
    if (loggedSet) return String(loggedSet.reps);
    if (targetSet?.reps && targetSet.reps > 0) return String(targetSet.reps);
    return '';
  });
  const [rpe, setRpe] = useState(() => {
    if (loggedSet?.rpe != null && loggedSet.rpe > 0) return String(loggedSet.rpe);
    if (targetSet?.rpe != null && targetSet.rpe > 0) return String(targetSet.rpe);
    return '';
  });
  const hasLogged = useRef(!!loggedSet || (isLogged ?? false));

  // Flush pending video when set gets logged (loggedSet.id becomes available)
  useEffect(() => {
    if (loggedSet?.id && pendingVideo) {
      if (onVideoAttached) {
        onVideoAttached(loggedSet.id, pendingVideo.localUri, pendingVideo.thumbnailUri, pendingVideo.source);
      }
      setLocalVideoUri(pendingVideo.localUri);
      setLocalThumbnailUri(pendingVideo.thumbnailUri);
      setPendingVideo(null);
    }
  }, [loggedSet?.id, pendingVideo, onVideoAttached]);

  const handleLogPress = useCallback(() => {
    const w = parseFloat(weight);
    const r = parseInt(reps, 10);
    if (w > 0 && r > 0 && !hasLogged.current) {
      hasLogged.current = true;
      const rpeVal = rpe ? parseFloat(rpe) : null;
      onLog(w, r, rpeVal);
    }
  }, [weight, reps, rpe, onLog]);

  const handleWeightChange = useCallback((text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    const val = parseFloat(cleaned);
    if (cleaned === '' || (val >= 0 && val <= MAX_WEIGHT)) {
      setWeight(cleaned);
    }
  }, []);

  const handleRepsChange = useCallback((text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    const val = parseInt(cleaned, 10);
    if (cleaned === '' || (val >= 0 && val <= MAX_REPS)) {
      setReps(cleaned);
    }
  }, []);

  const handleRpeChange = useCallback((text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    const val = parseFloat(cleaned);
    if (cleaned === '' || (val >= 0 && val <= 10)) {
      setRpe(cleaned);
    }
  }, []);

  const handleVideoAttached = useCallback(
    (localUri: string, thumbnailUri: string, source: 'camera' | 'gallery') => {
      if (loggedSet?.id && onVideoAttached) {
        // Already logged - attach immediately
        setLocalVideoUri(localUri);
        setLocalThumbnailUri(thumbnailUri);
        onVideoAttached(loggedSet.id, localUri, thumbnailUri, source);
      } else {
        // Not yet logged - store as pending
        setPendingVideo({ localUri, thumbnailUri, source });
        setLocalVideoUri(localUri);
        setLocalThumbnailUri(thumbnailUri);
      }
    },
    [loggedSet?.id, onVideoAttached],
  );

  const handleDeleteVideo = useCallback(() => {
    if (!loggedSet?.id) return;
    Alert.alert(
      'Remove Video?',
      'This will delete the video from this set.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteVideo(loggedSet.id);
            } catch {
              // Storage delete failure is non-blocking
            }
            setLocalVideoUri(null);
            setLocalThumbnailUri(null);
            onVideoDeleted?.(loggedSet.id);
          },
        },
      ],
    );
  }, [loggedSet?.id, deleteVideo, onVideoDeleted]);

  const hasVideoAttachment = !!(localVideoUri || loggedSet?.video_url || pendingVideo);
  const displayThumbnail = localThumbnailUri || null;

  return (
    <View style={[s.card, hasLogged.current && s.cardLogged]}>
      <View style={s.setHeader}>
        <Text style={s.setLabel}>Set {setNumber}</Text>
        <View style={s.setHeaderRight}>
          {hasLogged.current && <Text style={s.loggedBadge}>Logged</Text>}
          <VideoCaptureButton
            onVideoAttached={handleVideoAttached}
            setLogId={loggedSet?.id}
            hasVideo={hasVideoAttachment}
            thumbnailUri={displayThumbnail}
          />
          {hasLogged.current && hasVideoAttachment && (
            <Pressable
              onPress={handleDeleteVideo}
              style={({ pressed }) => [s.deleteVideoIconBtn, pressed && { opacity: 0.6 }]}
              hitSlop={6}
            >
              <Ionicons name="trash-outline" size={16} color={colors.error} />
            </Pressable>
          )}
          {onDelete && (
            <Pressable
              onPress={onDelete}
              style={({ pressed }) => [s.deleteBtn, pressed && { opacity: 0.6 }]}
              hitSlop={6}
            >
              <Ionicons name="close-circle" size={20} color={colors.textMuted} />
            </Pressable>
          )}
        </View>
      </View>
      <View style={s.inputRow}>
        <View style={s.inputGroup}>
          <Text style={s.inputLabel}>Weight ({unit})</Text>
          <TextInput
            style={s.input}
            value={weight}
            onChangeText={handleWeightChange}
            keyboardType="decimal-pad"
            returnKeyType="done"
            placeholder="0"
            placeholderTextColor={colors.textMuted}
            selectTextOnFocus
          />
        </View>
        <View style={s.separator} />
        <View style={s.inputGroup}>
          <Text style={s.inputLabel}>Reps</Text>
          <TextInput
            style={s.input}
            value={reps}
            onChangeText={handleRepsChange}
            keyboardType="number-pad"
            returnKeyType="done"
            placeholder="0"
            placeholderTextColor={colors.textMuted}
            selectTextOnFocus
          />
        </View>
        <View style={s.separator} />
        <View style={s.inputGroupSmall}>
          <Text style={s.inputLabel}>RPE</Text>
          <TextInput
            style={s.inputSmall}
            value={rpe}
            onChangeText={handleRpeChange}
            keyboardType="decimal-pad"
            returnKeyType="done"
            placeholder="--"
            placeholderTextColor={colors.textMuted}
            selectTextOnFocus
          />
        </View>
      </View>
      {!hasLogged.current && (
        <Pressable
          onPress={handleLogPress}
          style={({ pressed }) => [
            s.logBtn,
            parseFloat(weight) > 0 && parseInt(reps, 10) > 0
              ? s.logBtnActive
              : s.logBtnDisabled,
            pressed && { opacity: 0.7 },
          ]}
        >
          <Text style={[
            s.logBtnText,
            parseFloat(weight) > 0 && parseInt(reps, 10) > 0
              ? s.logBtnTextActive
              : s.logBtnTextDisabled,
          ]}>Log Set</Text>
        </Pressable>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.surfaceElevated,
  },
  cardLogged: {
    borderColor: colors.accent,
    borderWidth: 1,
  },
  setHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  setHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  setLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  loggedBadge: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '700',
  },
  deleteBtn: {
    padding: 2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputGroup: {
    flex: 1,
    alignItems: 'center',
  },
  inputGroupSmall: {
    width: 70,
    alignItems: 'center',
  },
  inputLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surfaceElevated,
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    minHeight: 60,
    minWidth: 100,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  inputSmall: {
    backgroundColor: colors.surfaceElevated,
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    minHeight: 60,
    width: 60,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  separator: {
    width: 1,
    height: 40,
    backgroundColor: colors.surfaceElevated,
    marginHorizontal: 8,
  },
  logBtn: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  logBtnActive: {
    backgroundColor: colors.accent,
  },
  logBtnDisabled: {
    backgroundColor: colors.surfaceElevated,
  },
  logBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },
  logBtnTextActive: {
    color: colors.white,
  },
  logBtnTextDisabled: {
    color: colors.textMuted,
  },
  deleteVideoIconBtn: {
    padding: 2,
  },
});
