import type {
  SponsorBrand,
  SponsorCampaign,
  SponsorChallenge,
  SponsorPost,
  SponsorPrize,
  SponsorsState,
  SponsorSweepstake,
  SponsorshipAgreement,
  SponsorshipOpportunity,
  SponsorApplication,
  SweepstakeParticipation,
  CampaignContribution,
  PointsEntry,
  SponsorReview,
} from '@/types/sponsors';

const now = () => new Date();
const days = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString();
const hoursAgo = (n: number) => new Date(Date.now() - n * 3_600_000).toISOString();

const brands: SponsorBrand[] = [
  {
    id: 'brand-muro-libre',
    owner_id: 'user-graffiti-krew',
    slug: 'muro-libre-supply',
    name: 'Muro Libre Supply',
    logo_url:
      'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=200&h=200&fit=crop',
    cover_url:
      'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1200&h=400&fit=crop',
    description:
      'Indumentaria urbana impresa a mano en Buenos Aires. Hoodies oversize, remeras con tipografía salvaje y drops limitados junto a artistas del barrio.',
    category: 'indumentaria',
    country: 'Argentina',
    province: 'Buenos Aires',
    city: 'Buenos Aires',
    website: 'https://murolibre.example',
    instagram: '@murolibre.supply',
    tiktok: '@murolibre',
    contact_name: 'Sofía Herrera',
    contact_email: 'hola@murolibre.example',
    seeking_categories: ['graffiti', 'mc', 'fotografo'],
    interest_locations: ['Argentina', 'Uruguay', 'Chile'],
    verification: 'verificada',
    verified_at: days(-120),
    verified_by: 'user-larvaz-admin',
    followers: ['user-graffiti-krew', 'user-dj-raw', 'user-mc-asfalto'],
    reputation: { score: 4.8, reviews: 6 },
    created_at: days(-190),
  },
  {
    id: 'brand-boom-bap',
    owner_id: 'user-dj-raw',
    slug: 'boom-bap-records',
    name: 'Boom Bap Records',
    logo_url:
      'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=200&h=200&fit=crop',
    cover_url:
      'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=1200&h=400&fit=crop',
    description:
      'Sello independiente de boom-bap y soul samples. Grabamos, mezclamos y masterizamos discos de artistas emergentes de Latinoamérica.',
    category: 'musica',
    country: 'Colombia',
    province: 'Antioquia',
    city: 'Medellín',
    website: 'https://boombaprecords.example',
    instagram: '@boombap.records',
    tiktok: '@boombaprecords',
    contact_name: 'Camilo Ríos',
    contact_email: 'equipo@boombaprecords.example',
    seeking_categories: ['dj', 'productor', 'mc'],
    interest_locations: ['Colombia', 'Chile', 'Argentina'],
    verification: 'verificada',
    verified_at: days(-95),
    verified_by: 'user-larvaz-admin',
    followers: ['user-dj-raw', 'user-mc-asfalto', 'user-bboy-cypher'],
    reputation: { score: 4.9, reviews: 4 },
    created_at: days(-160),
  },
  {
    id: 'brand-aerosol-king',
    owner_id: 'demo-aerosol',
    slug: 'aerosol-king',
    name: 'Aerosol King',
    logo_url:
      'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=200&h=200&fit=crop',
    cover_url:
      'https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8?w=1200&h=400&fit=crop',
    description:
      'Materiales para graffiti, boquillas, pintura de alta cobertura y workshops de lettering. Apoyamos murales comunitarios en todo Chile.',
    category: 'arte',
    country: 'Chile',
    province: 'Región Metropolitana',
    city: 'Santiago',
    website: 'https://aerosolking.example',
    instagram: '@aerosolking.cl',
    contact_name: 'Vale Soto',
    contact_email: 'contacto@aerosolking.example',
    seeking_categories: ['graffiti', 'crew', 'fotografo'],
    interest_locations: ['Chile', 'Perú', 'Argentina'],
    verification: 'verificada',
    verified_at: days(-70),
    verified_by: 'user-larvaz-admin',
    followers: ['user-graffiti-krew'],
    reputation: { score: 4.7, reviews: 5 },
    created_at: days(-140),
  },
  {
    id: 'brand-skate-calle',
    owner_id: 'demo-skate',
    slug: 'skate-calle',
    name: 'Skate Calle',
    logo_url:
      'https://images.unsplash.com/photo-1520045892732-304bc3ac5d8e?w=200&h=200&fit=crop',
    cover_url:
      'https://images.unsplash.com/photo-1520045892732-304bc3ac5d8e?w=1200&h=400&fit=crop',
    description:
      'Tienda de skate y streetwear en CDMX. Organizamos jam sessions, battles y competencias con premios reales para la escena.',
    category: 'deportes',
    country: 'México',
    province: 'CDMX',
    city: 'Ciudad de México',
    website: 'https://skatecalle.example',
    instagram: '@skatecalle.mx',
    tiktok: '@skatecalle',
    contact_name: 'Diego Nava',
    contact_email: 'crew@skatecalle.example',
    seeking_categories: ['skate', 'bboy', 'mc', 'fotografo'],
    interest_locations: ['México', 'Colombia'],
    verification: 'verificada',
    verified_at: days(-40),
    verified_by: 'user-larvaz-admin',
    followers: ['user-bboy-cypher'],
    reputation: { score: 4.6, reviews: 3 },
    created_at: days(-90),
  },
  {
    id: 'brand-tinta-calle',
    owner_id: 'demo-tinta',
    slug: 'tinta-y-calle',
    name: 'Tinta & Calle',
    logo_url:
      'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=200&h=200&fit=crop',
    cover_url:
      'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1200&h=400&fit=crop',
    description:
      'Estudio de serigrafía y diseño para crews y sellos independientes. Nueva en Larvaz: buscamos artistas para una colección cápsula.',
    category: 'servicios',
    country: 'Argentina',
    province: 'Mendoza',
    city: 'Mendoza',
    instagram: '@tintaycalle',
    contact_name: 'Ramiro Paz',
    contact_email: 'hola@tintaycalle.example',
    seeking_categories: ['graffiti', 'crew'],
    interest_locations: ['Argentina'],
    verification: 'pendiente',
    followers: [],
    reputation: { score: 0, reviews: 0 },
    created_at: days(-6),
  },
];

