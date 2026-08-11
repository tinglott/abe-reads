import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { QuizRunner } from '@/components/QuizRunner';
import { ScoreCard } from '@/components/ScoreCard';
import { Button } from '@/components/UI';
import { theme } from '@/lib/theme';
import { QUIZZES, getQuiz, type QuizKey } from '@/lib/content';
import { useProgress } from '@/lib/ProgressContext';

export default function QuizScreen() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { recordResult } = useProgress();
  const [done, setDone] = useState<{ score: number; missed: string[] } | null>(null);

  const meta = QUIZZES.find((q) => q.key === key);
  const questions = meta ? getQuiz(meta.key as QuizKey) : [];

  const finish = useCallback(
    (score: number, missed: string[]) => {
      setDone({ score, missed });
      if (meta) {
        void recordResult({
          quizKey: meta.key,
          score,
          total: questions.length,
          missed,
          at: new Date().toISOString(),
        });
      }
    },
    [meta, questions.length, recordResult],
  );

  const retry = useCallback(() => setDone(null), []);

  if (!meta) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.msg}>That activity does not exist.</Text>
        <Button label="Go home" onPress={() => router.push('/')} variant="ghost" />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {done ? (
        <ScoreCard
          title={meta.title}
          score={done.score}
          total={questions.length}
          onRetry={retry}
          onHome={() => router.push('/')}
        />
      ) : (
        <QuizRunner
          key={meta.key}
          title={meta.title}
          questions={questions}
          onFinish={finish}
          onExit={() => router.push('/')}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.color.bg },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space(4),
    padding: theme.space(6),
    backgroundColor: theme.color.bg,
  },
  msg: { fontSize: theme.font.body, color: theme.color.inkSoft, textAlign: 'center' },
});
