import {
  Profile,
  Post,
  Comment,
  HipHopEvent,
  Notification,
  Report,
  FeedFilter,
  ContentType,
  CryptoTip,
  RadioStation,
  RadioTrack,
  UserRole,
  WithdrawalRequest,
} from '@/types';


// ==============================================================================
// INITIAL DEMO CULTURAL DATA (Authentic Hip-Hop Underground Profiles & Content)
// ==============================================================================

export const GUEST_USER: Profile = {
  id: 'user-guest',
  username: 'visitante',
  full_name: 'Visitante Larvaz',
  bio: 'Explorando la cultura Hip-Hop en el muro comunitario.',
  avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
  role: 'user',
  is_banned: false,
  created_at: '2026-01-01T00:00:00Z',
  followers_count: 0,
  following_count: 0,
  posts_count: 0,
  referral_code: 'larvaz-invitado',
  referrals_count: 0,
  referral_props_earned: 0,
  is_guest: true,
};

export const INITIAL_PROFILES: Profile[] = [
  {
    id: 'user-larvaz-admin',
    username: 'admin_larvaz',
    full_name: 'Moderación Larvaz',
    bio: 'Equipo central de cuidado comunitario, soporte técnico y archivo cultural de Larvaz Hip-Hop.',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop',
    banner_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&h=400&fit=crop',
    location: 'Mendoza, Argentina',
    website: 'https://larvazhiphop.org',
    portfolio_url: 'https://larvazhiphop.org/manifiesto',
    artistic_disciplines: 'Archivo cultural, gestión comunitaria y sonido underground',
    role: 'super_admin',
    is_banned: false,
    verified_artist: true,
    referral_code: 'larvaz-admin_larvaz',
    referrals_count: 6,
    referral_props_earned: 300,
    wallet_addresses: {
      usdt: '0x71C...larvazTreasury',
      sol: 'LarvazSuperAdminSolanaTreasuryAddress11111111',
      btc: 'bc1qlarvazhiphopcommunityfundtreasury2026',
    },
    created_at: '2026-01-10T12:00:00Z',
    followers_count: 128,
    following_count: 45,
    posts_count: 14,
  },
  {
    id: 'user-graffiti-krew',
    username: 'kronos_graff',
    full_name: 'Kronos Muro Libre',
    bio: 'Pintando persianas y vagones desde 2014. Aerosol, boquillas fat cap, tipografía salvaje y letras con personalidad.',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
    banner_url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&h=400&fit=crop',
    location: 'Santiago de Chile',
    website: 'https://instagram.com/kronos_muro',
    artistic_disciplines: 'Graffiti, Wildstyle, Bombing, Arte Callejero',
    role: 'user',
    is_banned: false,
    verified_artist: true,
    referral_code: 'larvaz-kronos_graff',
    referrals_count: 9,
    referral_props_earned: 450,
    wallet_addresses: {
      sol: '7nY2kroNosSolanaGraffitiCrewAddress9999999999',
      usdt: '0x32A489F2f1eC855B68A78351B2DbA2718E70441E',
      btc: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    },
    created_at: '2026-02-14T10:00:00Z',
    followers_count: 312,
    following_count: 89,
    posts_count: 26,
  },
  {
    id: 'user-dj-raw',
    username: 'dj_frecuencia',
    full_name: 'DJ Frecuencia Raw',
    bio: 'Turntablism puro, scratches analógicos y mezclas en Technics 1200. Digging de vinilos de soul, funk y jazz.',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop',
    banner_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&h=400&fit=crop',
    location: 'Medellín, Colombia',
    website: 'https://soundcloud.com/dj-frecuencia-raw',
    artistic_disciplines: 'DJing, Turntablism, Beatmaking, Boom-Bap',
    role: 'user',
    is_banned: false,
    verified_artist: true,
    referral_code: 'larvaz-dj_frecuencia',
    referrals_count: 14,
    referral_props_earned: 700,
    wallet_addresses: {
      sol: '4mQxFrecuenciaDjTurntableSolanaAddress88888888',
      usdt: '0x88C45a279B6C3F2d6d1d4f997C2245b1E1719B5E',
      eth: '0x88C45a279B6C3F2d6d1d4f997C2245b1E1719B5E',
    },
    created_at: '2026-02-20T15:30:00Z',
    followers_count: 540,
    following_count: 120,
    posts_count: 31,
  },
  {
    id: 'user-mc-asfalto',
    username: 'rimas_del_sur',
    full_name: 'Lírica & Asfalto',
    bio: 'Palabra consciente, barras directas y mensaje social. El rap es la voz de los barrios sin micrófono.',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
    banner_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&h=400&fit=crop',
    location: 'Montevideo, Uruguay',
    website: 'https://open.spotify.com/artist/sample',
    artistic_disciplines: 'MC, Rap Consciente, Escritura, Freestyle',
    role: 'user',
    is_banned: false,
    verified_artist: true,
    referral_code: 'larvaz-rimas_del_sur',
    referrals_count: 8,
    referral_props_earned: 400,
    wallet_addresses: {
      usdt: '0x55B33F73b64082531C28Fe396Abf49F09590B22A',
      btc: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
      sol: '9pZrRimasDelSurMontevideoRapSolanaAddress7777',
    },
    created_at: '2026-03-01T18:00:00Z',
    followers_count: 420,
    following_count: 98,
    posts_count: 19,
  },
  {
    id: 'user-bboy-cypher',
    username: 'bboy_vortex',
    full_name: 'Vortex Bboy Crew',
    bio: 'Footwork, toprock, windmills y estilo libre en el linóleo. Manteniendo encendida la llama del cypher original.',
    avatar_url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&h=200&fit=crop',
    banner_url: 'https://images.unsplash.com/photo-1545128485-c400e7702796?w=1200&h=400&fit=crop',
    location: 'CDMX, México',
    website: 'https://youtube.com',
    artistic_disciplines: 'Breaking, B-boying, Cyphers, Cultura Hip Hop',
    role: 'user',
    is_banned: false,
    verified_artist: false,
    referral_code: 'larvaz-bboy_vortex',
    referrals_count: 4,
    referral_props_earned: 200,
    wallet_addresses: {
      sol: '5tK9VortexBboyCypherCrewSolanaAddress66666666',
      usdt: '0x12F988d4Fe80F5374466b7A48E44f77259699B4',
    },
    created_at: '2026-03-12T11:20:00Z',
    followers_count: 285,
    following_count: 73,
    posts_count: 15,
  },
];