const counterpart = (
  id: string,
  kind: SponsorshipOpportunity['counterparts'][number]['kind'],
  description: string,
  quantity: number,
  extra: Partial<SponsorshipOpportunity['counterparts'][number]> = {}
) => ({
  id,
  kind,
  description,
  quantity,
  status: 'pendiente' as const,
  ...extra,
});

const opportunities: SponsorshipOpportunity[] = [
  {
    id: 'opp-sneakers-mc',
    brand_id: 'brand-skate-calle',
    title: '3 MCs para campaña de zapatillas edición cypher',
    description:
      'Buscamos tres MCs de México y Colombia para protagonizar la campaña de nuestra zapatilla edición cypher. Queremos barras reales, no actores: la campaña se graba en una plaza y en un estudio chico.',
    image_url:
      'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=1200&h=700&fit=crop',
    offer: {
      type: 'mixto',
      payment_modality: 'campana',
      amount: 450,
      currency: 'USD',
      products: ['2 pares de zapatillas', 'Hoodie Skate Calle', 'Gorra edición cypher'],
      logistics: ['Traslado dentro de CDMX', 'Almuerzo en rodaje'],
      summary: 'USD 450 + 2 pares de zapatillas + indumentaria + traslados en CDMX.',
    },
    artist_categories: ['mc'],
    counterparts: [
      counterpart('cp-1', 'videos', 'Reel de 45 segundos para el lanzamiento', 1, {
        platform: 'Instagram / TikTok',
        due_date: days(30),
        evidence_required: 'Link público del reel',
      }),
      counterpart('cp-2', 'fotos', 'Sesión de fotos con el producto', 1, {
        due_date: days(20),
        evidence_required: 'Galería de 10 fotos',
      }),
      counterpart('cp-3', 'posts_larvaz', 'Publicación en LARVAZ etiquetando a la marca', 2, {
        platform: 'LARVAZ',
        due_date: days(25),
      }),
      counterpart('cp-4', 'menciones', 'Mención de la marca en el copy', 3, {
        platform: 'Instagram',
        due_date: days(30),
      }),
    ],
    country: 'México',
    province: 'CDMX',
    city: 'Ciudad de México',
    is_remote: false,
    duration_days: 45,
    deadline: days(11),
    slots: 3,
    status: 'abierta',
    applications_count: 2,
    created_at: days(-5),
  },
  {
    id: 'opp-mural-capsula',
    brand_id: 'brand-aerosol-king',
    title: 'Colección cápsula con grafiteros: 2 murales + diseño',
    description:
      'Queremos dos artistas del aerosol para pintar un mural de 12 metros en Santiago y co-diseñar una línea de latas edición limitada. Materiales incluidos y pago por proyecto.',
    image_url:
      'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=1200&h=700&fit=crop',
    offer: {
      type: 'mixto',
      payment_modality: 'proyecto',
      amount: 700,
      currency: 'USD',
      products: ['Kit completo de aerosoles', 'Boquillas profesionales', 'Máscaras y guantes'],
      summary: 'USD 700 por proyecto + todos los materiales + difusión en el catálogo.',
    },
    artist_categories: ['graffiti', 'crew'],
    counterparts: [
      counterpart('cp-5', 'murales', 'Mural de 12 metros en espacio comunitario', 1, {
        due_date: days(40),
        evidence_required: 'Fotos del mural terminado',
      }),
      counterpart('cp-6', 'disenos', 'Diseño de etiqueta para la edición limitada', 1, {
        due_date: days(35),
        evidence_required: 'Archivo vectorial',
      }),
      counterpart('cp-7', 'historias', 'Historias del proceso de pintada', 4, {
        platform: 'Instagram',
        due_date: days(40),
      }),
    ],
    country: 'Chile',
    province: 'Región Metropolitana',
    city: 'Santiago',
    is_remote: false,
    duration_days: 60,
    deadline: days(18),
    slots: 2,
    status: 'abierta',
    applications_count: 1,
    created_at: days(-3),
  },
  {
    id: 'opp-dj-residente',
    brand_id: 'brand-boom-bap',
    title: 'DJ residente para el sello: sesión mensual + master',
    description:
      'Buscamos un DJ de boom-bap para una residencia mensual en nuestro estudio. Pagamos por sesión, masterizamos tu mix y te damos difusión en el sello.',
    image_url:
      'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=1200&h=700&fit=crop',
    offer: {
      type: 'economico',
      payment_modality: 'mensual',
      amount: 300,
      currency: 'USD',
      summary: 'USD 300 mensuales por 6 meses + masterización + difusión del sello.',
    },
    artist_categories: ['dj', 'productor'],
    counterparts: [
      counterpart('cp-8', 'produccion_musical', 'Mix mensual de 45 minutos para el sello', 6, {
        due_date: days(180),
        evidence_required: 'Archivo final en WAV',
      }),
      counterpart('cp-9', 'posts_larvaz', 'Publicación mensual presentando el mix', 6, {
        platform: 'LARVAZ',
        due_date: days(180),
      }),
    ],
    country: 'Colombia',
    province: 'Antioquia',
    city: 'Medellín',
    is_remote: true,
    duration_days: 180,
    deadline: days(26),
    slots: 1,
    status: 'abierta',
    applications_count: 0,
    created_at: days(-2),
  },
  {
    id: 'opp-crew-batalla',
    brand_id: 'brand-skate-calle',
    title: 'Crew de breaking para batalla internacional en CDMX',
    description:
      'Invitamos a un crew de 4 a 6 personas a la batalla Skate Calle CDMX. Cubrimos transporte, hospedaje y alimentación. Queremos presencia de marca en la competencia.',
    image_url:
      'https://images.unsplash.com/photo-1535525153412-5a42439a210d?w=1200&h=700&fit=crop',
    offer: {
      type: 'logistico',
      payment_modality: 'unico',
      logistics: ['Hospedaje 3 noches', 'Transporte ida y vuelta', 'Alimentación', 'Entradas al evento'],
      summary: 'Hospedaje + transporte + comidas + entradas para todo el crew.',
    },
    artist_categories: ['bboy', 'crew'],
    counterparts: [
      counterpart('cp-10', 'presencia_marca', 'Banner y remeras del crew con la marca', 1, {
        due_date: days(50),
        evidence_required: 'Fotos del crew en la batalla',
      }),
      counterpart('cp-11', 'videos', 'Registro audiovisual de la batalla', 1, {
        due_date: days(55),
      }),
    ],
    country: 'México',
    province: 'CDMX',
    city: 'Ciudad de México',
    is_remote: false,
    duration_days: 30,
    deadline: days(9),
    slots: 1,
    status: 'abierta',
    applications_count: 1,
    created_at: days(-1),
  },
];

