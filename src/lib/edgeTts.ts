import * as Speech from 'expo-speech';

/** Hard-coded Microsoft Edge (read-aloud) voices — free, no API key needed.
 *  The full list is fetched at runtime from the public endpoint; this is a
 *  curated fallback so the app works even if that fetch fails. */
export const EDGE_VOICES: EdgeVoice[] = [
  { id: 'en-US-AndrewNeural', label: 'Andrew (US, male)', locale: 'en-US', gender: 'Male' },
  { id: 'en-US-AriaNeural', label: 'Aria (US, female)', locale: 'en-US', gender: 'Female' },
  { id: 'en-US-EmmaNeural', label: 'Emma (US, child-friendly, female)', locale: 'en-US', gender: 'Female' },
  { id: 'en-US-BrianNeural', label: 'Brian (US, male)', locale: 'en-US', gender: 'Male' },
  { id: 'en-GB-SoniaNeural', label: 'Sonia (UK, female)', locale: 'en-GB', gender: 'Female' },
  { id: 'en-AU-NatashaNeural', label: 'Natasha (AU, female)', locale: 'en-AU', gender: 'Female' },
  { id: 'en-CA-ClaraNeural', label: 'Clara (CA, female)', locale: 'en-CA', gender: 'Female' },
];

export type EdgeVoice = {
  id: string;
  label: string;
  locale: string;
  gender: string;
};

const VOICES_URL =
  'https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/voices/list' +
  '?trustedclienttoken=6A5AA1D79F4444B1B8FEA15BD88BC60A';

const SYNTH_URL =
  'https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1' +
  '?trustedclienttoken=6A5AA1D79F4444B1B8FEA15BD88BC60A' +
  '&Sec-MS-GEC=1' +
  '&Sec-MS-GEC-Version=1-130.0.2849.56';

const MAX_CHARS = 1000; // Edge rejects very long single requests

export type TtsStatus = 'idle' | 'loading' | 'ready' | 'unavailable';

/** Splits long text into Edge-friendly chunks on sentence/clause boundaries. */
function chunkText(text: string): string[] {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= MAX_CHARS) return [clean];
  const parts = clean.match(/[^.!?]+[.!?]*/g) ?? [clean];
  const out: string[] = [];
  let cur = '';
  for (const p of parts) {
    if ((cur + p).length > MAX_CHARS) {
      if (cur) out.push(cur.trim());
      cur = p;
    } else {
      cur += p;
    }
  }
  if (cur.trim()) out.push(cur.trim());
  return out.length ? out : [clean];
}

function ssml(text: string, voice: string, rate: number): string {
  // Edge uses "x-amount" multipliers; 1.0 -> default.
  const r = `x-${rate.toFixed(2)}`;
  return (
    `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'>` +
    `<voice name='${voice}'><prosody rate='${r}'>${escapeXml(text)}</prosody></voice></speak>`
  );
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildAudioFormatHeader(): ArrayBuffer {
  // WAV header for 24kHz mono 16-bit PCM, filled in with a large size.
  const buffer = new ArrayBuffer(44);
  const view = new DataView(buffer);
  const writeStr = (off: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(off + i, str.charCodeAt(i));
  };
  writeStr(0, 'RIFF');
  view.setUint32(4, 0xffffffff, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, 24000, true); // sample rate
  view.setUint32(28, 48000, true); // byte rate = 24000 * 2
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeStr(36, 'data');
  view.setUint32(40, 0xffffffff, true);
  return buffer;
}

let cachedVoices: EdgeVoice[] | null = null;

export async function fetchEdgeVoices(signal?: AbortSignal): Promise<EdgeVoice[]> {
  try {
    const res = await fetch(VOICES_URL, { signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const list = (data as Array<{ ShortName: string; FriendlyName: string; Locale: string; Gender: string }>)
      .filter((v) => v.Locale?.startsWith('en'))
      .map((v) => ({
        id: v.ShortName,
        label: v.FriendlyName || v.ShortName,
        locale: v.Locale,
        gender: v.Gender,
      }));
    if (list.length) {
      cachedVoices = list;
      return list;
    }
  } catch {
    /* fall through to curated list */
  }
  cachedVoices = cachedVoices ?? EDGE_VOICES;
  return cachedVoices;
}

export function getCachedVoices(): EdgeVoice[] {
  return cachedVoices ?? EDGE_VOICES;
}

/** Pick the best default voice: a child-friendly US English voice if present. */
export function defaultEdgeVoice(voices: EdgeVoice[]): EdgeVoice {
  return (
    voices.find((v) => v.id === 'en-US-EmmaNeural') ??
    voices.find((v) => v.locale === 'en-US') ??
    voices[0]
  );
}

/**
 * Speak via Microsoft Edge's free neural TTS. Returns false if the service is
 * unreachable, so callers can fall back to the on-device voice.
 */
export async function speakWithEdge(
  text: string,
  opts: { voice?: string; rate?: number; onDone?: () => void; onError?: () => void; signal?: AbortSignal },
): Promise<boolean> {
  const voice = opts.voice ?? defaultEdgeVoice(getCachedVoices()).id;
  const rate = opts.rate ?? 0.85;

  const chunks = chunkText(text);
  const header = buildAudioFormatHeader();
  const pcm: Uint8Array[] = [new Uint8Array(header)];

  try {
    for (const chunk of chunks) {
      const res = await fetch(SYNTH_URL, {
        method: 'POST',
        signal: opts.signal,
        headers: {
          'Content-Type': 'application/ssml+xml',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36',
          'Origin': 'chrome-extension://read-aloud',
        },
        body: ssml(chunk, voice, rate),
      });
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
      // Edge streams audio/mpeg; read it fully so we can play it locally.
      const buf = await res.arrayBuffer();
      pcm.push(new Uint8Array(buf));
    }
    const blob = new Blob(pcm as BlobPart[], { type: 'audio/wav' });
    const uri = URL.createObjectURL(blob);
    await playAudio(uri);
    opts.onDone?.();
    return true;
  } catch {
    opts.onError?.();
    return false;
  }
}

/** Plays a local audio URI using the device player. Web-safe via HTMLAudioElement. */
function playAudio(uri: string): Promise<void> {
  return new Promise((resolve) => {
    try {
      const audio = new Audio(uri);
      audio.onended = () => resolve();
      audio.onerror = () => resolve(); // don't reject; treat playback failure as "done"
      const p = audio.play();
      if (p && typeof p.catch === 'function') p.catch(() => resolve());
    } catch {
      resolve();
    }
  });
}

/** Convenience: speak with Edge, fall back to the device TTS voice. */
export async function speakBest(
  text: string,
  opts: { voice?: string; rate?: number; onDone?: () => void } = {},
): Promise<'edge' | 'device'> {
  const ok = await speakWithEdge(text, {
    ...opts,
    onError: () => {},
  });
  if (ok) return 'edge';
  Speech.speak(text, {
    rate: opts.rate ?? 0.85,
    pitch: 1.0,
    onDone: opts.onDone,
  });
  return 'device';
}