export const INITIAL_POSTS: Post[] = [
  {
    id: 'post-text-freestyle',
    user_id: 'user-mc-asfalto',
    content_type: 'text',
    provider: 'generic',
    description: `«Escribo en la libreta con tinta de madrugada,\nel asfalto me enseña más que cualquier fachada.\nCuatro elementos vivos, sin pose ni contrato,\nel verdadero hip-hop se siente en el contacto.»\n\n¿Quién se suma al cypher de rimas este fin de semana en la plaza? Dejen sus barras en los comentarios. 🎤🔥`,
    tags: ['freestyle', 'letras', 'barras', 'cultura'],
    likes_count: 63,
    comments_count: 9,
    is_hidden: false,
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    author: INITIAL_PROFILES[3],
    user_has_liked: true,
    user_has_bookmarked: false,
  },
  {
    id: 'post-1',
    user_id: 'user-graffiti-krew',
    external_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    normalized_url: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
    provider: 'youtube',
    content_type: 'video',
    description: 'Registro audiovisual de la sesión nocturna en el puente ferroviario. Tres piezas en wildstyle coordinadas con el crew. La pared habla lo que la ciudad calla. 🔥🎨',
    tags: ['graffiti', 'bombing', 'wildstyle', 'mural'],
    likes_count: 38,
    comments_count: 4,
    is_hidden: false,
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 min ago
    author: INITIAL_PROFILES[1],
    metadata: {
      title: 'Muros Vivos — Sesión de Graffiti Nocturno en Gran Formato',
      author_name: 'Kronos Muro Libre',
      thumbnail_url: 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=800&h=450&fit=crop',
      embed_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      provider: 'youtube',
    },
    user_has_liked: false,
    user_has_bookmarked: false,
  },
  {
    id: 'post-2',
    user_id: 'user-dj-raw',
    external_url: 'https://soundcloud.com/sample-track/underground-cypher-beat',
    normalized_url: 'https://soundcloud.com/sample-track/underground-cypher-beat',
    provider: 'soundcloud',
    content_type: 'music',
    description: 'Nuevo Beat Tape "Cintas del Asfalto". 90 BPM cargados de cajas crujientes de la E-mu SP-1200 y recortes de vinilo de funk de los 70s. Queda disponible para que cualquier MC del muro suelte sus rimas.',
    tags: ['boombap', 'turntablism', 'sp1200', 'beattape'],
    likes_count: 56,
    comments_count: 8,
    is_hidden: false,
    created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(), // 3 hours ago
    author: INITIAL_PROFILES[2],
    metadata: {
      title: 'Raw Tape Session #4 (Vinyl Digging & Boom-Bap)',
      author_name: 'DJ Frecuencia Raw',
      thumbnail_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&h=450&fit=crop',
      embed_url: 'https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/1',
      provider: 'soundcloud',
    },
    user_has_liked: true,
    user_has_bookmarked: true,
  },
  {
    id: 'post-3',
    user_id: 'user-mc-asfalto',
    external_url: 'https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT',
    normalized_url: 'https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT',
    provider: 'spotify',
    content_type: 'music',
    description: 'Estreno del corte "Resistencia de Cemento". Producción independiente, autogestión de principio a fin. El hip hop no es negocio de disqueras, es cultura popular.',
    tags: ['rap', 'mc', 'underground', 'hiphopenespanol'],
    likes_count: 72,
    comments_count: 11,
    is_hidden: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12 hours ago
    author: INITIAL_PROFILES[3],
    metadata: {
      title: 'Resistencia de Cemento — Single Oficial',
      author_name: 'Lírica & Asfalto',
      thumbnail_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=450&fit=crop',
      embed_url: 'https://open.spotify.com/embed/track/4cOdK2wGLETKBW3PvgPWqT',
      provider: 'spotify',
    },
    user_has_liked: false,
    user_has_bookmarked: false,
  },
  {
    id: 'post-4',
    user_id: 'user-bboy-cypher',
    external_url: 'https://vimeo.com/76979871',
    normalized_url: 'https://vimeo.com/76979871',
    provider: 'vimeo',
    content_type: 'video',
    description: 'Ronda final del cypher en el callejón de San Telmo. El poder de improvisar cuando el beat cae y no hay jueces de cartón: solo la mirada de la gente del barrio.',
    tags: ['breaking', 'bboy', 'cypher', 'cultura'],
    likes_count: 44,
    comments_count: 6,
    is_hidden: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    author: INITIAL_PROFILES[4],
    metadata: {
      title: 'Raw Cypher Session — Callejón Central 2026',
      author_name: 'Vortex Bboy Crew',
      thumbnail_url: 'https://images.unsplash.com/photo-1545128485-c400e7702796?w=800&h=450&fit=crop',
      embed_url: 'https://player.vimeo.com/video/76979871',
      provider: 'vimeo',
    },
    user_has_liked: false,
    user_has_bookmarked: false,
  },
];