const applications: SponsorApplication[] = [
  {
    id: 'app-kronos-mural',
    opportunity_id: 'opp-mural-capsula',
    brand_id: 'brand-aerosol-king',
    artist_id: 'user-graffiti-krew',
    artist_username: 'kronos_graff',
    artist_name: 'Kronos Muro Libre',
    artist_avatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
    message:
      'Llevo 12 años pintando persianas y vagones. Tengo propuesta de boceto para el mural de 12 metros y equipo para ejecutarlo en 4 jornadas.',
    portfolio_url: 'https://instagram.com/kronos_muro',
    social_links: [
      { label: 'Instagram', url: 'https://instagram.com/kronos_muro' },
      { label: 'Behance', url: 'https://behance.net/kronos_muro' },
    ],
    experience: 'Más de 40 murales comunitarios en Chile y Argentina. Dos festivales de graffiti.',
    proposal:
      'Propongo un mural de tipografía wildstyle con paisaje urbano de Santiago, paleta dorada y violeta. Entrego boceto digital y fotos del proceso.',
    status: 'preseleccionada',
    brand_note: 'Buen portfolio y propuesta alineada. Coordinar llamada.',
    created_at: days(-2),
  },
  {
    id: 'app-vortex-batalla',
    opportunity_id: 'opp-crew-batalla',
    brand_id: 'brand-skate-calle',
    artist_id: 'user-bboy-cypher',
    artist_username: 'bboy_vortex',
    artist_name: 'Vortex Bboy Crew',
    artist_avatar:
      'https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?w=200&h=200&fit=crop',
    message:
      'Somos un crew de 5 b-boys de Medellín con experiencia en batallas internacionales. Podemos viajar en las fechas indicadas.',
    portfolio_url: 'https://instagram.com/bboy_vortex',
    social_links: [{ label: 'Instagram', url: 'https://instagram.com/bboy_vortex' }],
    experience: 'Campeones nacionales 2025, semifinales en batalla de Bogotá.',
    proposal: 'Llevamos remeras de la marca en todas las rondas y grabamos un aftermovie de la batalla.',
    status: 'oferta',
    offer: { note: 'Cubrimos hospedaje para 5 personas y transporte. Confirmar lista de crew.', sent_at: days(-1) },
    created_at: days(-3),
  },
  {
    id: 'app-rimas-sneakers',
    opportunity_id: 'opp-sneakers-mc',
    brand_id: 'brand-skate-calle',
    artist_id: 'user-mc-asfalto',
    artist_username: 'rimas_del_sur',
    artist_name: 'Lírica & Asfalto',
    artist_avatar:
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop',
    message:
      'Tengo un tema inédito que habla de caminar la ciudad. Creo que encaja perfecto con la zapatilla edición cypher.',
    social_links: [{ label: 'Instagram', url: 'https://instagram.com/rimas_del_sur' }],
    experience: '3 mixtapes, 20 shows en vivo, dos videoclips propios.',
    proposal: 'Propongo grabar el reel en la plaza principal y usar el tema inédito como banda sonora.',
    status: 'pendiente',
    created_at: days(-1),
  },
];

