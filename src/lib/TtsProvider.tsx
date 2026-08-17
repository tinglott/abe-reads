import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Platform } from 'react-native';
import * as Speech from 'expo-speech';
import {
  EDGE_VOICES,
  fetchEdgeVoices,
  getCachedVoices,
  speakBest,
  speakWithEdge,
  type EdgeVoice,
  type TtsStatus,
} from '@/lib/edgeTts';

const STORE_KEY = 'abe-reads:tts';
const DEVICE_LABEL = 'Device voice (offline)';

type Mode = 'device' | 'edge';

type TtsCtx = {
  status: TtsStatus;
  voices: EdgeVoice[];
  selectedVoice: string; // Edge id, or 'device'
  mode: Mode;
  setVoice: (id: string) => void;
  speaking: boolean;
  speak: (text: string, rate?: number) => void;
  stop: () => void;
  toggle: (text: string) => void;
};

const Ctx = createContext<TtsCtx | null>(null);

function loadPref(): string {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem(STORE_KEY) ?? 'device';
    }
  } catch {
    /* ignore */
  }
  return 'device';
}

function savePref(id: string) {
  try {
    if (Platform.OS === 'web') localStorage.setItem(STORE_KEY, id);
  } catch {
    /* ignore */
  }
}

export function TtsProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<TtsStatus>('idle');
  const [voices, setVoices] = useState<EdgeVoice[]>(getCachedVoices());
  const [selectedVoice, setSelectedVoice] = useState<string>(loadPref());
  const [speaking, setSpeaking] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    setStatus('loading');
    void fetchEdgeVoices().then((vs) => {
      if (!mounted.current) return;
      setVoices(vs);
      setStatus('ready');
    });
    return () => {
      mounted.current = false;
      Speech.stop();
    };
  }, []);

  const stop = useCallback(() => {
    Speech.stop();
    if (mounted.current) setSpeaking(false);
  }, []);

  const setVoice = useCallback((id: string) => {
    setSelectedVoice(id);
    savePref(id);
  }, []);

  const speak = useCallback(
    (text: string, rate = 0.85) => {
      if (!text.trim()) return;
      stop();
      if (selectedVoice === 'device') {
        setSpeaking(true);
        const done = () => {
          if (mounted.current) setSpeaking(false);
        };
        Speech.speak(text, { rate, pitch: 1.0, onDone: done, onStopped: done, onError: done });
        return;
      }
      setSpeaking(true);
      void speakWithEdge(text, {
        voice: selectedVoice,
        rate,
        onDone: () => mounted.current && setSpeaking(false),
        onError: () => {
          if (!mounted.current) return;
          // Network failed mid-speech: degrade to device voice.
          Speech.speak(text, {
          rate,
          pitch: 1.0,
          onDone: () => {
            if (mounted.current) setSpeaking(false);
          },
        });
        },
      });
    },
    [selectedVoice, stop],
  );

  const toggle = useCallback(
    (text: string) => {
      if (speaking) stop();
      else speak(text);
    },
    [speaking, speak, stop],
  );

  const value = useMemo<TtsCtx>(
    () => ({
      status,
      voices,
      selectedVoice,
      mode: selectedVoice === 'device' ? 'device' : 'edge',
      setVoice,
      speaking,
      speak,
      stop,
      toggle,
    }),
    [status, voices, selectedVoice, speaking, setVoice, speak, stop, toggle],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTts(): TtsCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useTts must be used inside TtsProvider');
  return ctx;
}

export { EDGE_VOICES, DEVICE_LABEL };
