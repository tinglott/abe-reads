import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card, ProgressBar } from '@/components/UI';
import { theme } from '@/lib/theme';
import { pack, pageText } from '@/lib/content';
import { storyImage } from '@/lib/images';
import { useTts } from '@/lib/TtsProvider';
import { useProgress } from '@/lib/ProgressContext';

/** Split into words but keep punctuation attached, so taps read a clean word. */
function words(text: string): string[] {
  return text.split(/(\s+)/).filter((t) => t.length > 0);
}

export default function Reader() {
  const { page } = useLocalSearchParams<{ page: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { markPageRead } = useProgress();
  const { speaking, speak, stop, toggle } = useTts();
  const [tapped, setTapped] = useState<string | null>(null);

  const total = pack.pages.length;
  const num = Math.min(Math.max(parseInt(page ?? '1', 10) || 1, 1), total);
  const story = pack.pages[num - 1];
  const image = storyImage(story.image);
  const text = useMemo(() => pageText(story), [story]);

  useEffect(() => {
    markPageRead(num);
    setTapped(null);
    stop();
  }, [num, markPageRead, stop]);

  const goto = useCallback(
    (n: number) => {
      stop();
      router.replace({ pathname: '/read/[page]', params: { page: String(n) } });
    },
    [router, stop],
  );

  const onWord = useCallback(
    (w: string) => {
      const clean = w.replace(/[^A-Za-z'-]/g, '');
      if (!clean) return;
      setTapped(clean);
      speak(clean, 0.75);
    },
    [speak],
  );

  const isLast = num >= total;

  return (
    <View style={[styles.screen, { paddingTop: insets.top + theme.space(2) }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.push('/')} hitSlop={12} accessibilityRole="button">
          <Text style={styles.back}>‹ Home</Text>
        </Pressable>
        <Text style={styles.counter}>
          Page {num} of {total}
        </Text>
        <Pressable
          onPress={() => toggle(text)}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={speaking ? 'Stop reading' : 'Read this page aloud'}
          style={styles.speaker}
        >
          <Text style={styles.speakerIcon}>{speaking ? '⏹' : '🔊'}</Text>
        </Pressable>
      </View>

      <View style={styles.barWrap}>
        <ProgressBar value={num} total={total} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollInner, { paddingBottom: insets.bottom + theme.space(6) }]}
      >
        {image && (
          <Image
            source={image}
            style={styles.art}
            resizeMode="contain"
            accessibilityLabel={`Illustration for page ${num}`}
          />
        )}

        <Card style={styles.textCard}>
          {story.paragraphs.map((para, pi) => (
            <Text key={pi} style={styles.para}>
              {words(para).map((w, wi) =>
                /^\s+$/.test(w) ? (
                  <Text key={wi}>{w}</Text>
                ) : (
                  <Text
                    key={wi}
                    onPress={() => onWord(w)}
                    suppressHighlighting
                    style={[
                      styles.word,
                      tapped && w.replace(/[^A-Za-z'-]/g, '') === tapped && styles.wordTapped,
                    ]}
                  >
                    {w}
                  </Text>
                ),
              )}
            </Text>
          ))}
          <Text style={styles.hint}>Tap any word to hear it.</Text>
        </Card>
      </ScrollView>

      <View style={[styles.nav, { paddingBottom: insets.bottom + theme.space(2) }]}>
        <Button
          label="‹ Back"
          variant="ghost"
          onPress={() => goto(num - 1)}
          disabled={num <= 1}
          style={styles.navBtn}
        />
        {isLast ? (
          <Button
            label="Practice time! ⭐"
            variant="accent"
            onPress={() => router.push('/')}
            style={styles.navBtn}
          />
        ) : (
          <Button label="Next ›" onPress={() => goto(num + 1)} style={styles.navBtn} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.color.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.space(4),
    paddingVertical: theme.space(2),
    gap: theme.space(2),
  },
  back: { fontSize: theme.font.body, color: theme.color.primary, fontWeight: '700' },
  counter: { fontSize: theme.font.small, fontWeight: '700', color: theme.color.inkSoft },
  speaker: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.color.highlight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speakerIcon: { fontSize: 22 },
  barWrap: { paddingHorizontal: theme.space(4), paddingBottom: theme.space(2) },
  scroll: { flex: 1 },
  scrollInner: { paddingHorizontal: theme.space(4), gap: theme.space(4) },
  art: {
    width: '100%',
    aspectRatio: 512 / 494,
    maxHeight: 260,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.color.card,
    borderWidth: 1,
    borderColor: theme.color.border,
  },
  textCard: { gap: theme.space(3) },
  para: {
    fontSize: theme.font.read,
    lineHeight: theme.font.read * 1.6,
    color: theme.color.ink,
  },
  word: { fontSize: theme.font.read, lineHeight: theme.font.read * 1.6, color: theme.color.ink },
  wordTapped: { backgroundColor: theme.color.highlight, fontWeight: '800' },
  hint: { fontSize: theme.font.small, color: theme.color.inkSoft, fontStyle: 'italic' },
  nav: {
    flexDirection: 'row',
    gap: theme.space(3),
    paddingHorizontal: theme.space(4),
    paddingTop: theme.space(2),
    borderTopWidth: 1,
    borderTopColor: theme.color.border,
    backgroundColor: theme.color.bg,
  },
  navBtn: { flex: 1 },
});
