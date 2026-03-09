import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { WEEKDAY_LABELS } from '../constants';
import type { PlanSummary } from '../types';

interface PlanCardProps {
  plan: PlanSummary;
  onPress: () => void;
  onLongPress?: () => void;
  onDelete?: () => void;
}

function renderRightActions(
  _progress: Animated.AnimatedInterpolation<number>,
  dragX: Animated.AnimatedInterpolation<number>
) {
  const scale = dragX.interpolate({
    inputRange: [-80, 0],
    outputRange: [1, 0.5],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View style={[s.deleteAction, { transform: [{ scale }] }]}>
      <Ionicons name="trash-outline" size={22} color="#ffffff" />
      <Text style={s.deleteText}>Delete</Text>
    </Animated.View>
  );
}

export function PlanCard({ plan, onPress, onLongPress, onDelete }: PlanCardProps) {
  const handleDelete = () => {
    if (onDelete) {
      onDelete();
    } else {
      console.warn('Delete confirmation wired in Plan 03-03');
    }
  };

  const dayLabels = plan.day_names.map((name, _i) => name).join(', ');

  return (
    <Swipeable
      renderRightActions={renderRightActions}
      onSwipeableOpen={(direction) => {
        if (direction === 'right') handleDelete();
      }}
      overshootRight={false}
    >
      <Pressable onPress={onPress} onLongPress={onLongPress}>
        <Card>
          <View style={s.header}>
            <Text style={s.name} numberOfLines={1}>
              {plan.name}
            </Text>
            {plan.is_active && (
              <View style={s.activeBadge}>
                <Text style={s.activeText}>Active</Text>
              </View>
            )}
          </View>
          <View style={s.details}>
            <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
            <Text style={s.detailText}>
              {plan.day_count} {plan.day_count === 1 ? 'day' : 'days'}
              {dayLabels ? ` \u00B7 ${dayLabels}` : ''}
            </Text>
          </View>
        </Card>
      </Pressable>
    </Swipeable>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  name: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  activeBadge: {
    backgroundColor: colors.accent + '22',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  activeText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '600',
  },
  details: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  deleteAction: {
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRadius: 16,
    marginLeft: 8,
  },
  deleteText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
});
