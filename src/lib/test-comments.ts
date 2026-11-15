import {
  NPC_COMMENT_POOLS,
  NPC_PERSONAS,
  type NpcPersona,
  type TestCommentTone,
} from './npc-personas';

export type { TestCommentTone } from './npc-personas';

/**
 * Comentarios de prueba para el modo de generación del Super Admin.
 *
 * Cada sugerencia incluye la personalidad del bot que la va a firmar:
 * callejero, vieja escuela, bardero, buena onda o coloquial.
 */

export const TEST_COMMENT_TONES: Array<{
  id: TestCommentTone;
  label: string;
  hint: string;
}> = [
  { id: 'mixed', label: 'Mezcla variada', hint: 'Combina tonos y voces' },
  { id: 'positive', label: 'Positivos', hint: 'Apoyo y buena onda' },
  { id: 'interest', label: 'De interés', hint: 'Preguntas y ganas de más' },
  { id: 'refutation', label: 'Refutación', hint: 'Crítica respetuosa' },
];

export interface SuggestedNpcComment {
  text: string;
  tone: Exclude<TestCommentTone, 'mixed'>;
  persona_id: string;
  persona_label: string;
  username: string;
  full_name: string;
}

const TONE_CYCLE: Array<Exclude<TestCommentTone, 'mixed'>> = [
  'positive',
  'interest',
  'refutation',
];

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled<T>(items: T[], seed: number): T[] {
  const result = [...items];
  const random = mulberry32(seed || 1);
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function seedFor(base: number, key: string): number {
  let hash = base || 1;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return hash || 1;
}

/**
 * Devuelve `count` comentarios deterministas para una semilla, cada uno con
 * su personalidad. En `mixed` alterna bots y tonos para que la tanda se lea
 * como una conversación real.
 */
export function getSuggestedNpcComments(
  count: number,
  tone: TestCommentTone = 'mixed',
  seed = 1
): SuggestedNpcComment[] {
  const safeCount = Math.max(0, Math.min(100, Math.floor(count || 0)));
  if (safeCount === 0) return [];

  const personaOrder = shuffled(NPC_PERSONAS, seed);
  const personaPools = new Map<string, string[]>();

  for (const persona of NPC_PERSONAS) {
    const tones =
      tone === 'mixed' ? TONE_CYCLE : [tone as Exclude<TestCommentTone, 'mixed'>];
    for (const singleTone of tones) {
      const key = `${persona.id}:${singleTone}`;
      const pool = NPC_COMMENT_POOLS[persona.id]?.[singleTone] || [];
      personaPools.set(key, shuffled(pool, seedFor(seed, key)));
    }
  }

  const counters = new Map<string, number>();
  const usedTexts = new Set<string>();
  const results: SuggestedNpcComment[] = [];

  for (let index = 0; index < safeCount; index++) {
    const persona = personaOrder[index % personaOrder.length];
    const commentTone =
      tone === 'mixed'
        ? TONE_CYCLE[index % TONE_CYCLE.length]
        : (tone as Exclude<TestCommentTone, 'mixed'>);

    const key = `${persona.id}:${commentTone}`;
    const pool = personaPools.get(key) || [];
    if (pool.length === 0) continue;

    let cursor = counters.get(key) || 0;
    let text = pool[cursor % pool.length];
    let attempts = 0;
    while (usedTexts.has(text) && attempts < pool.length) {
      cursor++;
      text = pool[cursor % pool.length];
      attempts++;
    }
    counters.set(key, cursor + 1);
    usedTexts.add(text);

    results.push(buildSuggestion(persona, commentTone, text));
  }

  return results;
}

function buildSuggestion(
  persona: NpcPersona,
  tone: Exclude<TestCommentTone, 'mixed'>,
  text: string
): SuggestedNpcComment {
  return {
    text,
    tone,
    persona_id: persona.id,
    persona_label: persona.label,
    username: persona.username,
    full_name: persona.fullName,
  };
}

/**
 * Variante simple para vistas previas que solo necesitan el texto.
 */
export function getSuggestedComments(
  count: number,
  tone: TestCommentTone = 'mixed',
  seed = 1
): string[] {
  return getSuggestedNpcComments(count, tone, seed).map((comment) => comment.text);
}

/** Semilla nueva por tanda (servidor y cliente). */
export function randomSeed(): number {
  return Math.floor(Math.random() * 1_000_000_000) + 1;
}
