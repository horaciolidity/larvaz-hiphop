import type {
  AgreementStatus,
  ApplicationStatus,
  BrandVerificationStatus,
  CounterpartKind,
  OpportunityStatus,
  PrizeDeliveryStatus,
  SponsorCommercialCategory,
  SponsorArtistCategory,
  SponsorPostKind,
  SponsorshipType,
  SweepstakeMethod,
  SweepstakeStatus,
} from '@/types/sponsors';

export const COMMERCIAL_CATEGORIES: { id: SponsorCommercialCategory; label: string; emoji: string }[] = [
  { id: 'indumentaria', label: 'Indumentaria urbana', emoji: '🧥' },
  { id: 'calzado', label: 'Calzado', emoji: '👟' },
  { id: 'accesorios', label: 'Accesorios', emoji: '🧢' },
  { id: 'tecnologia', label: 'Tecnología', emoji: '🎧' },
  { id: 'musica', label: 'Música', emoji: '🎵' },
  { id: 'audiovisual', label: 'Producción audiovisual', emoji: '🎬' },
  { id: 'arte', label: 'Pinturas y materiales artísticos', emoji: '🎨' },
  { id: 'deportes', label: 'Deportes y skate', emoji: '🛹' },
  { id: 'bebidas', label: 'Bebidas y alimentación', emoji: '🥤' },
  { id: 'eventos', label: 'Eventos', emoji: '🎤' },
  { id: 'servicios', label: 'Servicios', emoji: '🛠️' },
  { id: 'otros', label: 'Otros', emoji: '✨' },
];

export const ARTIST_CATEGORIES: { id: SponsorArtistCategory; label: string; emoji: string }[] = [
  { id: 'mc', label: 'MCs', emoji: '🎤' },
  { id: 'bboy', label: 'B-Boys', emoji: '🤸' },
  { id: 'dj', label: 'DJs', emoji: '🎚️' },
  { id: 'graffiti', label: 'Grafiteros', emoji: '🎨' },
  { id: 'bailarin', label: 'Bailarines', emoji: '💃' },
  { id: 'productor', label: 'Productores', emoji: '🎛️' },
  { id: 'fotografo', label: 'Fotógrafos', emoji: '📸' },
  { id: 'crew', label: 'Crews', emoji: '👥' },
  { id: 'skate', label: 'Skate', emoji: '🛹' },
  { id: 'otros', label: 'Otros talentos urbanos', emoji: '⭐' },
];

export const SPONSORSHIP_TYPES: { id: SponsorshipType; label: string; emoji: string; hint: string }[] = [
  { id: 'economico', label: 'Económico', emoji: '💵', hint: 'Pago único, mensual, por proyecto o campaña' },
  { id: 'productos', label: 'Productos', emoji: '📦', hint: 'Indumentaria, calzado, equipamiento, materiales' },
  { id: 'logistico', label: 'Logístico', emoji: '🚐', hint: 'Viáticos, transporte, alojamiento, entradas' },
  { id: 'mixto', label: 'Mixto', emoji: '🎁', hint: 'Dinero + productos + servicios' },
  { id: 'cripto', label: 'Criptomonedas', emoji: '🪙', hint: 'Pago en activos digitales verificables' },
];

