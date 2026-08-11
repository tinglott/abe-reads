import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { QuizRunner } from '@/components/QuizRunner';
import { ScoreCard } from '@/components/ScoreCard';
import { Button, Card } from '@/components/UI';
import { theme } from '@/lib/theme';
import { storyText, type Question } from '@/lib/content';
import { generateQuestions } from '@/lib/huggingface';
import { hasHuggingFace } from '@/lib/config';
import { useProgress } from '@/lib/ProgressContext';

type Phase = 'intro' | 'loading' | 'playing' | 'done';

export default function Bonus() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { recordResult } = useProgress();
  const [phase, setPhase] = useState<Phase>('intro');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ score: number; missed: string[] } | null>(null);

  const start = useCallback(async () => {
    setError(null);
    setPhase('loading');
    try {
      const generated = await generateQuestions(storyText(), 5);
      setQuestions(generated as unknown as Question[]);
      setPhase('playing');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not reach the AI service.');
      setPhase('intro');
    }
  }, []);

  const finish = useCallback(
    (score: number, missed: string[]) => {
      setResult({ score, missed });
      setPhase('done');
      void recordResult({
        quizKey: 'bonus-ai',
        score,
        total: questions.length,
        missed,
        at: new Date().toISOString(),
      });
    },
    [questions.length, recordResult],
  );

  if (phase === 'playing') {
    return (
      <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <QuizRunner
          title="Bonus Questions"
          questions={questions}
          onFinish={finish}
          onExit={() => router.push('/')}
        />
      </View>
    );
  }

  if (phase === 'done' && result) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <ScoreCard
          title="Bonus Questions"
          score={result.score}
          total={questions.length}
          onRetry={start}
          onHome={() => router.push('/')}
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.inner,
        { paddingTop: insets.top + theme.space(4), paddingBottom: insets.bottom + theme.space(6) },
      ]}
    >
      <Text style={styles.back} onPress={() => router.push('/')}>
        ‹ Home
      </Text>
      <Text style={styles.emoji}>✨</Text>
      <Text style={styles.title}>Bonus Questions</Text>
      <Text style={styles.body}>
        These questions are written fresh each time by an open-source AI model running on Hugging
        Face. Read the story first, then see if you can answer brand-new questions about it.
      </Text>

      {!hasHuggingFace && (
        <Card style={styles.warn}>
          <Text style={styles.warnTitle}>AI questions are switched off</Text>
          <Text style={styles.warnBody}>
            A grown-up can turn this on by adding a free Hugging Face token as
            EXPO_PUBLIC_HF_TOKEN. Everything else in the app works without it.
          </Text>
        </Card>
      )}

      {error && (
        <Card style={styles.warn}>
          <Text style={styles.warnTitle}>Could not make new questions</Text>
          <Text style={styles.warnBody}>{error}</Text>
        </Card>
      )}

      <Button
        label={phase === 'loading' ? 'Writing questions…' : 'Make my questions'}
        onPress={start}
        loading={phase === 'loading'}
        disabled={!hasHuggingFace}
        variant="accent"
      />
      <Button label="Back to activities" onPress={() => router.push('/')} variant="ghost" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.color.bg },
  inner: { paddingHorizontal: theme.space(4), gap: theme.space(3) },
  back: { fontSize: theme.font.body, color: theme.color.primary, fontWeight: '700' },
  emoji: { fontSize: 56, textAlign: 'center' },
  title: { fontSize: theme.font.h1, fontWeight: '800', color: theme.color.ink, textAlign: 'center' },
  body: {
    fontSize: theme.font.body,
    lineHeight: theme.font.body * 1.5,
    color: theme.color.ink,
    textAlign: 'center',
  },
  warn: {
    backgroundColor: theme.color.highlight,
    borderColor: theme.color.accent,
    gap: theme.space(1),
  },
  warnTitle: { fontSize: theme.font.body, fontWeight: '800', color: theme.color.ink },
  warnBody: { fontSize: theme.font.small, color: theme.color.inkSoft, lineHeight: 20 },
});
