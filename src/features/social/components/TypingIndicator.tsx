/**
 * TypingIndicator — shows "[Name] is typing..." above MessageInput.
 * Hidden when no one is typing.
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { colors } from '@/constants/theme';

interface TypingIndicatorProps {
  typingUsers: string[];
}

export function TypingIndicator({ typingUsers }: TypingIndicatorProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const loopRef = useRef<Animated.CompositeAnimation | null>(null);

  const isVisible = typingUsers.length > 0;

  useEffect(() => {
    if (isVisible) {
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        loopRef.current = Animated.loop(
          Animated.sequence([
            Animated.timing(opacity, {
              toValue: 0.4,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
          ])
        );
        loopRef.current.start();
      });
    } else {
      loopRef.current?.stop();
      loopRef.current = null;
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible, opacity]);

  if (!isVisible) return null;

  const label =
    typingUsers.length === 1
      ? `${typingUsers[0]} is typing...`
      : typingUsers.length === 2
      ? `${typingUsers[0]} and ${typingUsers[1]} are typing...`
      : `${typingUsers[0]} and ${typingUsers.length - 1} others are typing...`;

  return (
    <Animated.View style={[s.container, { opacity }]}>
      <Text style={s.text}>{label}</Text>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  text: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
});
