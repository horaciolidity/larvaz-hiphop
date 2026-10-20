-- ==============================================================================
-- LARVAZ HIPHOP — SEED DE DATOS DE DEMOSTRACIÓN (PRUEBAS DE DESARROLLO)
-- Estos datos están claramente identificados como perfiles y posts de prueba.
-- ==============================================================================

-- 1. PERFILES DE PRUEBA (UUIDs estáticos para pruebas reproducibles)
INSERT INTO public.profiles (id, username, full_name, bio, avatar_url, banner_url, location, website, portfolio_url, artistic_disciplines, role)
VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'admin_demo',
    'Admin Moderación (Demo)',
    'Cuenta oficial de demostración para el equipo de moderación y administración de Larvaz Hip-Hop.',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&h=400&fit=crop',
    'Buenos Aires / Cono Sur',
    'https://larvazhiphop.org',
    'https://larvazhiphop.org/admin',
    'Gestión cultural, moderación y archivo underground',
    'admin'
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'under_krew',
    'Underground Krew (Demo)',
    'Colectivo multidisciplinario de graffiti, beatmaking y sesiones de break callejero. 100% autogestión.',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&h=400&fit=crop',
    'Santiago / Valparaíso',
    'https://soundcloud.com',
    'https://instagram.com',
    'Graffiti, Beatmaking, B-boying',
    'user'
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'dj_frecuencia',
    'DJ Frecuencia Raw (Demo)',
    'Turntablism, cajas de vinilo y scratches analógicos. Amante del boom-bap de los 90 y el sonido lofi.',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&h=400&fit=crop',
    'Medellín, Colombia',
    'https://spotify.com',
    'https://youtube.com',
    'DJing, Turntablism, Producción',
    'user'
  ),
  (
    '00000000-0000-0000-0000-000000000004',
    'rimas_del_asfalto',
    'Lírica & Asfalto (Demo)',
    'Rimas crudas desde los barrios del sur. Mensaje consciente, métrica y flow callejero sin filtros.',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&h=400&fit=crop',
    'Ciudad de México',
    'https://youtube.com',
    'https://spotify.com',
    'MC, Rap consciente, Freestyle',
    'user'
  )
ON CONFLICT (id) DO NOTHING;

-- 2. PUBLICACIONES DE DEMOSTRACIÓN (Con enlaces reales de muestra y metadatos)
INSERT INTO public.posts (id, user_id, external_url, normalized_url, provider, content_type, description, tags, likes_count, comments_count)
VALUES
  (
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://youtube.com/watch?v=dQw4w9WgXcQ',
    'youtube',
    'video',
    'Sesión completa de graffiti en trenes abandonados y muro comunitario en la periferia. Respeto al aerosol libre y los colores de resistencia.',
    ARRAY['graffiti', 'bombing', 'streetart', 'cultura'],
    14,
    3
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000003',
    'https://soundcloud.com/sample-track/underground-cypher-beat',
    'https://soundcloud.com/sample-track/underground-cypher-beat',
    'soundcloud',
    'music',
    'Nuevo Beat Tape en cinta: Boom Bap 90 BPM con samples de vinilo de jazz y breakbeats procesados en cinta magnética. Dejen sus opiniones.',
    ARRAY['boombap', 'beats', 'turntablism', 'sp1200'],
    28,
    5
  ),
  (
    '10000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000004',
    'https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT',
    'https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT',
    'spotify',
    'music',
    'Estreno en plataformas: "Crónicas del Callejón". Letras nacidas en el pavimento con scratch cortesía de DJ Frecuencia.',
    ARRAY['rap', 'mc', 'underground', 'hiphopenespanol'],
    42,
    7
  )
ON CONFLICT (id) DO NOTHING;

-- 3. METADATOS DE PRUEBA ASOCIADOS
INSERT INTO public.post_metadata (post_id, title, author_name, thumbnail_url, description, embed_url)
VALUES
  (
    '10000000-0000-0000-0000-000000000001',
    'Muros Libres — Registro Audiovisual de Graffiti Nocturno',
    'Underground Krew Media',
    'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=800&h=450&fit=crop',
    'Documental y sesión en vivo de pintura urbana de gran formato.',
    'https://www.youtube.com/embed/dQw4w9WgXcQ'
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    'Raw MPC 2000XL Beat Tape (Lofi & Boom-Bap)',
    'DJ Frecuencia Raw',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&h=450&fit=crop',
    'Instrumental puro de 90 BPM ideal para improvisación de rimas y sesiones de cypher.',
    'https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/1'
  ),
  (
    '10000000-0000-0000-0000-000000000003',
    'Crónicas del Callejón — Single Oficial',
    'Lírica & Asfalto ft. DJ Frecuencia',
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=450&fit=crop',
    'Corte promocional del nuevo LP independiente.',
    'https://open.spotify.com/embed/track/4cOdK2wGLETKBW3PvgPWqT'
  )
ON CONFLICT (post_id) DO NOTHING;

-- 4. EVENTOS DE DEMOSTRACIÓN
INSERT INTO public.events (id, organizer_id, title, slug, description, flyer_url, start_date, end_date, timezone, location, organizer_name, ticket_url, tags)
VALUES
  (
    '20000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    'Cypher Callejero & Batalla 1vs1 Breaking',
    'cypher-callejero-batalla-1vs1-breaking',
    'Encuentro al aire libre en la plaza central. Trae tu linóleo, micrófonos abiertos, batallas de breaking estilo libre y sesión de bocetos de graffiti. Entrada libre y gratuita para toda la familia de la cultura hip-hop.',
    'https://images.unsplash.com/photo-1545128485-c400e7702796?w=800&h=1000&fit=crop',
    NOW() + INTERVAL '5 days',
    NOW() + INTERVAL '5 days 6 hours',
    'America/Argentina/Buenos_Aires',
    'Plaza de los Dos Congresos, Buenos Aires',
    'Underground Krew Colectivo',
    'https://instagram.com/larvaz_hiphop',
    ARRAY['cypher', 'breaking', 'bboy', 'cultura']
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000003',
    'Feria de Vinilos & Taller de Turntablism',
    'feria-de-vinilos-taller-de-turntablism',
    'Intercambio de vinilos raros, cajas de segunda mano, clínicas sobre técnicas de scratch (flare, crab, chirps) y demostración con platos Technics 1200.',
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&h=1000&fit=crop',
    NOW() + INTERVAL '12 days',
    NOW() + INTERVAL '12 days 4 hours',
    'America/Bogota',
    'Centro Cultural El Muro, Medellín',
    'DJ Frecuencia Raw',
    'https://larvazhiphop.org/eventos',
    ARRAY['dj', 'scratch', 'vinilos', 'turntablism']
  )
ON CONFLICT (id) DO NOTHING;
