import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { theme } from '@/lib/theme';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'accent' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  style,
  accessibilityLabel,
}: ButtonProps) {
  const isGhost = variant === 'ghost';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: Boolean(disabled || loading) }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        isGhost && styles.btnGhost,
        variant === 'accent' && styles.btnAccent,
        pressed && !isGhost && styles.btnPressed,
        (disabled || loading) && styles.btnDisabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isGhost ? theme.color.primary : '#fff'} />
      ) : (
        <Text style={[styles.btnText, isGhost && styles.btnTextGhost]}>{label}</Text>
      )}
    </Pressable>
  );
}

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Badge({ text, tone = 'neutral' }: { text: string; tone?: 'neutral' | 'good' }) {
  return (
    <View style={[styles.badge, tone === 'good' && styles.badgeGood]}>
      <Text style={[styles.badgeText, tone === 'good' && styles.badgeTextGood]}>{text}</Text>
    </View>
  );
}

/** Chunky progress bar; readable at a glance by a young learner. */
export function ProgressBar({ value, total }: { value: number; total: number }) {
  const pct = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  return (
    <View
      style={styles.barTrack}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: total, now: value }}
    >
      <View style={[styles.barFill, { width: `${pct}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: theme.color.primary,
    paddingVertical: theme.space(4),
    paddingHorizontal: theme.space(6),
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    ...theme.shadow,
  },
  btnAccent: { backgroundColor: theme.color.accent },
  btnGhost: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: theme.color.primary,
    shadowOpacity: 0,
    elevation: 0,
  },
  btnPressed: { transform: [{ scale: 0.97 }] },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#fff', fontSize: theme.font.body, fontWeight: '700' },
  btnTextGhost: { color: theme.color.primary },
  card: {
    backgroundColor: theme.color.card,
    borderRadius: theme.radius.lg,
    padding: theme.space(4),
    borderWidth: 1,
    borderColor: theme.color.border,
    ...theme.shadow,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingVertical: theme.space(1),
    paddingHorizontal: theme.space(3),
    borderRadius: theme.radius.pill,
    backgroundColor: theme.color.highlight,
  },
  badgeGood: { backgroundColor: theme.color.correctBg },
  badgeText: { fontSize: theme.font.small, fontWeight: '700', color: theme.color.inkSoft },
  badgeTextGood: { color: theme.color.correct },
  barTrack: {
    height: 14,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.color.border,
    overflow: 'hidden',
  },
  barFill: { height: '100%', backgroundColor: theme.color.correct, borderRadius: theme.radius.pill },
});
