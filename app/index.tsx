import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Badge, Button, Card, ProgressBar } from '@/components/UI';
import { theme } from '@/lib/theme';
import { QUIZZES, pack } from '@/lib/content';
import { storyImage } from '@/lib/images';
import { useProgress } from '@/lib/ProgressContext';

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { progress, cloudEnabled } = useProgress();

  const totalPages = pack.pages.length;
  const read = progress.pagesRead.length;
  const stars = progress.stars.length;
  const resumePage = Math.min(progress.page, totalPages);
  const cover = storyImage(pack.pages[0].image);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.inner,
        { paddingTop: insets.top + theme.space(4), paddingBottom: insets.bottom + theme.space(8) },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={styles.flex}>
          <Text style={styles.kicker}>Reading Comprehension</Text>
          <Text style={styles.title}>{pack.title}</Text>
          <Text style={styles.sub}>{pack.readingLevel}</Text>
        </View>
        <Pressable
          onPress={() => router.push('/grownups')}
          accessibilityRole="button"
          accessibilityLabel="For grown-ups"
          style={styles.gear}
        >
          <Text style={styles.gearIcon}>👪</Text>
        </Pressable>
      </View>

      {cover && <Image source={cover} style={styles.cover} resizeMode="cover" accessible={false} />}

      <Card style={styles.stats}>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Pages read</Text>
          <Text style={styles.statValue}>
            {read} / {totalPages}
          </Text>
        </View>
        <ProgressBar value={read} total={totalPages} />
        <View style={styles.starRow}>
          <Badge text={`⭐ ${stars} of ${QUIZZES.length} activities mastered`} tone={stars > 0 ? 'good' : 'neutral'} />
          {!cloudEnabled && <Badge text="Saving on this device" />}
        </View>
      </Card>

      <Button
        label={read > 0 ? `Keep reading — page ${resumePage}` : 'Start reading'}
        onPress={() => router.push({ pathname: '/read/[page]', params: { page: String(resumePage) } })}
      />

      <Text style={styles.section}>Practice activities</Text>
      <View style={styles.grid}>
        {QUIZZES.map((qz) => {
          const done = progress.stars.includes(qz.key);
          const count = pack.quizzes[qz.key]?.length ?? 0;
          return (
            <Pressable
              key={qz.key}
              onPress={() => router.push({ pathname: '/quiz/[key]', params: { key: qz.key } })}
              accessibilityRole="button"
              accessibilityLabel={`${qz.title}, ${count} questions`}
              style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}
            >
              <Text style={styles.tileEmoji}>{qz.emoji}</Text>
              <Text style={styles.tileTitle}>{qz.title}</Text>
              <Text style={styles.tileBlurb}>{qz.blurb}</Text>
              <Text style={styles.tileMeta}>
                {done ? '⭐ mastered' : `${count} questions`}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable onPress={() => router.push('/bonus')} style={styles.aiCard} accessibilityRole="button">
        <Text style={styles.aiTitle}>✨ Bonus questions</Text>
        <Text style={styles.aiBlurb}>
          Fresh questions written for you, powered by an open AI model on Hugging Face.
        </Text>
      </Pressable>

      <Text style={styles.credit}>{pack.source}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.color.bg },
  inner: { paddingHorizontal: theme.space(4), gap: theme.space(4) },
  flex: { flex: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.space(3) },
  kicker: {
    fontSize: theme.font.small,
    fontWeight: '800',
    color: theme.color.accentDark,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: { fontSize: theme.font.h1, fontWeight: '800', color: theme.color.ink },
  sub: { fontSize: theme.font.body, color: theme.color.inkSoft },
  gear: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.color.card,
    borderWidth: 1,
    borderColor: theme.color.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gearIcon: { fontSize: 22 },
  cover: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.color.border,
    backgroundColor: theme.color.card,
  },
  stats: { gap: theme.space(3) },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statLabel: { fontSize: theme.font.body, color: theme.color.inkSoft, fontWeight: '600' },
  statValue: { fontSize: theme.font.h2, fontWeight: '800', color: theme.color.ink },
  starRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space(2) },
  section: { fontSize: theme.font.h2, fontWeight: '800', color: theme.color.ink, marginTop: theme.space(2) },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space(3) },
  tile: {
    width: '47.5%',
    flexGrow: 1,
    backgroundColor: theme.color.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.color.border,
    padding: theme.space(4),
    gap: theme.space(1),
    minHeight: 132,
    ...theme.shadow,
  },
  tilePressed: { transform: [{ scale: 0.98 }], backgroundColor: theme.color.highlight },
  tileEmoji: { fontSize: 26 },
  tileTitle: { fontSize: theme.font.body, fontWeight: '800', color: theme.color.ink },
  tileBlurb: { fontSize: theme.font.small, color: theme.color.inkSoft },
  tileMeta: { fontSize: theme.font.small, fontWeight: '700', color: theme.color.accentDark, marginTop: 'auto' },
  aiCard: {
    backgroundColor: theme.color.primary,
    borderRadius: theme.radius.lg,
    padding: theme.space(4),
    gap: theme.space(1),
    ...theme.shadow,
  },
  aiTitle: { fontSize: theme.font.h2, fontWeight: '800', color: '#fff' },
  aiBlurb: { fontSize: theme.font.small, color: '#E8F1F8', lineHeight: 20 },
  credit: {
    fontSize: 12,
    color: theme.color.inkSoft,
    textAlign: 'center',
    marginTop: theme.space(2),
  },
});
