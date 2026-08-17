import React, { useCallback, useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Button, Card, ProgressBar } from './UI';
import { theme } from '@/lib/theme';
import { isCorrect, type Question } from '@/lib/content';
import { useTts } from '@/lib/TtsProvider';

type Answer = string | number | boolean;

export type QuizRunnerProps = {
  title: string;
  questions: Question[];
  onFinish: (score: number, missed: string[]) => void;
  onExit: () => void;
};

const PRAISE = ['Great job!', 'Nice work!', 'You got it!', 'Well done!', 'Excellent!'];

function tap(good: boolean) {
  if (Platform.OS === 'web') return;
  void Haptics.notificationAsync(
    good ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning,
  );
}

export function QuizRunner({ title, questions, onFinish, onExit }: QuizRunnerProps) {
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState('');
  const [checked, setChecked] = useState(false);
  const [wasRight, setWasRight] = useState(false);
  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState<string[]>([]);
  const [chosen, setChosen] = useState<Answer | null>(null);
  const { speaking, toggle } = useTts();

  const q = questions[index];
  const total = questions.length;
  const praise = useMemo(() => PRAISE[index % PRAISE.length], [index]);

  const check = useCallback(
    (given: Answer) => {
      if (checked || !q) return;
      const right = isCorrect(q, given);
      setChosen(given);
      setWasRight(right);
      setChecked(true);
      tap(right);
      if (right) setScore((s) => s + 1);
      else setMissed((m) => [...m, q.id]);
    },
    [checked, q],
  );

  const next = useCallback(() => {
    if (index + 1 >= total) {
      onFinish(score, missed);
      return;
    }
    setIndex((i) => i + 1);
    setChecked(false);
    setChosen(null);
    setTyped('');
    setWasRight(false);
  }, [index, total, onFinish, score, missed]);

  if (!q) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No questions in this activity yet.</Text>
        <Button label="Go back" onPress={onExit} variant="ghost" />
      </View>
    );
  }

  const answerText =
    q.type === 'mc' ? q.choices[q.answerIndex] : q.type === 'tf' ? (q.answer ? 'true' : 'false') : q.answer;

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Pressable onPress={onExit} accessibilityRole="button" hitSlop={12}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
        <Text style={styles.counter}>
          {index + 1} of {total}
        </Text>
      </View>

      <ProgressBar value={index + (checked ? 1 : 0)} total={total} />
      <Text style={styles.title}>{title}</Text>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollInner}
        keyboardShouldPersistTaps="handled"
      >
        <Card>
          <View style={styles.promptRow}>
            <Text style={styles.prompt}>{q.prompt}</Text>
            <Pressable
              onPress={() => toggle(q.prompt)}
              accessibilityRole="button"
              accessibilityLabel={speaking ? 'Stop reading' : 'Read question aloud'}
              hitSlop={10}
              style={styles.speaker}
            >
              <Text style={styles.speakerIcon}>{speaking ? '⏹' : '🔊'}</Text>
            </Pressable>
          </View>

          {q.type === 'mc' && (
            <View style={styles.choices}>
              {q.choices.map((c, i) => {
                const isPicked = chosen === i;
                const isAnswer = i === q.answerIndex;
                const showGood = checked && isAnswer;
                const showBad = checked && isPicked && !isAnswer;
                return (
                  <Pressable
                    key={`${q.id}-${i}`}
                    onPress={() => check(i)}
                    disabled={checked}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: isPicked }}
                    style={({ pressed }) => [
                      styles.choice,
                      pressed && !checked && styles.choicePressed,
                      showGood && styles.choiceGood,
                      showBad && styles.choiceBad,
                    ]}
                  >
                    <Text style={styles.choiceText}>{c}</Text>
                    {showGood && <Text style={styles.mark}>✓</Text>}
                    {showBad && <Text style={styles.mark}>✕</Text>}
                  </Pressable>
                );
              })}
            </View>
          )}

          {q.type === 'tf' && (
            <View style={styles.tfRow}>
              {[true, false].map((v) => {
                const isPicked = chosen === v;
                const isAnswer = v === q.answer;
                const showGood = checked && isAnswer;
                const showBad = checked && isPicked && !isAnswer;
                return (
                  <Pressable
                    key={String(v)}
                    onPress={() => check(v)}
                    disabled={checked}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: isPicked }}
                    style={({ pressed }) => [
                      styles.tfBtn,
                      pressed && !checked && styles.choicePressed,
                      showGood && styles.choiceGood,
                      showBad && styles.choiceBad,
                    ]}
                  >
                    <Text style={styles.tfText}>{v ? 'True' : 'False'}</Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          {(q.type === 'cloze' || q.type === 'text') && (
            <View style={styles.typeWrap}>
              <TextInput
                value={typed}
                onChangeText={setTyped}
                editable={!checked}
                placeholder="Type your answer"
                placeholderTextColor={theme.color.inkSoft}
                autoCapitalize="none"
                autoCorrect={false}
                onSubmitEditing={() => typed.trim() && check(typed)}
                returnKeyType="done"
                accessibilityLabel="Answer box"
                style={[
                  styles.input,
                  checked && (wasRight ? styles.inputGood : styles.inputBad),
                ]}
              />
              {!checked && (
                <Button
                  label="Check"
                  onPress={() => typed.trim() && check(typed)}
                  disabled={!typed.trim()}
                  variant="accent"
                />
              )}
            </View>
          )}
        </Card>

        {checked && (
          <Card style={[styles.feedback, wasRight ? styles.feedbackGood : styles.feedbackBad]}>
            <Text style={styles.feedbackTitle}>
              {wasRight ? `⭐ ${praise}` : 'Not quite — keep trying!'}
            </Text>
            {!wasRight && (
              <Text style={styles.feedbackBody}>
                The answer is <Text style={styles.feedbackAnswer}>{answerText}</Text>.
              </Text>
            )}
            <Button
              label={index + 1 >= total ? 'See my score' : 'Next question'}
              onPress={next}
              style={styles.nextBtn}
            />
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: theme.space(4), gap: theme.space(3) },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  back: { fontSize: theme.font.body, color: theme.color.primary, fontWeight: '700' },
  counter: { fontSize: theme.font.small, color: theme.color.inkSoft, fontWeight: '700' },
  title: { fontSize: theme.font.h2, fontWeight: '800', color: theme.color.ink },
  scroll: { flex: 1 },
  scrollInner: { gap: theme.space(3), paddingBottom: theme.space(8) },
  promptRow: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.space(2) },
  prompt: {
    flex: 1,
    fontSize: theme.font.read,
    lineHeight: theme.font.read * 1.45,
    color: theme.color.ink,
    fontWeight: '600',
  },
  speaker: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.color.highlight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speakerIcon: { fontSize: 20 },
  choices: { marginTop: theme.space(4), gap: theme.space(2) },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: theme.color.border,
    backgroundColor: '#FCFAF5',
    borderRadius: theme.radius.md,
    paddingVertical: theme.space(4),
    paddingHorizontal: theme.space(4),
    minHeight: 56,
  },
  choicePressed: { backgroundColor: theme.color.highlight },
  choiceGood: { borderColor: theme.color.correct, backgroundColor: theme.color.correctBg },
  choiceBad: { borderColor: theme.color.wrong, backgroundColor: theme.color.wrongBg },
  choiceText: { fontSize: theme.font.body, color: theme.color.ink, fontWeight: '600', flex: 1 },
  mark: { fontSize: 22, fontWeight: '800', color: theme.color.ink },
  tfRow: { flexDirection: 'row', gap: theme.space(3), marginTop: theme.space(4) },
  tfBtn: {
    flex: 1,
    borderWidth: 2,
    borderColor: theme.color.border,
    backgroundColor: '#FCFAF5',
    borderRadius: theme.radius.md,
    paddingVertical: theme.space(5),
    alignItems: 'center',
  },
  tfText: { fontSize: theme.font.h2, fontWeight: '800', color: theme.color.ink },
  typeWrap: { marginTop: theme.space(4), gap: theme.space(3) },
  input: {
    borderWidth: 2,
    borderColor: theme.color.border,
    borderRadius: theme.radius.md,
    paddingVertical: theme.space(4),
    paddingHorizontal: theme.space(4),
    fontSize: theme.font.h2,
    color: theme.color.ink,
    backgroundColor: '#FCFAF5',
  },
  inputGood: { borderColor: theme.color.correct, backgroundColor: theme.color.correctBg },
  inputBad: { borderColor: theme.color.wrong, backgroundColor: theme.color.wrongBg },
  feedback: { gap: theme.space(2) },
  feedbackGood: { borderColor: theme.color.correct, backgroundColor: theme.color.correctBg },
  feedbackBad: { borderColor: theme.color.wrong, backgroundColor: theme.color.wrongBg },
  feedbackTitle: { fontSize: theme.font.h2, fontWeight: '800', color: theme.color.ink },
  feedbackBody: { fontSize: theme.font.body, color: theme.color.ink },
  feedbackAnswer: { fontWeight: '800' },
  nextBtn: { marginTop: theme.space(2) },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: theme.space(4), padding: theme.space(6) },
  emptyText: { fontSize: theme.font.body, color: theme.color.inkSoft, textAlign: 'center' },
});
