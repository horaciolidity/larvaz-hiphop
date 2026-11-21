import type { HipHopDiscipline } from '@/types';

export interface DisciplineOption {
  id: HipHopDiscipline;
  label: string;
  shortLabel: string;
  emoji: string;
  /** Clases tailwind para el chip activo */
  accent: string;
}

/**
 * Los cuatro elementos que Larvaz unifica en un mismo muro.
 * Breaking dejó de ser una sección aparte: es una disciplina más.
 */
export const CORE_DISCIPLINES: DisciplineOption[] = [
  {
    id: 'mc',
    label: 'MC / Rap',
    shortLabel: 'MC',
    emoji: '🎤',
    accent: 'bg-acid text-background border-acid',
  },
  {
    id: 'dj',
    label: 'DJ / Turntablism',
    shortLabel: 'DJ',
    emoji: '🎧',
    accent: 'bg-cyan text-background border-cyan',
  },
  {
    id: 'graffiti',
    label: 'Graffiti / Arte Urbano',
    shortLabel: 'Graffiti',
    emoji: '🎨',
    accent: 'bg-magenta text-content-primary border-magenta',
  },
  {
    id: 'breaking',
    label: 'Breaking / B-Boy & B-Girl',
    shortLabel: 'Breaking',
    emoji: '🤸',
    accent: 'bg-orange text-background border-orange',
  },
];

const EXTRA_DISCIPLINES: Record<string, string> = {
  beatmaking: 'Beatmaking',
  produccion: 'Producción',
  colectivo: 'Colectivo',
  aficionado: 'Aficionado',
};

const ALL_KEYS = new Set<string>([
  ...CORE_DISCIPLINES.map((d) => d.id),
  ...Object.keys(EXTRA_DISCIPLINES),
]);

const TEXT_ALIASES: Array<{ key: HipHopDiscipline; patterns: RegExp }> = [
  { key: 'mc', patterns: /\b(mc|rap|rapper|freestyle|bars|barras|hip\s?hop)\b/i },
  { key: 'dj', patterns: /\b(dj|turntablism|scratch|tornamesa|pinchadiscos)\b/i },
  { key: 'graffiti', patterns: /\b(graffiti|grafiti|graff|writer|mural|spray|wildstyle)\b/i },
  { key: 'breaking', patterns: /\b(breaking|breakdance|b-?boy|b-?girl|bboy|bgirl|cypher|crews?)\b/i },
  { key: 'beatmaking', patterns: /\b(beatmaking|beatmaker|productor|producci[oó]n|beats?)\b/i },
  { key: 'colectivo', patterns: /\b(colectivo|crew|colectiva)\b/i },
];

/** Normaliza cualquier entrada (array, string separado por comas, etc.). */
export function normalizeDisciplines(input: unknown): HipHopDiscipline[] {
  const values: string[] = [];
  if (Array.isArray(input)) {
    for (const item of input) values.push(String(item));
  } else if (typeof input === 'string') {
    values.push(...input.split(/[,/|·;]+/));
  }

  const found = new Set<HipHopDiscipline>();
  for (const raw of values) {
    const key = raw.trim().toLowerCase().replace(/\s+/g, '');
    if (!key) continue;
    if (ALL_KEYS.has(key)) {
      found.add(key as HipHopDiscipline);
      continue;
    }
    for (const alias of TEXT_ALIASES) {
      if (alias.patterns.test(raw)) found.add(alias.key);
    }
  }
  return Array.from(found);
}

/** Deriva disciplinas de un texto libre ya guardado (artistic_disciplines). */
export function parseDisciplinesFromText(text?: string | null): HipHopDiscipline[] {
  return normalizeDisciplines(text || '');
}

/** Devuelve las disciplinas efectivas de un perfil o publicación. */
export function resolveDisciplines(source: {
  disciplines?: unknown;
  artistic_disciplines?: string | null;
  tags?: string[] | null;
}): HipHopDiscipline[] {
  const explicit = normalizeDisciplines(source.disciplines);
  if (explicit.length > 0) return explicit;

  const fromText = parseDisciplinesFromText(source.artistic_disciplines);
  if (fromText.length > 0) return fromText;

  if (Array.isArray(source.tags)) {
    return normalizeDisciplines(source.tags);
  }
  return [];
}

export function disciplineOption(id: string): DisciplineOption | undefined {
  return CORE_DISCIPLINES.find((d) => d.id === id);
}

export function disciplineLabel(id: string): string {
  const core = disciplineOption(id);
  if (core) return core.shortLabel;
  return EXTRA_DISCIPLINES[id] || id;
}

export function disciplineLabels(ids?: string[] | null): string[] {
  return (ids || []).map(disciplineLabel);
}

/** Texto legible para mostrar en tarjetas y perfiles. */
export function formatDisciplines(ids?: string[] | null): string {
  return disciplineLabels(ids).join(' · ');
}
