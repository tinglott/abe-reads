import { useCallback, useEffect, useRef, useState } from 'react';
import * as Speech from 'expo-speech';

/**
 * Read-aloud support. Uses the on-device TTS voice (expo-speech), which works
 * offline and needs no API key — important for a classroom tablet.
 */
export function useReadAloud() {
  const [speaking, setSpeaking] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      Speech.stop();
    };
  }, []);

  const stop = useCallback(() => {
    Speech.stop();
    if (mounted.current) setSpeaking(false);
  }, []);

  const speak = useCallback(
    (text: string, rate = 0.85) => {
      Speech.stop();
      if (!text.trim()) return;
      setSpeaking(true);
      const finish = () => {
        if (mounted.current) setSpeaking(false);
      };
      Speech.speak(text, {
        rate, // a little slower than default for early readers
        pitch: 1.0,
        onDone: finish,
        onStopped: finish,
        onError: finish,
      });
    },
    [],
  );

  const toggle = useCallback(
    (text: string) => {
      if (speaking) stop();
      else speak(text);
    },
    [speaking, speak, stop],
  );

  return { speaking, speak, stop, toggle };
}