export const INITIAL_EVENTS: HipHopEvent[] = [
  {
    id: 'event-1',
    organizer_id: 'user-bboy-cypher',
    title: 'Cypher Callejero & Batalla 1vs1 Breaking Abierto',
    slug: 'cypher-callejero-batalla-1vs1-breaking-abierto',
    description: 'Encuentro al aire libre en la plaza. Trae tu linóleo, micrófonos abiertos con DJ en vivo tirando breaks clásicos de funk y rap noventero. Sesión de bocetos libre para grafiteros. Entrada 100% gratuita y comunitaria.',
    flyer_url: 'https://images.unsplash.com/photo-1545128485-c400e7702796?w=800&h=1000&fit=crop',
    start_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 4).toISOString(), // in 4 days
    end_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 4 + 1000 * 60 * 60 * 6).toISOString(),
    timezone: 'America/Argentina/Buenos_Aires',
    location: 'Plaza de los Dos Congresos, Buenos Aires',
    is_online: false,
    organizer_name: 'Vortex Bboy Crew & Larvaz Hip-Hop',
    ticket_url: 'https://instagram.com/larvaz_hiphop',
    tags: ['cypher', 'breaking', 'bboy', 'cultura', 'gratis'],
    created_at: '2026-03-10T12:00:00Z',
    organizer: INITIAL_PROFILES[4],
  },
  {
    id: 'event-2',
    organizer_id: 'user-dj-raw',
    title: 'Clínica de Turntablism & Feria de Vinilos Independientes',
    slug: 'clinica-de-turntablism-feria-de-vinilos',
    description: 'Taller práctico sobre técnicas de scratch, sincronización manual, manipulación de fader y conservación de vinilos. Habrá mesas de intercambio de cassettes y vinilos de colección.',
    flyer_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&h=1000&fit=crop',
    start_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 9).toISOString(), // in 9 days
    end_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 9 + 1000 * 60 * 60 * 4).toISOString(),
    timezone: 'America/Bogota',
    location: 'Centro Cultural El Muro, Comuna 13, Medellín',
    is_online: false,
    organizer_name: 'DJ Frecuencia Raw',
    ticket_url: 'https://larvazhiphop.org/eventos',
    tags: ['dj', 'scratch', 'vinilos', 'turntablism', 'taller'],
    created_at: '2026-03-11T16:00:00Z',
    organizer: INITIAL_PROFILES[2],
  },
  {
    id: 'event-3',
    organizer_id: 'user-graffiti-krew',
    title: 'Muro Comunitario — Jam de Pintura y Micrófono Libre',
    slug: 'muro-comunitario-jam-de-pintura-y-microfono-libre',
    description: 'Jornada completa de pintura mural colectiva para recuperar la pared del galpón abandonado. Pásate con tus aerosoles o a compartir rimas en el parlante comunitario.',
    flyer_url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&h=1000&fit=crop',
    start_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 15).toISOString(),
    timezone: 'America/Santiago',
    location: 'Parque Los Reyes, Santiago de Chile',
    is_online: false,
    organizer_name: 'Kronos Muro Libre',
    ticket_url: 'https://larvazhiphop.org/eventos',
    tags: ['graffiti', 'mural', 'hiphop', 'jam'],
    created_at: '2026-03-12T14:00:00Z',
    organizer: INITIAL_PROFILES[1],
  },
];

export const INITIAL_COMMENTS: Comment[] = [
  {
    id: 'comment-1',
    post_id: 'post-1',
    user_id: 'user-mc-asfalto',
    content: 'Ese trazado con la fat cap quedó demoledor hermano. El color verde ácido resalta en la oscuridad. Respeto total.',
    is_hidden: false,
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    author: INITIAL_PROFILES[3],
  },
  {
    id: 'comment-2',
    post_id: 'post-1',
    user_id: 'user-dj-raw',
    content: 'Buenísimo el registro. En el próximo muro me llevo el equipo portátil a tirar beats mientras pintan.',
    is_hidden: false,
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    author: INITIAL_PROFILES[2],
  },
  {
    id: 'comment-3',
    post_id: 'post-2',
    user_id: 'user-mc-asfalto',
    content: 'Ese snare de la SP1200 golpea en el pecho. Me reservo el tercer beat de la cinta para el próximo videoclip.',
    is_hidden: false,
    created_at: new Date(Date.now() - 1000 * 60 * 100).toISOString(),
    author: INITIAL_PROFILES[3],
  },
];

export const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-1',
    user_id: 'user-larvaz-admin',
    actor_id: 'user-graffiti-krew',
    type: 'like',
    post_id: 'post-1',
    read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    actor: INITIAL_PROFILES[1],
  },
  {
    id: 'notif-2',
    user_id: 'user-larvaz-admin',
    actor_id: 'user-mc-asfalto',
    type: 'comment',
    post_id: 'post-1',
    read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    actor: INITIAL_PROFILES[3],
  },
  {
    id: 'notif-3',
    user_id: 'user-larvaz-admin',
    actor_id: 'user-dj-raw',
    type: 'follow',
    read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    actor: INITIAL_PROFILES[2],
  },
];

export const INITIAL_REPORTS: Report[] = [
  {
    id: 'rep-1',
    reporter_id: 'user-dj-raw',
    target_type: 'post',
    target_id: 'post-test-spam',
    reason: 'Spam comercial o intento de venta de criptomonedas no relacionado a la cultura hip-hop.',
    details: 'El usuario intentó promocionar enlaces de referidos de trading en el muro comunitario.',
    status: 'pending',
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    reporter: INITIAL_PROFILES[2],
    target_summary: 'Publicación externa sospechosa reportada',
  },
];