const agreements: SponsorshipAgreement[] = [
  {
    id: 'agr-kronos-mural',
    opportunity_id: 'opp-mural-capsula',
    application_id: 'app-kronos-mural',
    brand_id: 'brand-aerosol-king',
    artist_id: 'user-graffiti-krew',
    artist_username: 'kronos_graff',
    artist_name: 'Kronos Muro Libre',
    title: 'Mural comunitario + cápsula Aerosol King',
    benefits: 'USD 700 + kit completo de aerosoles y boquillas + difusión en catálogo.',
    offer: {
      type: 'mixto',
      payment_modality: 'proyecto',
      amount: 700,
      currency: 'USD',
      products: ['Kit completo de aerosoles', 'Boquillas profesionales'],
      summary: 'USD 700 por proyecto + materiales + difusión.',
    },
    counterparts: [
      {
        ...counterpart('agr-cp-1', 'murales', 'Mural de 12 metros terminado', 1, {
          due_date: days(20),
          evidence_required: 'Fotos del mural',
        }),
        status: 'en_proceso',
      },
      {
        ...counterpart('agr-cp-2', 'disenos', 'Etiqueta de la edición limitada', 1, {
          due_date: days(15),
          evidence_required: 'Archivo vectorial',
        }),
        status: 'pendiente',
      },
      {
        ...counterpart('agr-cp-3', 'historias', 'Historias del proceso', 4, {
          platform: 'Instagram',
          due_date: days(25),
        }),
        status: 'aprobado',
      },
    ],
    start_date: days(-7),
    end_date: days(53),
    terms:
      'El artista conserva los derechos del boceto. La marca puede usar fotos del mural en su catálogo citando al artista.',
    status: 'en_curso',
    accepted_by_brand: true,
    accepted_by_artist: true,
    history: [
      { at: days(-8), by_id: 'demo-aerosol', by_name: 'Aerosol King', action: 'Acuerdo creado', note: 'Propuesta enviada' },
      { at: days(-7), by_id: 'user-graffiti-krew', by_name: 'Kronos Muro Libre', action: 'Acuerdo aceptado' },
    ],
    created_at: days(-8),
  },
  {
    id: 'agr-boom-bap-old',
    opportunity_id: undefined,
    brand_id: 'brand-boom-bap',
    artist_id: 'user-dj-raw',
    artist_username: 'dj_frecuencia',
    artist_name: 'DJ Frecuencia Raw',
    title: 'Sesión de vinilos para el sello',
    benefits: 'USD 250 + masterización del set + difusión.',
    counterparts: [
      {
        ...counterpart('agr-cp-4', 'produccion_musical', 'Set grabado de 30 minutos', 1),
        status: 'aprobado',
      },
      { ...counterpart('agr-cp-5', 'posts_larvaz', 'Publicación del set', 1), status: 'aprobado' },
    ],
    start_date: days(-70),
    end_date: days(-20),
    terms: 'Uso del set por 12 meses en el catálogo del sello.',
    status: 'completado',
    accepted_by_brand: true,
    accepted_by_artist: true,
    history: [
      { at: days(-71), by_id: 'user-dj-raw', by_name: 'Boom Bap Records', action: 'Acuerdo creado' },
      { at: days(-70), by_id: 'user-dj-raw', by_name: 'DJ Frecuencia Raw', action: 'Acuerdo aceptado' },
      { at: days(-21), by_id: 'user-dj-raw', by_name: 'Boom Bap Records', action: 'Acuerdo completado' },
    ],
    created_at: days(-71),
  },
];