export const POST_KINDS: { id: SponsorPostKind; label: string; emoji: string; hint: string }[] = [
  { id: 'normal', label: 'Publicación normal', emoji: '📝', hint: 'Novedad de la marca' },
  { id: 'producto', label: 'Presentación de producto', emoji: '📦', hint: 'Mostrá lo que vendés' },
  { id: 'lanzamiento', label: 'Lanzamiento', emoji: '🚀', hint: 'Nuevo drop o colección' },
  { id: 'promocion', label: 'Promoción', emoji: '🏷️', hint: 'Descuentos y beneficios' },
  { id: 'patrocinio', label: 'Nuevo patrocinio', emoji: '🤝', hint: 'Anunciá un artista patrocinado' },
  { id: 'convocatoria', label: 'Convocatoria', emoji: '📣', hint: 'Buscá talento para tu marca' },
  { id: 'busqueda', label: 'Búsqueda de artistas', emoji: '🔎', hint: 'Convocatoria artística' },
  { id: 'sorteo', label: 'Sorteo', emoji: '🎟️', hint: 'Regalá un premio a la comunidad' },
  { id: 'concurso', label: 'Concurso', emoji: '🏆', hint: 'Mejor comentario, foto o propuesta' },
  { id: 'desafio', label: 'Desafío', emoji: '🔥', hint: 'LARVAZ CHALLENGES' },
  { id: 'premio', label: 'Entrega de premios', emoji: '🎁', hint: 'Anunciá ganadores' },
  { id: 'donacion', label: 'Campaña de donación', emoji: '❤️', hint: 'Apoyá un proyecto cultural' },
  { id: 'evento', label: 'Evento', emoji: '📅', hint: 'Fecha, lugar y entradas' },
  { id: 'competencia', label: 'Competencia', emoji: '⚔️', hint: 'Batallas y torneos' },
  { id: 'proyecto', label: 'Proyecto colaborativo', emoji: '🧩', hint: 'Buscar aliados para crear' },
];

export const SWEEPSTAKE_METHODS: { id: SweepstakeMethod; label: string; hint: string }[] = [
  { id: 'boton', label: 'Botón PARTICIPAR', hint: 'Un clic, un registro por usuario' },
  { id: 'comentarios', label: 'Por comentarios', hint: 'Palabra, pregunta o comentario libre' },
  { id: 'likes', label: 'Por likes', hint: 'El like es requisito de participación' },
  { id: 'numeros', label: 'Adivinar número', hint: 'Número exacto, cercano o al azar' },
  { id: 'palabras', label: 'Adivinar palabra', hint: 'Palabra o frase secreta con pistas' },
  { id: 'mejor_comentario', label: 'Mejor comentario', hint: 'El jurado elige con criterios públicos' },
  { id: 'aleatorio', label: 'Aleatorio automático', hint: 'Sorteo verificable al cerrar' },
];

export const COUNTERPART_KINDS: { id: CounterpartKind; label: string }[] = [
  { id: 'publicaciones', label: 'Publicaciones en redes' },
  { id: 'historias', label: 'Historias en redes' },
  { id: 'menciones', label: 'Menciones de marca' },
  { id: 'fotos', label: 'Fotografías promocionales' },
  { id: 'videos', label: 'Videos y reels' },
  { id: 'posts_larvaz', label: 'Publicaciones en LARVAZ' },
  { id: 'presentaciones', label: 'Presentaciones en eventos' },
  { id: 'presencia_marca', label: 'Presencia de marca en competencias' },
  { id: 'disenos', label: 'Diseños personalizados' },
  { id: 'murales', label: 'Murales' },
  { id: 'produccion_musical', label: 'Producciones musicales' },
  { id: 'colaboraciones', label: 'Colaboraciones creativas' },
  { id: 'exclusividad', label: 'Exclusividad temporal' },
  { id: 'otro', label: 'Otro compromiso' },
];

export const COUNTRIES = [
  'Argentina',
  'Chile',
  'Colombia',
  'México',
  'Uruguay',
  'Perú',
  'Brasil',
  'Venezuela',
  'Ecuador',
  'Bolivia',
  'Paraguay',
  'Panamá',
  'Costa Rica',
  'Guatemala',
  'República Dominicana',
  'Puerto Rico',
  'Estados Unidos',
  'España',
];

export const BRAND_STATUS_LABEL: Record<BrandVerificationStatus, string> = {
  pendiente: 'Verificación pendiente',
  verificada: 'Marca verificada',
  rechazada: 'Verificación rechazada',
  suspendida: 'Cuenta suspendida',
};