export const INITIAL_COMMUNITY_TRACKS: RadioTrack[] = [
  {
    id: 'track-cintas-asfalto',
    title: 'Raw Tape Session #4 (Vinyl Digging & Boom-Bap)',
    artist: 'DJ Frecuencia Raw',
    url: 'https://soundcloud.com/sample-track/underground-cypher-beat',
    album_art: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&h=450&fit=crop',
    user_id: 'user-dj-raw',
    username: 'dj_frecuencia',
    post_id: 'post-2',
    created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
  },
  {
    id: 'track-resistencia-cemento',
    title: 'Resistencia de Cemento — Single Oficial',
    artist: 'Lírica & Asfalto',
    url: 'https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT',
    album_art: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=450&fit=crop',
    user_id: 'user-mc-asfalto',
    username: 'rimas_del_sur',
    post_id: 'post-3',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
];

export const INITIAL_RADIO_STATIONS: RadioStation[] = [
  {
    id: 'station-comunidad-larvaz',
    name: 'RADIO AUTOMÁTICA COMUNITARIA 99.9 FM',
    dial: '99.9 FM',
    region: 'Comunidad Larvaz (Global)',
    tagline: 'Temas, enlaces y beats subidos en directo por artistas de la comunidad',
    stream_url: 'https://listen.181fm.com/181-beat_128k.mp3',
    genre: 'Subidas por Usuarios / Rap & Trap',
    current_track: {
      title: 'Raw Tape Session #4 (Vinyl Digging & Boom-Bap)',
      artist: 'DJ Frecuencia Raw',
      album_art: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop',
    },
    listeners_count: 640,
    is_live: true,
    tracks: INITIAL_COMMUNITY_TRACKS,
  },
  {
    id: 'station-los-santos',
    name: 'RADIO LOS SANTOS 106.1 FM',
    dial: '106.1 FM',
    region: 'Costa Oeste (GTA Style)',
    tagline: 'Sonido puro West Coast, G-Funk, Trap y leyendas de la Costa Oeste',
    stream_url: 'https://listen.181fm.com/181-beat_128k.mp3',
    genre: 'West Coast / Trap / Hip-Hop Actual',
    current_track: {
      title: 'West Coast & Trap Live 24/7',
      artist: 'The Beat 106.1 FM',
      album_art: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop',
    },
    listeners_count: 512,
    is_live: true,
  },
  {
    id: 'station-boombap-nyc',
    name: 'THE BEAT NYC 94.5 FM',
    dial: '94.5 FM',
    region: 'Nueva York (East Coast)',
    tagline: 'Boom-Bap crudo desde Queensbridge, Bronx y Brooklyn (90s Golden Era)',
    stream_url: 'https://listen.181fm.com/181-oldschool_128k.mp3',
    genre: 'Boom-Bap / 90s Underground Golden Era',
    current_track: {
      title: 'NYC Underground Golden Era Classics',
      artist: 'Boom-Bap 94.5 FM',
      album_art: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop',
    },
    listeners_count: 480,
    is_live: true,
  },
  {
    id: 'station-cono-sur',
    name: 'CONO SUR URBANO 89.9 FM',
    dial: '89.9 FM',
    region: 'Cono Sur (ARG / CHI / URY)',
    tagline: 'Grooves urbanos, hip hop latinoamericano y rimas independientes',
    stream_url: 'https://listen.181fm.com/181-jammin_128k.mp3',
    genre: 'Urban Beats & Rioplatense',
    current_track: {
      title: 'Jammin Frecuencia Cono Sur Live',
      artist: 'Frecuencia 89.9 FM',
      album_art: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop',
    },
    listeners_count: 345,
    is_live: true,
  },
  {
    id: 'station-mexico-azteca',
    name: 'AZTECA CALLEJERO 98.3 FM',
    dial: '98.3 FM',
    region: 'México & Chicano',
    tagline: 'Rimas pesadas, street soul, R&B y cultura urbana de barrio',
    stream_url: 'https://listen.181fm.com/181-rnb_128k.mp3',
    genre: 'Street Soul & Urban R&B',
    current_track: {
      title: 'Street Soul & R&B Callejero',
      artist: 'Azteca Rap Radio',
      album_art: 'https://images.unsplash.com/photo-1526478806334-5fd488fcaabc?w=300&h=300&fit=crop',
    },
    listeners_count: 310,
    is_live: true,
  },
  {
    id: 'station-breaking-bboys',
    name: 'B-BOY & B-GIRL ARENA 101.5 FM',
    dial: '101.5 FM',
    region: 'Mundial B-Boy / Cyphers',
    tagline: 'El sonido del linóleo: breakbeats, funk y 4x4 para cyphers y batallas',
    stream_url: 'https://listen.181fm.com/181-party_128k.mp3',
    genre: 'Breakdance / Funk / Cypher Breaks',
    current_track: {
      title: 'B-Boy Anthems & Block Party Beats',
      artist: 'Breakbeat Science 101.5 FM',
      album_art: 'https://images.unsplash.com/photo-1508700929628-666bc8bd84ea?w=300&h=300&fit=crop',
    },
    listeners_count: 290,
    is_live: true,
  },
  {
    id: 'station-turntablism',
    name: 'TURNTABLISM & BEATS 92.1 FM',
    dial: '92.1 FM',
    region: 'DJs & Vinilo',
    tagline: 'Agujas, vinilo, malabares de beat, lo-fi y sesiones instrumentales',
    stream_url: 'https://listen.181fm.com/181-chilled_128k.mp3',
    genre: 'Lo-Fi Beats / Turntablism / Cypher Lounges',
    current_track: {
      title: 'Lo-Fi Cypher & Scratch Sessions',
      artist: 'Turntable Chill 92.1 FM',
      album_art: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop',
    },
    listeners_count: 220,
    is_live: true,
  },
];

export const INITIAL_CRYPTO_TIPS: CryptoTip[] = [
  {
    id: 'tip-1',
    post_id: 'post-1',
    sender_id: 'user-larvaz-admin',
    sender_username: 'admin_larvaz',
    recipient_id: 'user-graffiti-krew',
    recipient_username: 'kronos_graff',
    amount_usd: 15,
    crypto_amount: 0.075,
    currency: 'SOL',
    tx_hash: '5UxQ7jN...8aZ1Solana',
    message: 'Tremendo mural hermano! Apoyando el arte callejero independiente.',
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 'tip-2',
    post_id: 'post-1',
    sender_id: 'user-dj-raw',
    sender_username: 'dj_frecuencia',
    recipient_id: 'user-graffiti-krew',
    recipient_username: 'kronos_graff',
    amount_usd: 10,
    crypto_amount: 10,
    currency: 'USDT',
    tx_hash: '0x4f88e...991cPolygon',
    message: 'Para los aerosoles de la próxima noche 🔥',
    created_at: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
  },
  {
    id: 'tip-3',
    post_id: 'post-2',
    sender_id: 'user-mc-asfalto',
    sender_username: 'rimas_del_sur',
    recipient_id: 'user-dj-raw',
    recipient_username: 'dj_frecuencia',
    amount_usd: 10,
    crypto_amount: 10,
    currency: 'USDT',
    tx_hash: '0x2b44a...871ePolygon',
    message: 'Ese beat merece un tema completo. Grande Frecuencia!',
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
];

// ==============================================================================
// IN-MEMORY / LOCAL STORAGE STORE IMPLEMENTATION
// ==============================================================================

class LarvazDataStore {
  private profiles: Profile[] = [...INITIAL_PROFILES];
  private posts: Post[] = [...INITIAL_POSTS];
  private comments: Comment[] = [...INITIAL_COMMENTS];
  private events: HipHopEvent[] = [...INITIAL_EVENTS];
  private notifications: Notification[] = [...INITIAL_NOTIFICATIONS];
  private reports: Report[] = [...INITIAL_REPORTS];
  private cryptoTips: CryptoTip[] = [...INITIAL_CRYPTO_TIPS];
  private withdrawals: WithdrawalRequest[] = [];
  private radioStations: RadioStation[] = [...INITIAL_RADIO_STATIONS];
  private communityTracks: RadioTrack[] = [...INITIAL_COMMUNITY_TRACKS];
  private activeStationId: string = 'station-comunidad-larvaz';
  private currentUser: Profile = GUEST_USER; // Default to guest until session is established
  private followingMap: Set<string> = new Set(['user-graffiti-krew', 'user-dj-raw']);
  private bookmarkedPosts: Set<string> = new Set(['post-2']);
  private likedPosts: Set<string> = new Set(['post-2']);

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return;
    try {
      const storedPosts = localStorage.getItem('larvaz_posts');
      if (storedPosts) this.posts = JSON.parse(storedPosts);

      const storedEvents = localStorage.getItem('larvaz_events');
      if (storedEvents) this.events = JSON.parse(storedEvents);

      const storedWithdrawals = localStorage.getItem('larvaz_withdrawals');
      if (storedWithdrawals) this.withdrawals = JSON.parse(storedWithdrawals);

      const storedTracks = localStorage.getItem('larvaz_community_tracks');
      if (storedTracks) {
        this.communityTracks = JSON.parse(storedTracks);
      }
      const commStation = this.radioStations.find(s => s.id === 'station-comunidad-larvaz');
      if (commStation) {
        commStation.tracks = this.communityTracks;
        if (this.communityTracks.length > 0) {
          commStation.current_track = {
            title: this.communityTracks[0].title,
            artist: this.communityTracks[0].artist,
            album_art: this.communityTracks[0].album_art,
          };
        }
      }

      const storedUser = localStorage.getItem('larvaz_session_user');
      if (storedUser) {
        this.currentUser = JSON.parse(storedUser);
      } else {
        this.currentUser = GUEST_USER;
      }

      const storedProfiles = localStorage.getItem('larvaz_profiles');
      if (storedProfiles) this.profiles = JSON.parse(storedProfiles);

      const storedNotifications = localStorage.getItem('larvaz_notifications');
      if (storedNotifications) this.notifications = JSON.parse(storedNotifications);

      const storedFollowing = localStorage.getItem('larvaz_following');
      if (storedFollowing) this.followingMap = new Set(JSON.parse(storedFollowing));

      const storedBookmarks = localStorage.getItem('larvaz_bookmarks');
      if (storedBookmarks) this.bookmarkedPosts = new Set(JSON.parse(storedBookmarks));

      const storedLikes = localStorage.getItem('larvaz_likes');
      if (storedLikes) this.likedPosts = new Set(JSON.parse(storedLikes));
    } catch {
      // fallback to memory
    }
  }

  private saveToStorage() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('larvaz_posts', JSON.stringify(this.posts));
      localStorage.setItem('larvaz_events', JSON.stringify(this.events));
      localStorage.setItem('larvaz_withdrawals', JSON.stringify(this.withdrawals));
      localStorage.setItem('larvaz_community_tracks', JSON.stringify(this.communityTracks));
      if (!this.currentUser.is_guest) {
        localStorage.setItem('larvaz_session_user', JSON.stringify(this.currentUser));
      } else {
        localStorage.removeItem('larvaz_session_user');
      }
      localStorage.setItem('larvaz_profiles', JSON.stringify(this.profiles));
      localStorage.setItem('larvaz_notifications', JSON.stringify(this.notifications));
      localStorage.setItem('larvaz_following', JSON.stringify(Array.from(this.followingMap)));
      localStorage.setItem('larvaz_bookmarks', JSON.stringify(Array.from(this.bookmarkedPosts)));
      localStorage.setItem('larvaz_likes', JSON.stringify(Array.from(this.likedPosts)));
    } catch {
      // ignore
    }
  }

  // --- Auth & User ---
  getCurrentUser(): Profile {
    return this.currentUser;
  }

  setCurrentUser(user: Profile) {
    this.currentUser = user;
    if (typeof window !== 'undefined') {
      if (user.is_guest) {
        localStorage.removeItem('larvaz_session_user');
      } else {
        localStorage.setItem('larvaz_session_user', JSON.stringify(user));
      }
    }
    this.saveToStorage();
  }

  updateProfile(data: Partial<Profile>): Profile {
    this.currentUser = { ...this.currentUser, ...data };
    const index = this.profiles.findIndex((p) => p.id === this.currentUser.id);
    if (index !== -1) {
      this.profiles[index] = this.currentUser;
    } else {
      this.profiles.push(this.currentUser);
    }

    // Trigger state update notification for the user
    this.addNotification({
      userId: this.currentUser.id,
      type: 'mention',
      actor: this.currentUser,
      read: false,
    });

    this.saveToStorage();
    return this.currentUser;
  }

  getProfileByUsername(username: string): Profile | undefined {
    return this.profiles.find((p) => p.username.toLowerCase() === username.toLowerCase());
  }

  getProfileById(id: string): Profile | undefined {
    return this.profiles.find((p) => p.id === id);
  }

  getAllProfiles(): Profile[] {
    return this.profiles;
  }

  // --- Follows ---
  isFollowing(profileId: string): boolean {
    return this.followingMap.has(profileId);
  }

  toggleFollow(profileId: string): boolean {
    if (this.followingMap.has(profileId)) {
      this.followingMap.delete(profileId);
      const target = this.profiles.find((p) => p.id === profileId);
      if (target && target.followers_count) target.followers_count--;
      this.saveToStorage();
      return false;
    } else {
      this.followingMap.add(profileId);
      const target = this.profiles.find((p) => p.id === profileId);
      if (target) target.followers_count = (target.followers_count || 0) + 1;

      // Send follow notification
      this.addNotification({
        userId: profileId,
        type: 'follow',
        actor: this.currentUser,
      });

      this.saveToStorage();
      return true;
    }
  }

  // --- Posts & Feed ---
  getPosts(options?: {
    filter?: FeedFilter;
    tag?: string;
    search?: string;
    authorId?: string;
    bookmarkedOnly?: boolean;
    contentType?: ContentType;
  }): Post[] {
    let result = this.posts.filter((p) => !p.is_hidden);

    if (options?.bookmarkedOnly) {
      result = result.filter((p) => this.bookmarkedPosts.has(p.id));
    }

    if (options?.authorId) {
      result = result.filter((p) => p.user_id === options.authorId);
    }

    if (options?.tag) {
      const tagLower = options.tag.toLowerCase();
      result = result.filter((p) => p.tags.some((t) => t.toLowerCase() === tagLower));
    }

    if (options?.contentType && options.contentType !== ('all' as any)) {
      result = result.filter((p) => p.content_type === options.contentType);
    }

    if (options?.search) {
      const q = options.search.toLowerCase();
      result = result.filter((p) =>
        p.description.toLowerCase().includes(q) ||
        p.author.full_name.toLowerCase().includes(q) ||
        p.author.username.toLowerCase().includes(q) ||
        p.metadata?.title?.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Attach user reaction state
    result = result.map((p) => ({
      ...p,
      user_has_liked: this.likedPosts.has(p.id),
      user_has_bookmarked: this.bookmarkedPosts.has(p.id),
    }));

    // Sorting according to selected filter
    if (options?.filter === 'popular') {
      result.sort((a, b) => (b.likes_count + b.comments_count) - (a.likes_count + a.comments_count));
    } else if (options?.filter === 'para_ti') {
      // Prioritize followed artists & interactive posts
      result.sort((a, b) => {
        const aFollowed = this.followingMap.has(a.user_id) ? 100 : 0;
        const bFollowed = this.followingMap.has(b.user_id) ? 100 : 0;
        return (bFollowed + b.likes_count) - (aFollowed + a.likes_count);
      });
    } else {
      // 'reciente' default: chronologically descending
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return result;
  }

  getPostById(id: string): Post | undefined {
    const post = this.posts.find((p) => p.id === id);
    if (!post) return undefined;
    return {
      ...post,
      user_has_liked: this.likedPosts.has(post.id),
      user_has_bookmarked: this.bookmarkedPosts.has(post.id),
    };
  }

  getCommunityTracks(): RadioTrack[] {
    return this.communityTracks;
  }

  addTrackToCommunityRadio(track: RadioTrack) {
    // Add to beginning of playlist
    this.communityTracks.unshift(track);
    const commStation = this.radioStations.find((s) => s.id === 'station-comunidad-larvaz');
    if (commStation) {
      commStation.tracks = this.communityTracks;
      commStation.current_track = {
        title: track.title,
        artist: track.artist,
        album_art: track.album_art,
      };
    }
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('larvaz_community_tracks', JSON.stringify(this.communityTracks));
      } catch {}
    }
  }

  getReferredUsers(usernameOrId: string): Profile[] {
    const clean = usernameOrId.toLowerCase();
    return this.profiles.filter(
      (p) =>
        p.referred_by?.toLowerCase() === clean ||
        p.referral_code?.toLowerCase() === clean
    );
  }

  registerReferral(referrerUsername: string, newProfile: Profile) {
    const clean = referrerUsername.toLowerCase();
    const referrer = this.profiles.find(
      (p) =>
        p.username.toLowerCase() === clean ||
        p.referral_code?.toLowerCase() === clean
    );
    if (referrer) {
      referrer.referrals_count = (referrer.referrals_count || 0) + 1;
      referrer.referral_props_earned = (referrer.referral_props_earned || 0) + 50;
      newProfile.referred_by = referrer.username;

      this.addNotification({
        userId: referrer.id,
        type: 'mention',
        actor: newProfile,
        read: false,
      });

      this.saveToStorage();
    }
  }

  createPost(data: {
    externalUrl?: string;
    description: string;
    tags?: string[];
    contentType?: ContentType;
    provider?: any;
    metadata?: any;
  }): Post {
    const hasUrl = Boolean(data.externalUrl && data.externalUrl.trim());
    const isMusicTrack =
      data.contentType === 'music' ||
      data.provider === 'soundcloud' ||
      data.provider === 'spotify' ||
      data.provider === 'youtube' ||
      (data.externalUrl && data.externalUrl.match(/\.(mp3|wav|ogg|m4a|aac)($|\?)/i)) ||
      (data.tags &&
        data.tags.some((t) =>
          ['musica', 'rap', 'hiphop', 'trap', 'beat', 'tema', 'track', 'audio', 'boombap', 'freestyle'].includes(
            t.toLowerCase()
          )
        ));

    const newPost: Post = {
      id: 'post-' + Date.now(),
      user_id: this.currentUser.id,
      external_url: hasUrl ? data.externalUrl!.trim() : undefined,
      normalized_url: hasUrl ? data.externalUrl!.trim() : undefined,
      provider: data.provider || (hasUrl ? 'generic' : 'generic'),
      content_type: data.contentType || (hasUrl ? (isMusicTrack ? 'music' : 'link') : 'text'),
      description: data.description,
      tags: data.tags || [],
      likes_count: 0,
      comments_count: 0,
      is_hidden: false,
      created_at: new Date().toISOString(),
      author: this.currentUser,
      metadata: data.metadata,
      user_has_liked: false,
      user_has_bookmarked: false,
    };

    this.posts.unshift(newPost);
    this.currentUser.posts_count = (this.currentUser.posts_count || 0) + 1;

    // Automatically add track to Radio Automática Comunitaria
    if (hasUrl && isMusicTrack) {
      this.addTrackToCommunityRadio({
        id: 'track-' + Date.now(),
        title: data.metadata?.title || (data.description ? data.description.slice(0, 40) : `Pista comunitaria de @${this.currentUser.username}`),
        artist: data.metadata?.author_name || this.currentUser.full_name || `@${this.currentUser.username}`,
        url: data.externalUrl!.trim(),
        album_art: data.metadata?.thumbnail_url || this.currentUser.avatar_url,
        user_id: this.currentUser.id,
        username: this.currentUser.username,
        post_id: newPost.id,
        created_at: newPost.created_at,
      });
    }

    this.saveToStorage();
    return newPost;
  }

  deletePost(postId: string, userId?: string): boolean {
    const index = this.posts.findIndex((p) => p.id === postId);
    if (index === -1) return false;
    const post = this.posts[index];
    if (
      userId &&
      post.user_id !== userId &&
      this.currentUser.role !== 'admin' &&
      this.currentUser.role !== 'super_admin'
    ) {
      return false;
    }

    this.posts.splice(index, 1);
    this.saveToStorage();
    return true;
  }

  // --- Reactions ---
  toggleLike(postId: string): { likesCount: number; userHasLiked: boolean } {
    const post = this.posts.find((p) => p.id === postId);
    if (!post) return { likesCount: 0, userHasLiked: false };

    if (this.likedPosts.has(postId)) {
      this.likedPosts.delete(postId);
      post.likes_count = Math.max(0, post.likes_count - 1);
    } else {
      this.likedPosts.add(postId);
      post.likes_count++;
      if (post.user_id !== this.currentUser.id) {
        this.addNotification({
          userId: post.user_id,
          type: 'like',
          actor: this.currentUser,
          postId: post.id,
        });
      }
    }
    this.saveToStorage();
    return { likesCount: post.likes_count, userHasLiked: this.likedPosts.has(postId) };
  }

  // --- Bookmarks ---
  toggleBookmark(postId: string): boolean {
    if (this.bookmarkedPosts.has(postId)) {
      this.bookmarkedPosts.delete(postId);
      this.saveToStorage();
      return false;
    } else {
      this.bookmarkedPosts.add(postId);
      this.saveToStorage();
      return true;
    }
  }

  // --- Comments ---
  getComments(postId: string): Comment[] {
    return this.comments
      .filter((c) => c.post_id === postId && !c.is_hidden)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  addComment(postId: string, content: string): Comment {
    const newComment: Comment = {
      id: 'comment-' + Date.now(),
      post_id: postId,
      user_id: this.currentUser.id,
      content: content.trim(),
      is_hidden: false,
      created_at: new Date().toISOString(),
      author: this.currentUser,
    };

    this.comments.push(newComment);
    const post = this.posts.find((p) => p.id === postId);
    if (post) post.comments_count++;
    this.saveToStorage();
    return newComment;
  }

  deleteComment(commentId: string, userId: string): boolean {
    const index = this.comments.findIndex((c) => c.id === commentId);
    if (index === -1) return false;
    const comment = this.comments[index];
    if (comment.user_id !== userId && this.currentUser.role !== 'admin') return false;

    const post = this.posts.find((p) => p.id === comment.post_id);
    if (post) post.comments_count = Math.max(0, post.comments_count - 1);
    this.comments.splice(index, 1);
    this.saveToStorage();
    return true;
  }

  // --- Events ---
  getEvents(options?: { upcomingOnly?: boolean; search?: string; tag?: string }): HipHopEvent[] {
    let result = [...this.events];
    const now = new Date().getTime();

    if (options?.upcomingOnly) {
      result = result.filter((e) => new Date(e.start_date).getTime() >= now - 1000 * 60 * 60 * 12);
    }

    if (options?.tag) {
      const tLower = options.tag.toLowerCase();
      result = result.filter((e) => e.tags.some((t) => t.toLowerCase() === tLower));
    }

    if (options?.search) {
      const q = options.search.toLowerCase();
      result = result.filter((e) =>
        e.title.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.location.toLowerCase().includes(q) ||
        e.organizer_name.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
    return result;
  }

  getEventBySlug(slug: string): HipHopEvent | undefined {
    return this.events.find((e) => e.slug === slug);
  }

  createEvent(data: {
    title: string;
    description: string;
    flyerUrl?: string;
    startDate: string;
    endDate?: string;
    timezone?: string;
    location: string;
    organizerName?: string;
    ticketUrl?: string;
    tags?: string[];
  }): HipHopEvent {
    const slug = data.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') + '-' + Date.now().toString().slice(-4);

    const newEvent: HipHopEvent = {
      id: 'event-' + Date.now(),
      organizer_id: this.currentUser.id,
      title: data.title,
      slug,
      description: data.description,
      flyer_url: data.flyerUrl || 'https://images.unsplash.com/photo-1545128485-c400e7702796?w=800&h=1000&fit=crop',
      start_date: data.startDate,
      end_date: data.endDate,
      timezone: data.timezone || 'America/Argentina/Buenos_Aires',
      location: data.location,
      is_online: false,
      organizer_name: data.organizerName || this.currentUser.full_name,
      ticket_url: data.ticketUrl,
      tags: data.tags || ['hiphop', 'cultura'],
      created_at: new Date().toISOString(),
      organizer: this.currentUser,
    };

    this.events.push(newEvent);
    this.saveToStorage();
    return newEvent;
  }

  // --- Notifications ---
  getNotifications(): Notification[] {
    return this.notifications.filter((n) => n.user_id === this.currentUser.id);
  }

  markNotificationsAsRead(): void {
    this.notifications.forEach((n) => {
      if (n.user_id === this.currentUser.id) n.read = true;
    });
  }

  // --- Reports & Moderation ---
  createReport(data: {
    targetType: 'post' | 'comment' | 'user';
    targetId: string;
    reason: string;
    details?: string;
  }): Report {
    const newReport: Report = {
      id: 'report-' + Date.now(),
      reporter_id: this.currentUser.id,
      target_type: data.targetType,
      target_id: data.targetId,
      reason: data.reason,
      details: data.details,
      status: 'pending',
      created_at: new Date().toISOString(),
      reporter: this.currentUser,
      target_summary: `Reporte de ${data.targetType} (${data.targetId})`,
    };

    this.reports.unshift(newReport);
    return newReport;
  }

  getAdminReports(): Report[] {
    return this.reports;
  }

  resolveReport(reportId: string, action: 'hide' | 'dismiss'): boolean {
    const report = this.reports.find((r) => r.id === reportId);
    if (!report) return false;

    report.status = action === 'hide' ? 'resolved' : 'dismissed';
    report.resolved_by = this.currentUser.id;

    if (action === 'hide') {
      if (report.target_type === 'post') {
        const post = this.posts.find((p) => p.id === report.target_id);
        if (post) post.is_hidden = true;
      } else if (report.target_type === 'comment') {
        const comment = this.comments.find((c) => c.id === report.target_id);
        if (comment) comment.is_hidden = true;
      }
      this.saveToStorage();
    }
    return true;
  }

  // --- Super Admin & Content Management ---
  updateUserRole(userId: string, newRole: UserRole): boolean {
    const profile = this.profiles.find((p) => p.id === userId);
    if (!profile) return false;
    profile.role = newRole;
    if (this.currentUser.id === userId) {
      this.currentUser.role = newRole;
    }
    this.saveToStorage();
    return true;
  }

  toggleUserBan(userId: string): boolean {
    const profile = this.profiles.find((p) => p.id === userId);
    if (!profile) return false;
    profile.is_banned = !profile.is_banned;
    if (this.currentUser.id === userId) {
      this.currentUser.is_banned = profile.is_banned;
    }
    this.saveToStorage();
    return true;
  }

  // --- Crypto Monetization & Tipping ---
  sendCryptoTip(data: {
    postId: string;
    recipientId: string;
    amountUsd: number;
    cryptoAmount: number;
    currency: 'USDT' | 'SOL' | 'ETH' | 'BTC';
    message?: string;
  }): CryptoTip {
    const recipient = this.getProfileById(data.recipientId) || this.currentUser;
    const post = this.getPostById(data.postId);

    const randomHash =
      data.currency === 'SOL'
        ? `${Math.random().toString(36).substring(2, 10)}...${Math.random().toString(36).substring(2, 6)}Solana`
        : `0x${Math.random().toString(16).substring(2, 10)}...${Math.random().toString(16).substring(2, 6)}`;

    const newTip: CryptoTip = {
      id: 'tip-' + Date.now(),
      post_id: data.postId,
      sender_id: this.currentUser.id,
      sender_username: this.currentUser.username,
      recipient_id: data.recipientId,
      recipient_username: recipient.username,
      amount_usd: data.amountUsd,
      crypto_amount: data.cryptoAmount,
      currency: data.currency,
      tx_hash: randomHash,
      message: data.message,
      created_at: new Date().toISOString(),
    };

    this.cryptoTips.unshift(newTip);

    // Update post totals
    if (post) {
      post.crypto_tips_count = (post.crypto_tips_count || 0) + 1;
      post.crypto_tips_total = (post.crypto_tips_total || 0) + data.amountUsd;
    }

    // Create notification for recipient if not self
    if (recipient.id !== this.currentUser.id) {
      this.notifications.unshift({
        id: 'notif-tip-' + Date.now(),
        user_id: recipient.id,
        actor_id: this.currentUser.id,
        type: 'like', // notification
        post_id: data.postId,
        read: false,
        created_at: new Date().toISOString(),
        actor: this.currentUser,
        post,
      });
    }

    this.saveToStorage();
    return newTip;
  }

  getCryptoTips(postId?: string): CryptoTip[] {
    if (postId) {
      return this.cryptoTips.filter((t) => t.post_id === postId);
    }
    return this.cryptoTips;
  }

  getUserTips(userId: string): { received: CryptoTip[]; sent: CryptoTip[] } {
    return {
      received: this.cryptoTips.filter((t) => t.recipient_id === userId),
      sent: this.cryptoTips.filter((t) => t.sender_id === userId),
    };
  }

  // --- Retiros de Criptomonedas & Balance ---
  getUserBalance(userId: string): number {
    const receivedUsd = this.cryptoTips
      .filter((t) => t.recipient_id === userId)
      .reduce((sum, t) => sum + t.amount_usd, 0);
    const withdrawnUsd = this.withdrawals
      .filter((w) => w.user_id === userId && (w.status === 'completed' || w.status === 'pending'))
      .reduce((sum, w) => sum + w.amount_usdc, 0);
    return Math.max(0, receivedUsd - withdrawnUsd);
  }

  getUserWithdrawals(userId: string): WithdrawalRequest[] {
    return this.withdrawals.filter((w) => w.user_id === userId);
  }

  requestWithdrawal(data: {
    userId: string;
    amountUsdc: number;
    walletAddress: string;
    network: 'Solana' | 'Polygon' | 'Ethereum';
  }): { success: boolean; error?: string; withdrawal?: WithdrawalRequest } {
    // Recordatorio y validación: el retiro se habilita a partir de 10 USDC
    if (data.amountUsdc < 10) {
      return { success: false, error: 'El monto mínimo para solicitar retiro es de 10 USDC.' };
    }
    const currentBalance = this.getUserBalance(data.userId);
    if (currentBalance < data.amountUsdc) {
      return {
        success: false,
        error: `Saldo insuficiente. Tu saldo disponible actual es de ${currentBalance.toFixed(2)} USDC.`,
      };
    }
    if (!data.walletAddress || data.walletAddress.trim().length < 8) {
      return { success: false, error: 'Ingresa una dirección de billetera válida.' };
    }

    const randomHash =
      data.network === 'Solana'
        ? `${Math.random().toString(36).substring(2, 8)}...${Math.random().toString(36).substring(2, 6)}SolRetiro`
        : `0x${Math.random().toString(16).substring(2, 8)}...${Math.random().toString(16).substring(2, 6)}`;

    const newWithdrawal: WithdrawalRequest = {
      id: 'ret-' + Date.now(),
      user_id: data.userId,
      amount_usdc: data.amountUsdc,
      wallet_address: data.walletAddress.trim(),
      network: data.network,
      status: 'completed',
      tx_hash: randomHash,
      created_at: new Date().toISOString(),
    };

    this.withdrawals.unshift(newWithdrawal);
    this.saveToStorage();
    return { success: true, withdrawal: newWithdrawal };
  }

  // --- Radio Underground Streaming ---
  getRadioStations(): RadioStation[] {
    return this.radioStations;
  }

  getActiveRadioStation(): RadioStation {
    const station = this.radioStations.find((s) => s.id === this.activeStationId);
    return station || this.radioStations[0];
  }

  setActiveRadioStation(stationId: string): RadioStation {
    this.activeStationId = stationId;
    return this.getActiveRadioStation();
  }

  // --- Global Stats for Super Admin ---
  getGlobalStats() {
    const totalTipsUsd = this.cryptoTips.reduce((acc, t) => acc + t.amount_usd, 0);
    const totalRadioListeners = this.radioStations.reduce((acc, s) => acc + s.listeners_count, 0);

    return {
      totalUsers: this.profiles.length,
      totalPosts: this.posts.filter((p) => !p.is_hidden).length,
      totalEvents: this.events.length,
      totalTipsUsd,
      totalTipsCount: this.cryptoTips.length,
      totalRadioListeners,
      pendingReports: this.reports.filter((r) => r.status === 'pending').length,
    };
  }
}

// Singleton export
export const dataStore = new LarvazDataStore();