const posts: SponsorPost[] = [
  {
    id: 'spost-sneakers',
    brand_id: 'brand-skate-calle',
    author_id: 'demo-skate',
    kind: 'sorteo',
    title: 'Sorteo: zapatilla edición cypher + kit de la marca',
    body:
      'Soltamos un par de nuestra zapatilla edición cypher y un kit completo de Skate Calle. Para participar: dale like a esta publicación y tocá PARTICIPAR AHORA. Un registro por persona. Ganador anunciado al cierre.',
    image_url:
      'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=1200&h=800&fit=crop',
    gallery: [],
    tags: ['sorteo', 'zapatillas', 'skate', 'cdmx'],
    likes: ['user-mc-asfalto', 'user-graffiti-krew', 'user-bboy-cypher'],
    shares: 7,
    comments: [],
    created_at: days(-4),
    sweepstake_id: 'sw-sneakers',
  },
  {
    id: 'spost-muro',
    brand_id: 'brand-muro-libre',
    author_id: 'user-graffiti-krew',
    kind: 'sorteo',
    title: 'Regalamos un hoodie bordado: comentá LARVAZ y participá',
    body:
      'Drop de invierno: hoodie oversize bordado a mano. Para participar dejá un comentario que incluya la palabra LARVAZ y contanos qué barrio te representa. Un comentario por persona.',
    image_url:
      'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=1200&h=800&fit=crop',
    gallery: [],
    tags: ['sorteo', 'indumentaria', 'hoodie', 'buenosaires'],
    likes: ['user-graffiti-krew', 'user-dj-raw'],
    shares: 3,
    comments: [
      {
        id: 'spc-1',
        post_id: 'spost-muro',
        user_id: 'user-mc-asfalto',
        username: 'rimas_del_sur',
        full_name: 'Lírica & Asfalto',
        avatar_url:
          'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop',
        content: 'LARVAZ desde el sur, el barrio que me enseñó a escribir. 🔥',
        created_at: hoursAgo(30),
      },
    ],
    created_at: days(-3),
    sweepstake_id: 'sw-hoodie',
  },
  {
    id: 'spost-desafio',
    brand_id: 'brand-boom-bap',
    author_id: 'user-dj-raw',
    kind: 'desafio',
    title: 'LARVAZ CHALLENGE: 16 barras sobre un sample de soul',
    body:
      'Subí un video de 60 segundos con 16 barras sobre el sample oficial. El jurado del sello elige la mejor interpretación. Premio: sesión de grabación + master.',
    image_url:
      'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1200&h=800&fit=crop',
    gallery: [],
    tags: ['desafio', 'freestyle', 'boombap', 'barras'],
    likes: ['user-mc-asfalto', 'user-bboy-cypher'],
    shares: 5,
    comments: [],
    created_at: days(-2),
    challenge_id: 'ch-freestyle',
  },
  {
    id: 'spost-campana',
    brand_id: 'brand-aerosol-king',
    author_id: 'demo-aerosol',
    kind: 'donacion',
    title: 'Apoyá el mural comunitario de la plaza',
    body:
      'Estamos pintando un mural de 40 metros con pibes del barrio. Necesitamos aerosoles, andamios y comida para las jornadas. Cada aporte suma y se rinde públicamente.',
    image_url:
      'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=1200&h=800&fit=crop',
    gallery: [],
    tags: ['donacion', 'mural', 'comunidad', 'santiago'],
    likes: ['user-graffiti-krew'],
    shares: 2,
    comments: [],
    created_at: days(-6),
    campaign_id: 'camp-mural',
  },
  {
    id: 'spost-lanzamiento',
    brand_id: 'brand-muro-libre',
    author_id: 'user-graffiti-krew',
    kind: 'lanzamiento',
    title: 'Nuevo drop: serie "Persiana" impresa a mano',
    body:
      'Cinco remeras, cinco persianas de Buenos Aires. Serigrafía artesanal y tirada limitada de 30 unidades. Hechas con Kronos y el taller del barrio.',
    image_url:
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1200&h=800&fit=crop',
    gallery: [],
    tags: ['drop', 'indumentaria', 'serigrafia', 'larvaz'],
    likes: ['user-dj-raw', 'user-mc-asfalto', 'user-bboy-cypher', 'user-graffiti-krew'],
    shares: 9,
    comments: [],
    created_at: days(-1),
  },
];

