import { HF_TOKEN, hasHuggingFace } from './config';

const ROUTER = 'https://router.huggingface.co/v1/chat/completions';

/** Open-weights model served through HF's OpenAI-compatible router. */
const MODEL = 'meta-llama/Llama-3.1-8B-Instruct';

export type GeneratedQuestion = {
  id: string;
  type: 'mc';
  prompt: string;
  choices: string[];
  answerIndex: number;
  page?: number;
};

type ChatResponse = {
  choices?: { message?: { content?: string } }[];
};

function firstJsonArray(text: string): unknown {
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start === -1 || end <= start) throw new Error('no JSON array in response');
  return JSON.parse(text.slice(start, end + 1));
}

/**
 * Ask an open model for fresh comprehension questions about a passage.
 * Throws on any failure so callers can fall back to the built-in bank.
 */
export async function generateQuestions(
  passage: string,
  count = 4,
  signal?: AbortSignal,
): Promise<GeneratedQuestion[]> {
  if (!hasHuggingFace) throw new Error('HuggingFace token not configured');

  const res = await fetch(ROUTER, {
    method: 'POST',
    signal,
    headers: {
      Authorization: `Bearer ${HF_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.4,
      max_tokens: 900,
      messages: [
        {
          role: 'system',
          content:
            'You write reading-comprehension questions for children aged 7-10. ' +
            'Use only facts stated in the passage. Keep language simple and kind. ' +
            'Reply with JSON only.',
        },
        {
          role: 'user',
          content:
            `Passage:\n"""${passage}"""\n\n` +
            `Write ${count} multiple-choice questions about the passage. ` +
            'Reply with a JSON array; each item must be ' +
            '{"prompt": string, "choices": [string, string, string], "answerIndex": 0|1|2}. ' +
            'Exactly one choice is correct and the other two must be clearly wrong. No commentary.',
        },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`HuggingFace ${res.status}: ${body.slice(0, 180)}`);
  }

  const data = (await res.json()) as ChatResponse;
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('empty response from model');

  const parsed = firstJsonArray(content);
  if (!Array.isArray(parsed)) throw new Error('model did not return an array');

  const out: GeneratedQuestion[] = [];
  parsed.forEach((item, i) => {
    if (typeof item !== 'object' || item === null) return;
    const q = item as Record<string, unknown>;
    const prompt = typeof q.prompt === 'string' ? q.prompt.trim() : '';
    const choices = Array.isArray(q.choices)
      ? q.choices.filter((c): c is string => typeof c === 'string').map((c) => c.trim())
      : [];
    const answerIndex = typeof q.answerIndex === 'number' ? q.answerIndex : -1;
    // Drop anything malformed rather than showing a child a broken question.
    if (!prompt || choices.length < 2) return;
    if (answerIndex < 0 || answerIndex >= choices.length) return;
    out.push({ id: `ai${i + 1}`, type: 'mc', prompt, choices, answerIndex });
  });

  if (out.length === 0) throw new Error('no usable questions returned');
  return out;
}
