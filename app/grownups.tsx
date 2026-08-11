import React, { useMemo, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Badge, Button, Card, ProgressBar } from '@/components/UI';
import { theme } from '@/lib/theme';
import { QUIZZES, pack } from '@/lib/content';
import { useProgress } from '@/lib/ProgressContext';
import { hasHuggingFace, hasSupabase } from '@/lib/config';

export default function GrownUps() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { progress, reset } = useProgress();
  const [confirming, setConfirming] = useState(false);

  const perQuiz = useMemo(() => {
    return QUIZZES.map((qz) => {
      const runs = progress.results.filter((r) => r.quizKey === qz.key);
      const best = runs.reduce(
        (acc, r) => Math.max(acc, r.total > 0 ? Math.round((r.score / r.total) * 100) : 0),
        0,
      );
      return { ...qz, attempts: runs.length, best };
    });
  }, [progress.results]);

  // Questions missed most often — the most useful signal for a teacher.
  const troubleSpots = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of progress.results) {
      for (const id of r.missed) counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    const all = Object.values(pack.quizzes).flat();
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, times]) => ({
        times,
        prompt: all.find((q) => q.id === id)?.prompt ?? id,
      }));
  }, [progress.results]);

  const doReset = () => {
    if (Platform.OS === 'web') {
      // Alert has no buttons on web, so use a two-tap confirm instead.
      if (confirming) {
        void reset();
        setConfirming(false);
      } else {
        setConfirming(true);
      }
      return;
    }
    Alert.alert('Reset progress?', 'This clears reading progress and scores on this device.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: () => void reset() },
    ]);
  };

  const totalRuns = progress.results.length;
  const avg =
    totalRuns > 0
      ? Math.round(
          progress.results.reduce((a, r) => a + (r.total ? r.score / r.total : 0), 0) / totalRuns * 100,
        )
      : 0;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.inner,
        { paddingTop: insets.top + theme.space(4), paddingBottom: insets.bottom + theme.space(8) },
      ]}
    >
      <Text style={styles.back} onPress={() => router.push('/')}>
        ‹ Home
      </Text>
      <Text style={styles.title}>For grown-ups</Text>
      <Text style={styles.sub}>{pack.title} · {pack.readingLevel}</Text>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Reading</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Pages read</Text>
          <Text style={styles.value}>
            {progress.pagesRead.length} / {pack.pages.length}
          </Text>
        </View>
        <ProgressBar value={progress.pagesRead.length} total={pack.pages.length} />
        <View style={styles.row}>
          <Text style={styles.label}>Activities attempted</Text>
          <Text style={styles.value}>{totalRuns}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Average score</Text>
          <Text style={styles.value}>{avg}%</Text>
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Activity mastery</Text>
        {perQuiz.map((q) => (
          <View key={q.key} style={styles.quizRow}>
            <Text style={styles.quizName}>
              {q.emoji}  {q.title}
            </Text>
            <Text style={[styles.quizScore, q.best >= 80 && styles.quizScoreGood]}>
              {q.attempts === 0 ? 'not tried' : `${q.best}%`}
            </Text>
          </View>
        ))}
      </Card>

      {troubleSpots.length > 0 && (
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Worth revisiting</Text>
          {troubleSpots.map((t, i) => (
            <Text key={i} style={styles.trouble}>
              • {t.prompt}{' '}
              <Text style={styles.troubleTimes}>
                (missed {t.times}×)
              </Text>
            </Text>
          ))}
        </Card>
      )}

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Setup</Text>
        <View style={styles.badges}>
          <Badge
            text={hasSupabase ? 'Supabase sync on' : 'Supabase not configured'}
            tone={hasSupabase ? 'good' : 'neutral'}
          />
          <Badge
            text={hasHuggingFace ? 'AI questions on' : 'AI questions off'}
            tone={hasHuggingFace ? 'good' : 'neutral'}
          />
        </View>
        <Text style={styles.note}>
          {hasSupabase
            ? 'Scores sync to Supabase and work offline, syncing when back online.'
            : 'Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to sync scores across devices. The app works fully without it.'}
        </Text>
      </Card>

      <Button
        label={confirming ? 'Tap again to confirm reset' : 'Reset progress'}
        onPress={doReset}
        variant="ghost"
      />

      <Text style={styles.credit}>{pack.source}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.color.bg },
  inner: { paddingHorizontal: theme.space(4), gap: theme.space(3) },
  back: { fontSize: theme.font.body, color: theme.color.primary, fontWeight: '700' },
  title: { fontSize: theme.font.h1, fontWeight: '800', color: theme.color.ink },
  sub: { fontSize: theme.font.body, color: theme.color.inkSoft },
  card: { gap: theme.space(2) },
  cardTitle: { fontSize: theme.font.h2, fontWeight: '800', color: theme.color.ink },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: theme.font.body, color: theme.color.inkSoft },
  value: { fontSize: theme.font.body, fontWeight: '800', color: theme.color.ink },
  quizRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.space(1),
  },
  quizName: { fontSize: theme.font.body, color: theme.color.ink, flex: 1 },
  quizScore: { fontSize: theme.font.body, fontWeight: '800', color: theme.color.inkSoft },
  quizScoreGood: { color: theme.color.correct },
  trouble: { fontSize: theme.font.small, color: theme.color.ink, lineHeight: 22 },
  troubleTimes: { color: theme.color.wrong, fontWeight: '700' },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space(2) },
  note: { fontSize: theme.font.small, color: theme.color.inkSoft, lineHeight: 20 },
  credit: { fontSize: 12, color: theme.color.inkSoft, textAlign: 'center', marginTop: theme.space(2) },
});
