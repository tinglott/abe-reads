import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Card, ProgressBar } from './UI';
import { theme } from '@/lib/theme';

export type ScoreCardProps = {
  title: string;
  score: number;
  total: number;
  onRetry: () => void;
  onHome: () => void;
};

function message(pct: number): { emoji: string; head: string; body: string } {
  if (pct === 100)
    return { emoji: '🏆', head: 'Perfect score!', body: 'You answered every question correctly. Amazing reading!' };
  if (pct >= 80)
    return { emoji: '⭐', head: 'You earned a star!', body: 'Great reading. You really understood the story.' };
  if (pct >= 50)
    return { emoji: '👍', head: 'Good effort!', body: 'You are getting there. Read the story again and try once more.' };
  return { emoji: '📖', head: 'Keep practising!', body: 'Reading the story again will help a lot. You can do this!' };
}

export function ScoreCard({ title, score, total, onRetry, onHome }: ScoreCardProps) {
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;
  const m = message(pct);

  return (
    <View style={styles.wrap}>
      <Card style={styles.card}>
        <Text style={styles.emoji}>{m.emoji}</Text>
        <Text style={styles.head}>{m.head}</Text>
        <Text style={styles.activity}>{title}</Text>

        <Text style={styles.score}>
          {score} <Text style={styles.scoreOf}>/ {total}</Text>
        </Text>
        <ProgressBar value={score} total={total} />
        <Text style={styles.pct}>{pct}% correct</Text>

        <Text style={styles.body}>{m.body}</Text>

        <View style={styles.actions}>
          <Button label="Try again" onPress={onRetry} variant="accent" />
          <Button label="Back to activities" onPress={onHome} variant="ghost" />
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', padding: theme.space(4) },
  card: { gap: theme.space(3), alignItems: 'stretch' },
  emoji: { fontSize: 56, textAlign: 'center' },
  head: { fontSize: theme.font.h1, fontWeight: '800', color: theme.color.ink, textAlign: 'center' },
  activity: { fontSize: theme.font.body, color: theme.color.inkSoft, textAlign: 'center' },
  score: {
    fontSize: 52,
    fontWeight: '800',
    color: theme.color.primary,
    textAlign: 'center',
    marginTop: theme.space(2),
  },
  scoreOf: { fontSize: 26, color: theme.color.inkSoft, fontWeight: '700' },
  pct: { fontSize: theme.font.small, color: theme.color.inkSoft, textAlign: 'center', fontWeight: '700' },
  body: {
    fontSize: theme.font.body,
    lineHeight: theme.font.body * 1.5,
    color: theme.color.ink,
    textAlign: 'center',
    marginTop: theme.space(2),
  },
  actions: { gap: theme.space(3), marginTop: theme.space(3) },
});