const sweepstakes: SponsorSweepstake[] = [
  {
    id: 'sw-sneakers',
    brand_id: 'brand-skate-calle',
    post_id: 'spost-sneakers',
    title: 'Zapatilla edición cypher + kit Skate Calle',
    description:
      'Un par de zapatillas edición cypher, hoodie y gorra de la marca. Sorteo entre quienes participen con el botón y hayan dado like.',
    prize_image_url:
      'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=800&h=600&fit=crop',
    category: 'mc',
    prize_value: 320,
    currency: 'USD',
    winners_count: 1,
    starts_at: days(-4),
    ends_at: days(9),
    draw_at: days(9.2),
    countries: ['México', 'Colombia', 'Argentina'],
    requirements: ['Ser mayor de 18 años', 'Tener perfil en LARVAZ', 'Dar like a la publicación'],
    rules:
      'Un registro por persona. El sorteo se realiza automáticamente al cierre con selección criptográficamente aleatoria. El ganador se publica en esta misma publicación y se contacta por mensajes de LARVAZ. Premio sujeto a disponibilidad de talle.',
    method: 'boton',
    delivery_method: 'Envío nacional dentro de México o entrega en tienda CDMX.',
    status: 'activo',
    likes_required: true,
    winners: [],
    audit: [
      {
        id: 'swa-1',
        at: days(-4),
        actor_id: 'demo-skate',
        action: 'Sorteo publicado',
        hash: '',
        detail: 'Reglas bloqueadas al iniciar',
      },
    ],
    created_at: days(-4),
  },
  {
    id: 'sw-hoodie',
    brand_id: 'brand-muro-libre',
    post_id: 'spost-muro',
    title: 'Hoodie bordado Muro Libre',
    description:
      'Hoodie oversize bordado a mano. Participá comentando con la palabra LARVAZ y contando qué barrio te representa.',
    prize_image_url:
      'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&h=600&fit=crop',
    category: 'graffiti',
    prize_value: 140,
    currency: 'USD',
    winners_count: 2,
    starts_at: days(-3),
    ends_at: days(4),
    draw_at: days(4.2),
    countries: [],
    requirements: ['Comentar una sola vez', 'Incluir la palabra LARVAZ'],
    rules:
      'Un comentario válido por usuario. Se eliminan comentarios duplicados o sin la palabra obligatoria. Dos ganadores seleccionados al azar entre comentarios válidos.',
    method: 'comentarios',
    delivery_method: 'Envío a todo el país por correo.',
    status: 'activo',
    likes_required: false,
    comment_rule: {
      mode: 'palabra',
      required_word: 'LARVAZ',
    },
    winners: [],
    audit: [
      {
        id: 'swa-2',
        at: days(-3),
        actor_id: 'user-graffiti-krew',
        action: 'Sorteo publicado',
        hash: '',
      },
    ],
    created_at: days(-3),
  },
  {
    id: 'sw-vinilo-cerrado',
    brand_id: 'brand-boom-bap',
    post_id: 'spost-lanzamiento',
    title: 'Vinilo firmado del sello',
    description:
      'Sorteo ya finalizado de un vinilo firmado por los artistas del sello.',
    category: 'dj',
    prize_value: 90,
    currency: 'USD',
    winners_count: 1,
    starts_at: days(-40),
    ends_at: days(-12),
    draw_at: days(-12),
    countries: [],
    requirements: ['Participar con el botón'],
    rules: 'Sorteo aleatorio entre participaciones válidas.',
    method: 'aleatorio',
    delivery_method: 'Envío internacional.',
    status: 'sorteado',
    likes_required: false,
    seed: '8f3a1c9d4b7e2f60',
    drawn_at: days(-12),
    winners: [
      {
        participation_id: 'sp-old-1',
        user_id: 'user-mc-asfalto',
        username: 'rimas_del_sur',
        position: 1,
        prize_id: 'prize-vinilo',
      },
    ],
    audit: [
      {
        id: 'swa-3',
        at: days(-12),
        actor_id: 'user-dj-raw',
        action: 'Sorteo realizado',
        hash: '9b7e1f4a2c8d6035f1e9a7b4c2d8e6f0a3b5c7d9e1f2a4b6c8d0e2f4a6b8c0d2',
        detail: '1 ganador entre 1 participación válida',
      },
    ],
    created_at: days(-40),
  },
];