export const OPPORTUNITY_STATUS_LABEL: Record<OpportunityStatus, string> = {
  borrador: 'Borrador',
  abierta: 'Abierta',
  pausada: 'Pausada',
  cerrada: 'Cerrada',
};

export const APPLICATION_STATUS_LABEL: Record<ApplicationStatus, string> = {
  pendiente: 'Pendiente',
  preseleccionada: 'Preseleccionada',
  oferta: 'Oferta enviada',
  aceptada: 'Aceptada',
  rechazada: 'Rechazada',
  retirada: 'Retirada',
};

export const AGREEMENT_STATUS_LABEL: Record<AgreementStatus, string> = {
  pendiente: 'Pendiente',
  negociacion: 'En negociación',
  aceptado: 'Aceptado',
  en_curso: 'En curso',
  cumplimiento_parcial: 'Cumplimiento parcial',
  completado: 'Completado',
  cancelado: 'Cancelado',
  disputa: 'En disputa',
};

export const SWEEPSTAKE_STATUS_LABEL: Record<SweepstakeStatus, string> = {
  borrador: 'Borrador',
  activo: 'Activo',
  cerrado: 'Cerrado',
  sorteado: 'Sorteado',
  cancelado: 'Cancelado',
};

export const PRIZE_STATUS_LABEL: Record<PrizeDeliveryStatus, string> = {
  pendiente: 'Pendiente',
  contactando: 'Contactando ganador',
  coordinando: 'Coordinando entrega',
  enviado: 'Enviado',
  entregado: 'Entregado',
  incidencia: 'Incidencia',
  confirmado: 'Recepción confirmada',
};

export const POINTS_RULES: { action: string; label: string; points: number; daily: number }[] = [
  { action: 'sorteo_participar', label: 'Participar en un sorteo', points: 10, daily: 5 },
  { action: 'desafio_participar', label: 'Presentar un desafío', points: 25, daily: 2 },
  { action: 'comentario_sponsor', label: 'Comentar una publicación de marca', points: 3, daily: 10 },
  { action: 'donacion_verificada', label: 'Aportar a una campaña verificada', points: 20, daily: 5 },
  { action: 'acuerdo_completado', label: 'Completar un patrocinio', points: 100, daily: 3 },
  { action: 'resena', label: 'Dejar una reseña válida', points: 10, daily: 3 },
  { action: 'perfil_completo', label: 'Completar perfil de marca o artista', points: 50, daily: 1 },
];

export function labelOf<T extends string>(id: T, list: { id: T; label: string }[]): string {
  return list.find((x) => x.id === id)?.label || id;
}

export function emojiOf<T extends string>(id: T, list: { id: T; emoji: string }[]): string {
  return list.find((x) => x.id === id)?.emoji || '✨';
}

export function artistCategoryLabel(id: SponsorArtistCategory): string {
  return labelOf(id, ARTIST_CATEGORIES);
}

export function formatMoney(amount?: number, currency = 'USD'): string {
  if (amount === undefined || amount === null || Number.isNaN(amount)) return 'A convenir';
  try {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}

export function daysLeft(dateIso: string): number {
  const diff = new Date(dateIso).getTime() - Date.now();
  return Math.ceil(diff / 86_400_000);
}

export function isPast(dateIso: string): boolean {
  return new Date(dateIso).getTime() <= Date.now();
}

export function timeAgo(dateIso: string): string {
  const diff = Date.now() - new Date(dateIso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `hace ${days} d`;
  return new Date(dateIso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
}

export function formatDate(dateIso?: string): string {
  if (!dateIso) return '—';
  return new Date(dateIso).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(dateIso?: string): string {
  if (!dateIso) return '—';
  return new Date(dateIso).toLocaleString('es-AR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

export function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join('') || 'LZ'
  );
}

/** Normaliza texto para comparar respuestas de adivinanzas. */
export function normalizeAnswer(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9áéíóúñ ]/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}
