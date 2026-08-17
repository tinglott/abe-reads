import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card } from '@/components/UI';
import { theme } from '@/lib/theme';
import { useTts, DEVICE_LABEL } from '@/lib/TtsProvider';

export default function Settings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { voices, selectedVoice, setVoice, status, mode, speak, speaking } = useTts();

  const options = [{ id: 'device', label: DEVICE_LABEL }, ...voices.map((v) => ({ id: v.id, label: v.label }))];

  const preview = (id: string) => {
    const v = voices.find((x) => x.id === id);
    const sample = 'Abraham Lincoln was born in a log cabin in Kentucky.';
    if (id === 'device') {
      // device voice handled inside TtsProvider via setVoice then speak
      setVoice('device');
      speak(sample);
    } else {
      setVoice(id);
      speak(sample);
    }
  };

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
      <Text style={styles.title}>Voice settings</Text>
      <Text style={styles.sub}>
        Choose how the story is read aloud. Microsoft's free voices sound natural and
        need no account. The device voice works fully offline.
      </Text>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Reading voice</Text>
        {status === 'loading' && <Text style={styles.note}>Loading voices…</Text>}
        {options.map((opt) => {
          const active = selectedVoice === opt.id;
          return (
            <View key={opt.id} style={styles.voiceRow}>
              <Button
                label={opt.label}
                variant={active ? 'primary' : 'ghost'}
                onPress={() => setVoice(opt.id)}
                style={styles.voiceBtn}
              />
              {opt.id !== 'device' && (
                <Button
                  label={speaking ? '🔊…' : '▶ Test'}
                  variant="accent"
                  onPress={() => preview(opt.id)}
                  style={styles.testBtn}
                />
              )}
            </View>
          );
        })}
      </Card>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Current mode</Text>
        <Text style={styles.note}>
          {mode === 'edge' ? 'Microsoft neural voice (online)' : 'On-device voice (offline)'}
        </Text>
      </Card>

      <Button label="Back to activities" onPress={() => router.push('/')} variant="ghost" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.color.bg },
  inner: { paddingHorizontal: theme.space(4), gap: theme.space(3) },
  back: { fontSize: theme.font.body, color: theme.color.primary, fontWeight: '700' },
  title: { fontSize: theme.font.h1, fontWeight: '800', color: theme.color.ink },
  sub: { fontSize: theme.font.body, color: theme.color.inkSoft, lineHeight: 22 },
  card: { gap: theme.space(3) },
  cardTitle: { fontSize: theme.font.h2, fontWeight: '800', color: theme.color.ink },
  voiceRow: { flexDirection: 'row', gap: theme.space(2), alignItems: 'center' },
  voiceBtn: { flex: 1 },
  testBtn: { width: 90 },
  note: { fontSize: theme.font.small, color: theme.color.inkSoft },
});