const participations: SweepstakeParticipation[] = [
  {
    id: 'sp-old-1',
    sweepstake_id: 'sw-vinilo-cerrado',
    user_id: 'user-mc-asfalto',
    username: 'rimas_del_sur',
    full_name: 'Lírica & Asfalto',
    created_at: days(-30),
    method: 'aleatorio',
    valid: true,
  },
  {
    id: 'sp-hoodie-1',
    sweepstake_id: 'sw-hoodie',
    user_id: 'user-mc-asfalto',
    username: 'rimas_del_sur',
    full_name: 'Lírica & Asfalto',
    created_at: hoursAgo(30),
    method: 'comentarios',
    comment_text: 'LARVAZ desde el sur, el barrio que me enseñó a escribir. 🔥',
    valid: true,
  },
];

const prizes: SponsorPrize[] = [
  {
    id: 'prize-vinilo',
    brand_id: 'brand-boom-bap',
    sweepstake_id: 'sw-vinilo-cerrado',
    position: 1,
    title: 'Vinilo firmado del sello',
    description: 'Edición limitada firmada por los artistas del sello.',
    kind: 'producto',
    estimated_value: 90,
    currency: 'USD',
    winner_user_id: 'user-mc-asfalto',
    winner_username: 'rimas_del_sur',
    status: 'enviado',
    delivery: [
      { at: days(-11), status: 'contactando', note: 'Ganador contactado por mensajes' },
      { at: days(-10), status: 'coordinando', note: 'Dirección confirmada' },
      { at: days(-8), status: 'enviado', note: 'Seguimiento postal 9400 1000 0000 0000' },
    ],
    created_at: days(-12),
  },
];

const challenges: SponsorChallenge[] = [
  {
    id: 'ch-freestyle',
    brand_id: 'brand-boom-bap',
    post_id: 'spost-desafio',
    title: '16 barras sobre sample de soul',
    description:
      'Interpretá 16 barras sobre el sample oficial del sello. Podés grabarte con el celular, sin edición. El jurado evalúa flow, métrica y originalidad.',
    rules:
      'Un video por participante, máximo 60 segundos. Sin playback. El jurado del sello elige al ganador con los criterios publicados.',
    discipline: 'mc',
    deadline: days(12),
    prize_description: 'Sesión de grabación + master + difusión en el sello.',
    judging_mode: 'jurado',
    criteria: ['Flow', 'Métrica', 'Originalidad', 'Presencia escénica'],
    status: 'abierto',
    entries: [
      {
        id: 'che-1',
        challenge_id: 'ch-freestyle',
        user_id: 'user-mc-asfalto',
        username: 'rimas_del_sur',
        full_name: 'Lírica & Asfalto',
        avatar_url:
          'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop',
        title: 'Barras del sur',
        description: '16 barras sobre el barrio, la lluvia y el último tren.',
        media_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        votes: ['user-graffiti-krew', 'user-bboy-cypher'],
        created_at: days(-1),
      },
      {
        id: 'che-2',
        challenge_id: 'ch-freestyle',
        user_id: 'user-bboy-cypher',
        username: 'bboy_vortex',
        full_name: 'Vortex Bboy Crew',
        title: 'Cypher de madrugada',
        description: 'Grabado en una plaza de Medellín a las 3 AM.',
        media_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        votes: ['user-mc-asfalto'],
        created_at: hoursAgo(8),
      },
    ],
    created_at: days(-2),
  },
];

