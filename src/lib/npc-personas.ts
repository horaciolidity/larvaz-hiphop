export type TestCommentTone = 'mixed' | 'positive' | 'interest' | 'refutation';

/**
 * Personalidades de los bots de prueba.
 *
 * Cada NPC tiene una voz propia para que las tandas de comentarios no
 * suenen todas iguales: callejero, vieja escuela, bardero, buena onda y
 * oyente coloquial (informal, con errores de tipeo).
 */
export interface NpcPersona {
  id: string;
  username: string;
  fullName: string;
  label: string;
  description: string;
  email: string;
  location: string;
}

export const NPC_PERSONAS: NpcPersona[] = [
  {
    id: 'callejero',
    username: 'anonimo_muro',
    fullName: 'Anónimo del barrio',
    label: 'Callejero',
    description: 'Lunfardo barrial, directo y sin vueltas.',
    email: 'anonimo.muro@larvaz.local',
    location: 'Comunidad Larvaz',
  },
  {
    id: 'escuela',
    username: 'escuela_mc',
    fullName: 'MC de la vieja escuela',
    label: 'Vieja escuela',
    description: 'Boom-bap, sample y respeto por el linaje.',
    email: 'escuela.mc@larvaz.local',
    location: 'Comunidad Larvaz',
  },
  {
    id: 'bardero',
    username: 'bardero_anonimo',
    fullName: 'Bardo anónimo',
    label: 'Bardero',
    description: 'Crítico, provocador y sin caretearla.',
    email: 'bardero.anonimo@larvaz.local',
    location: 'Comunidad Larvaz',
  },
  {
    id: 'buena_onda',
    username: 'buenaonda_muro',
    fullName: 'Buena onda',
    label: 'Buena onda',
    description: 'Apoyo, entusiasmo y emojis por todos lados.',
    email: 'buenaonda.muro@larvaz.local',
    location: 'Comunidad Larvaz',
  },
  {
    id: 'coloquial',
    username: 'oyente_anonimo',
    fullName: 'Oyente anónimo',
    label: 'Coloquial',
    description: 'Informal, minúsculas y errores de tipeo.',
    email: 'oyente.anonimo@larvaz.local',
    location: 'Comunidad Larvaz',
  },
];

export const NPC_PERSONA_BY_USERNAME = new Map(
  NPC_PERSONAS.map((persona) => [persona.username.toLowerCase(), persona])
);

export function getNpcPersonaByUsername(username?: string | null): NpcPersona | undefined {
  if (!username) return undefined;
  return NPC_PERSONA_BY_USERNAME.get(String(username).toLowerCase());
}

/** Los perfiles técnicos de prueba no se muestran en la comunidad. */
const LEGACY_TEST_BOT_USERNAMES = new Set(['anonima_muro', 'barras_anonimas']);

export function isTestBotUsername(username?: string | null): boolean {
  if (!username) return false;
  const clean = String(username).toLowerCase();
  return NPC_PERSONA_BY_USERNAME.has(clean) || LEGACY_TEST_BOT_USERNAMES.has(clean);
}

/**
 * Bancos de frases por personalidad y tono. La misma idea se dice distinto
 * según quién sea el bot: no es lo mismo un bardero que una buena onda.
 */
export const NPC_COMMENT_POOLS: Record<
  string,
  Record<Exclude<TestCommentTone, 'mixed'>, string[]>
