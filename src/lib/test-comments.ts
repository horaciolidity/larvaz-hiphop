/**
 * Comentarios de prueba para el modo de generación del Super Admin.
 *
 * Son textos variados y respetuosos: positivos, de interés real por el
 * contenido y de refutación constructiva. Se usan tanto para la vista
 * previa del panel como para insertar la tanda en Supabase.
 */

export type TestCommentTone = 'mixed' | 'positive' | 'interest' | 'refutation';

export const TEST_COMMENT_TONES: Array<{
  id: TestCommentTone;
  label: string;
  hint: string;
}> = [
  { id: 'mixed', label: 'Mezcla variada', hint: 'Combina las tres energías' },
  { id: 'positive', label: 'Positivos', hint: 'Apoyo y buena onda' },
  { id: 'interest', label: 'De interés', hint: 'Preguntas y ganas de más' },
  { id: 'refutation', label: 'Refutación', hint: 'Crítica respetuosa' },
];

const POSITIVE_COMMENTS = [
  'Esto es fuego puro 🔥 La comunidad necesitaba algo así.',
  'Tremendo aporte, se nota el amor por la cultura.',
  'Barras limpias y respeto. Grande por compartir.',
  'Me voló la cabeza, gracias por subirlo al muro.',
  'Nivel underground de verdad, aplausos.',
  'Qué grande ver esto acá. Sigan así.',
  'Un lujo para el oído, felicitaciones.',
  'La energía de esta pieza es otra cosa. 👏',
  'Groso total. Esto representa al barrio.',
  'Gracias por mantener viva la esencia del hip-hop.',
  'Un aporte de oro para la escena.',
  'Muy bueno, engancha desde el primer segundo.',
  'Esto se comparte con toda la manada. 🔥',
  'Respeto absoluto, hermano. Seguí así.',
  'Calidad y humildad, la combinación perfecta.',
  'Temón. Se siente la dedicación en cada detalle.',
  'Esto merece más vistas, de verdad.',
  'La rompieron con este material. 💯',
  'Aplausos de pie para el equipo.',
  'Nada que reprochar: puro nivel.',
];

const INTEREST_COMMENTS = [
  '¿De dónde es la grabación? Me interesa conocer más de la escena.',
  '¿Hay fecha de algún show o estreno? Quiero seguir esto.',
  'Qué interesante el estilo, ¿alguna referencia para escuchar más?',
  'Me gustaría saber quién produjo el beat.',
  '¿Esto tiene una versión extendida? Quedé con ganas de más.',
  'Buen material. ¿Se puede encontrar en alguna plataforma?',
  'Me interesa el proceso creativo: ¿cómo llegaron a este sonido?',
  '¿Hay más temas del mismo proyecto?',
  'Anotado para escuchar con auriculares. ¿Algún orden recomendado?',
  '¿Hacen fechas en vivo? Me gustaría ir con la banda.',
  'Buenísimo, ¿hay algún sello o colectivo detrás?',
  '¿Se puede usar este tema para una sesión de freestyle?',
  'Me interesa colaborar, ¿cómo se contacta al artista?',
  '¿Este estilo tiene nombre? Quiero buscar más de eso.',
  'Pregunta seria: ¿cómo se logra ese nivel de detalle en la mezcla?',
  '¿Tienen redes o algún lugar donde suban más material?',
  'Me gustaría leer la letra completa, ¿está publicada?',
  '¿Qué equipos usaron para grabar? Suena muy prolijo.',
  '¿Esto forma parte de un disco o es un single suelto?',
  '¿Habrá remixes o versiones con otros artistas?',
];

const REFUTATION_COMMENTS = [
  'Está bien, pero siento que el mix podría sonar más limpio.',
  'No me termina de cerrar la mezcla, la voz queda un poco atrás.',
  'Respeto el trabajo, aunque el beat se me hace repetitivo.',
  'No coincido con la letra, pero banco que se exprese.',
  'Interesante propuesta, aunque esperaba otro desenvolvimiento.',
  'El material está bien, pero el final me sonó apurado.',
  'Hay ideas buenas; para mí le falta trabajo en la base.',
  'No es mi estilo, pero se nota que hay dedicación.',
  'Siento que la grabación no le hace justicia a la letra.',
  'Lo escuché dos veces y todavía le falta claridad al mix.',
  'No todo me convence, pero reconozco el esfuerzo.',
  'Me gustaría una versión con menos efectos para escuchar la voz.',
  'Está bueno, aunque el título promete más de lo que entrega.',
  'No comparto el enfoque, pero respeto la propuesta.',
  'Le pondría más atención al master; hay partes que saturan.',
  'La idea es fuerte, la ejecución me deja a mitad de camino.',
  'Me hubiera gustado otro cierre, se siente cortado.',
  'Buen intento, aunque el ritmo se estira un poco de más.',
  'Correcto, sin llegar a sorprenderme. Igual se agradece el aporte.',
  'Hay potencial, pero necesita pulirse antes de compartirlo.',
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

function interleave(groups: string[][]): string[] {
  const result: string[] = [];
  const max = Math.max(...groups.map((g) => g.length));
  for (let i = 0; i < max; i++) {
    for (const group of groups) {
      if (group[i]) result.push(group[i]);
    }
  }
  return result;
}

/**
 * Devuelve `count` sugerencias deterministas para una semilla.
 * Con `mixed` alterna positivos, interés y refutación.
 */
export function getSuggestedComments(
  count: number,
  tone: TestCommentTone = 'mixed',
  seed = 1
): string[] {
  const safeCount = Math.max(0, Math.min(100, Math.floor(count || 0)));
  if (safeCount === 0) return [];

  let pool: string[];
  if (tone === 'positive') pool = POSITIVE_COMMENTS;
  else if (tone === 'interest') pool = INTEREST_COMMENTS;
  else if (tone === 'refutation') pool = REFUTATION_COMMENTS;
  else pool = interleave([POSITIVE_COMMENTS, INTEREST_COMMENTS, REFUTATION_COMMENTS]);

  const ordered = shuffled(pool, seed);
  return Array.from({ length: safeCount }, (_, index) => ordered[index % ordered.length]);
}

/** Semilla nueva por tanda (servidor y cliente). */
export function randomSeed(): number {
  return Math.floor(Math.random() * 1_000_000_000) + 1;
}