const campaigns: SponsorCampaign[] = [
  {
    id: 'camp-mural',
    brand_id: 'brand-aerosol-king',
    owner_id: 'demo-aerosol',
    post_id: 'spost-campana',
    title: 'Mural comunitario de 40 metros en la plaza',
    description:
      'Con 30 pibes del barrio estamos pintando un mural de 40 metros. Necesitamos aerosoles, andamios y comida para seis jornadas de trabajo.',
    image_url:
      'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=1200&h=700&fit=crop',
    beneficiary: 'Colectivo Muro Abierto + Aerosol King',
    goal_amount: 1500,
    currency: 'USD',
    raised_amount: 620,
    donors_count: 3,
    closes_at: days(21),
    use_of_funds:
      '60% aerosoles y materiales, 25% andamios y seguridad, 15% comida y agua para las jornadas. Cada gasto se publica con comprobante.',
    updates: [
      { at: days(-2), text: 'Primera jornada terminada: 12 metros pintados y 18 pibes participando.' },
      { at: days(-5), text: 'Llegaron los primeros aerosoles donados por la comunidad.' },
    ],
    status: 'activa',
    created_at: days(-8),
  },
];

const contributions: CampaignContribution[] = [
  {
    id: 'cc-1',
    campaign_id: 'camp-mural',
    user_id: 'user-graffiti-krew',
    donor_name: 'Kronos Muro Libre',
    amount: 120,
    currency: 'USD',
    method: 'transferencia',
    status: 'verificado',
    tx_ref: 'TRF-889231',
    message: 'Vamos con ese mural, hermanos.',
    anonymous: false,
    verified_by: 'demo-aerosol',
    verified_at: days(-4),
    created_at: days(-5),
  },
  {
    id: 'cc-2',
    campaign_id: 'camp-mural',
    donor_name: 'Anónimo',
    amount: 500,
    currency: 'USD',
    method: 'cripto',
    status: 'verificado',
    tx_ref: '0x9f2c...a71b',
    message: 'La cultura se banca entre todos.',
    anonymous: true,
    verified_by: 'demo-aerosol',
    verified_at: days(-3),
    created_at: days(-4),
  },
  {
    id: 'cc-3',
    campaign_id: 'camp-mural',
    user_id: 'user-dj-raw',
    donor_name: 'DJ Frecuencia Raw',
    amount: 50,
    currency: 'USD',
    method: 'externo',
    status: 'pendiente',
    message: 'Aporte en camino.',
    anonymous: false,
    created_at: hoursAgo(20),
  },
];

const points: PointsEntry[] = [
  {
    id: 'pt-1',
    user_id: 'user-mc-asfalto',
    action: 'sorteo_participar',
    points: 10,
    ref_id: 'sp-old-1',
    ref_type: 'sweepstake',
    created_at: days(-30),
  },
  {
    id: 'pt-2',
    user_id: 'user-mc-asfalto',
    action: 'sorteo_participar',
    points: 10,
    ref_id: 'sp-hoodie-1',
    ref_type: 'sweepstake',
    created_at: hoursAgo(30),
  },
  {
    id: 'pt-3',
    user_id: 'user-graffiti-krew',
    action: 'acuerdo_completado',
    points: 100,
    ref_id: 'agr-kronos-mural',
    ref_type: 'agreement',
    created_at: days(-2),
  },
];

const reviews: SponsorReview[] = [
  {
    id: 'rev-1',
    agreement_id: 'agr-boom-bap-old',
    brand_id: 'brand-boom-bap',
    from_id: 'user-dj-raw',
    from_role: 'artista',
    ratings: { seriousness: 5, compliance: 5, communication: 5, quality: 5 },
    comment: 'Pago en tiempo, master impecable y difusión real. Volvería a trabajar con ellos.',
    created_at: days(-18),
  },
  {
    id: 'rev-2',
    agreement_id: 'agr-boom-bap-old',
    brand_id: 'brand-boom-bap',
    from_id: 'user-dj-raw',
    from_role: 'marca',
    ratings: { seriousness: 5, compliance: 4, communication: 5, quality: 5 },
    comment: 'Set impecable y entrega puntual. Excelente profesional.',
    created_at: days(-17),
  },
];

export function createSeedState(): SponsorsState {
  return {
    version: 1,
    seeded: true,
    brands,
    opportunities,
    applications,
    agreements,
    posts,
    sweepstakes,
    participations,
    prizes,
    challenges,
    campaigns,
    contributions,
    points,
    reviews,
    notifications: [],
    audit: [],
  };
}