> = {
  callejero: {
    positive: [
      'Esto está re zarpado, de una. La rompiste hermano 🔥',
      'Manso material, se siente la calle de verdad.',
      'Aguante el barrio, esto es fuego puro.',
      'Tremendo fierro te mandaste, groso total.',
      'Re bueno loco, lo pongo en loop toda la tarde.',
      'Está re jugado y me encanta, así se hace.',
      'Más vivo que nunca el under, grande.',
      'La rompiste con este tema, sin chamuyo.',
    ],
    interest: [
      '¿De qué barrio sale esto? Quiero pegarme una vuelta.',
      '¿Hay fecha en vivo? Llevo a la banda de una.',
      'Che, ¿dónde se consigue el tema completo?',
      '¿Quién tiró el beat? Está re bueno el sample.',
      '¿Se puede pasar por la radio? Tirá data.',
      '¿Hay fecha de la próxima jam? Avisá que caemos.',
      '¿Quién está detrás del proyecto? Quiero seguir la movida.',
      '¿Se consigue en vinilo o solo digital?',
    ],
    refutation: [
      'Está bueno pero el mix me suena medio sucio, de una te lo digo.',
      'No me cierra la voz tan atrás, se pierde la letra.',
      'Banco la idea pero el beat se repite mucho, loco.',
      'Le falta calle al master, suena muy de estudio.',
      'No es lo mío pero se respeta el laburo.',
      'Medio apurado el final, se corta de una.',
      'Me gustó la primera parte, después se me desinfló.',
      'Le pondría menos efecto a la voz, se entiende poco.',
    ],
  },
  escuela: {
    positive: [
      'Esto es hip-hop de verdad: boom-bap, sample y respeto por el linaje.',
      'Se nota el estudio de la vieja escuela en cada compás.',
      'Excelente trabajo, la cadencia recuerda a los 90s sin copiar.',
      'Un aporte serio para la cultura. Felicitaciones.',
      'La estructura de 16 barras está impecable.',
      'Muy bien ejecutado, hay oficio detrás de esto.',
      'La mezcla respeta la dinámica y deja respirar la voz.',
      'Trabajo sólido, con criterio y memoria colectiva.',
    ],
    interest: [
      '¿Qué sample usaron de base? Suena a un clásico.',
      '¿Grabaron con MPC o todo en DAW?',
      '¿Hay versión instrumental? Me interesa analizar la producción.',
      '¿Esto forma parte de un EP? Me gustaría escuchar el concepto completo.',
      '¿Quién hizo el scratch? Está muy bien colocado.',
      '¿La mezcla la hizo el mismo equipo del beat?',
      '¿Hay referencias que recomienden para entender la propuesta?',
      '¿Van a publicar la letra completa en algún lado?',
    ],
    refutation: [
      'Técnicamente correcto, aunque la letra se queda en lugares comunes.',
      'El beat es sólido, pero la interpretación no transmite urgencia.',
      'Hay buen oficio, sin embargo el cierre resulta previsible.',
      'No critico el estilo, pero el mix necesita más aire.',
      'La referencia noventosa está bien, aunque roza el homenaje literal.',
      'El flow es parejo; le faltaría un quiebre para no sonar plano.',
      'La idea es interesante pero el desarrollo se estira de más.',
      'Falta contraste entre secciones; todo suena en el mismo plano.',
    ],
  },
  bardero: {
    positive: [
      'Está bueno, no te voy a mentir: me cerró el oído.',
      'No banco muchas cosas, pero esto sí. La rompiste.',
      'Te la debo, pensé que era humo y está muy bien.',
      'Me hiciste mover la cabeza, bardo aprobado.',
      'Bien ahí, sin caretearla. Se nota el laburo.',
      'Fuego. Y lo digo sin vueltas.',
      'Me esperaba menos y me sorprendió, banco.',
      'Le di play con desconfianza y me ganó.',
    ],
    interest: [
      '¿Quién produjo esto? Quiero bardear con fundamento.',
      '¿Hay más? Porque con una no alcanza para opinar.',
      '¿Dónde tocan? Capaz me acerco a discutirlo en persona.',
      '¿El beat es propio o prestado? Necesito saber a quién felicitar.',
      '¿Van a subir la letra? Quiero leerla antes de bardear.',
      '¿Cuándo sale lo próximo? Avisá, sin chamuyo.',
      '¿Hay algún vivo donde se pueda ver esto en serio?',
      '¿Quién hizo la mezcla? Tengo preguntas.',
    ],
    refutation: [
      'Meh, está bien pero no me vuela la cabeza como dicen.',
      'Le falta calle y le sobra pose, para mí.',
      'El beat está bueno; la letra no dice nada nuevo.',
      'No me cierra el hype, hay mucho humo alrededor.',
      'Se puede mejorar: menos efecto y más verdad.',
      'No es malo, pero tampoco es la joya que venden.',
      'Le falta filo, se queda en zona segura.',
      'La intro promete más de lo que después entrega.',
    ],
  },
  buena_onda: {
    positive: [
      '¡Qué grande! Gracias por compartir esto con la comunidad 💚',
      'Se siente el amor en cada detalle, felicitaciones 🙌',
      'Me alegró el día, en serio. Seguí así.',
      'Un regalo para los oídos, gracias por tanto.',
      'Qué lindo ver crecer a la escena con aportes así ✨',
      'Te merecés todo el reconocimiento, gran trabajo.',
      'Qué energía tan linda, gracias por ponerle el corazón.',
      'Esto suma un montón a la comunidad, bravo 👏',
    ],
    interest: [
      '¡Qué lindo! ¿Dónde podemos escuchar más de esto?',
      'Me encantaría saber más, ¿hay redes para seguirte?',
      '¿Se viene algo en vivo? Me sumo con toda la buena onda.',
      '¿Cómo fue el proceso? Me encanta conocer las historias detrás.',
      '¿Hay fechas para compartir en la agenda?',
      '¿Te puedo recomendar a alguien para colaborar?',
      '¿Vas a subir más material pronto? Quedo atento 💫',
      '¿Se puede compartir en la radio comunitaria?',
    ],
    refutation: [
      'Con todo el respeto, creo que el mix podría brillar más.',
      'Me encanta la idea; solo le pondría un poquito más de volumen a la voz.',
      'No es mi estilo, pero valoro muchísimo el esfuerzo 💪',
      'Le falta un pequeño ajuste al final, igual se disfruta.',
      'No coincido del todo, pero celebro que te animes a compartir.',
      'Está muy bien; para la próxima probaría otro cierre.',
      'Lo escuché con cariño y creo que la voz merece más protagonismo.',
      'Pequeño detalle: el efecto tapa un poco la emoción.',
    ],
  },
  coloquial: {
    positive: [
      'buenisimo esto, me re gusto jaja',
      'q temazo por dios, lo escuche 3 veces ya',
      'naa terrible, esta re bueno en serio',
      'me encanto, no se como no lo habia escuchado antes',
      'q grande loco, segui subiendo cosas asi',
      'esto es lo q necesitaba hoy, gracias',
      'buenisimo mal, me re copo',
      'q bueno q esta esto, en serio',
    ],
    interest: [
      'che de donde es esto? quiero escuchar mas',
      'hay algun link para escucharlo entero? xq me quede con ganas',
      'q es eso del final? no entendi jaja',
      'cuando sacan mas? avisen xfa',
      'quien lo hizo? me interesa seguirlo',
      'esto tmb esta en spotify? pregunto xq no lo encuentro',
      'cuanto dura? xq se me hizo corto',
      'hay version en vivo? me gustaria escucharla',
    ],
    refutation: [
      'esta bueno pero no me termina de cerrar el sonido',
      'siento q la voz suena muy baja, capaz soy yo',
      'me gusto la letra pero el beat me aburrio un toque',
      'no es mi estilo pero ta bien igual',
      'le falta algo, no se q, pero le falta',
      'esperaba otra cosa por el titulo, igual se deja escuchar',
      'el final me sono raro, no se',
      'me gusto mas la primera parte q la segunda',
    ],
  },
};
