-- ==============================================================================
-- LARVAZ SPONSORS — Supabase schema, RLS and server-side validation
-- "UNA COMUNIDAD. TODOS LOS ELEMENTOS. UN MISMO LUGAR."
--
-- Extensión nativa de LARVAZ HIP-HOP. No duplica cuentas: todas las personas
-- se relacionan con public.profiles(id), y una misma cuenta puede administrar
-- una marca y a la vez postularse como artista.
--
-- Persistencia en runtime: localStorage (larvaz_sponsors_v1).
-- Persistencia de producción: este esquema. Los secretos de sorteos
-- (número, palabra y respuesta) viven en sponsor_sweepstake_secrets, con RLS
-- limitada a la marca y administración, para no filtrarlos por la API pública.
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- HELPERS INMUTABLES / DE LECTURA
-- ==============================================================================

-- Normaliza respuestas de sorteos (minúsculas, sin acentos, sin espacios extra).
CREATE OR REPLACE FUNCTION public.sponsor_normalize(p_text TEXT)
RETURNS TEXT AS $$
    SELECT translate(lower(btrim(coalesce(p_text, ''))), 'áéíóúüñ', 'aeiouun');
$$ LANGUAGE sql IMMUTABLE;

-- Rol administrativo (incluye super_admin sin tocar public.is_admin()).
CREATE OR REPLACE FUNCTION public.sponsor_is_admin(p_user UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = p_user AND role IN ('admin', 'super_admin')
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Pertenencia de una marca. SECURITY DEFINER evita recursión de RLS.
CREATE OR REPLACE FUNCTION public.sponsor_brand_owned_by(p_brand UUID, p_user UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.sponsor_brands
        WHERE id = p_brand AND owner_id = p_user
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Valida la forma de una oferta (económica, productos, logística, mixta o cripto).
CREATE OR REPLACE FUNCTION public.sponsor_validate_offer(p_offer JSONB)
RETURNS BOOLEAN AS $$
DECLARE
    v_type TEXT;
    v_crypto JSONB;
BEGIN
    IF p_offer IS NULL OR jsonb_typeof(p_offer) <> 'object' THEN
        RETURN FALSE;
    END IF;

    v_type := p_offer ->> 'type';
    IF v_type NOT IN ('economico', 'productos', 'logistico', 'mixto', 'cripto') THEN
        RETURN FALSE;
    END IF;

    IF coalesce(btrim(p_offer ->> 'summary'), '') = '' THEN
        RETURN FALSE;
    END IF;

    IF v_type IN ('economico', 'mixto') THEN
        IF (p_offer ->> 'amount') IS NULL OR (p_offer ->> 'amount')::NUMERIC < 0 THEN
            RETURN FALSE;
        END IF;
    END IF;

    IF v_type IN ('productos', 'logistico', 'mixto') THEN
        IF p_offer -> 'products' IS NOT NULL AND jsonb_typeof(p_offer -> 'products') <> 'array' THEN
            RETURN FALSE;
        END IF;
        IF p_offer -> 'logistics' IS NOT NULL AND jsonb_typeof(p_offer -> 'logistics') <> 'array' THEN
            RETURN FALSE;
        END IF;
    END IF;

    IF v_type = 'cripto' THEN
        v_crypto := p_offer -> 'crypto';
        IF v_crypto IS NULL OR jsonb_typeof(v_crypto) <> 'object' THEN
            RETURN FALSE;
        END IF;
        IF coalesce(btrim(v_crypto ->> 'asset'), '') = ''
           OR coalesce(btrim(v_crypto ->> 'blockchain'), '') = ''
           OR coalesce(btrim(v_crypto ->> 'network'), '') = ''
           OR coalesce((v_crypto ->> 'amount')::NUMERIC, 0) <= 0 THEN
            RETURN FALSE;
        END IF;
        IF (v_crypto ->> 'status') NOT IN ('pendiente', 'comprobante_recibido', 'verificado') THEN
            RETURN FALSE;
        END IF;
    END IF;

    RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ==============================================================================
-- 1. MARCAS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.sponsor_brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    slug TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]{2,60}$'),
    name TEXT NOT NULL CHECK (length(btrim(name)) BETWEEN 2 AND 80),
    logo_url TEXT,
    cover_url TEXT,
    description TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL CHECK (category IN (
        'indumentaria', 'calzado', 'accesorios', 'tecnologia', 'musica',
        'audiovisual', 'arte', 'deportes', 'bebidas', 'eventos', 'servicios', 'otros'
    )),
    country TEXT NOT NULL,
    province TEXT,
    city TEXT NOT NULL,
    website TEXT,
    instagram TEXT,
    tiktok TEXT,
    facebook TEXT,
    contact_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    seeking_categories TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    interest_locations TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    verification TEXT NOT NULL DEFAULT 'pendiente'
        CHECK (verification IN ('pendiente', 'verificada', 'rechazada', 'suspendida')),
    verification_note TEXT,
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reputation_score NUMERIC(2, 1) NOT NULL DEFAULT 0
        CHECK (reputation_score >= 0 AND reputation_score <= 5),
    reputation_reviews INTEGER NOT NULL DEFAULT 0 CHECK (reputation_reviews >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sponsor_brand_followers (
    brand_id UUID NOT NULL REFERENCES public.sponsor_brands(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (brand_id, user_id)
);

-- ==============================================================================
-- 2. OPORTUNIDADES Y CONTRAPRESTACIONES
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.sponsor_opportunities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID NOT NULL REFERENCES public.sponsor_brands(id) ON DELETE CASCADE,
    title TEXT NOT NULL CHECK (length(btrim(title)) BETWEEN 3 AND 120),
    description TEXT NOT NULL CHECK (length(btrim(description)) >= 20),
    image_url TEXT,
    offer JSONB NOT NULL CHECK (public.sponsor_validate_offer(offer)),
    offer_type TEXT GENERATED ALWAYS AS ((offer ->> 'type')) STORED,
    payment_modality TEXT GENERATED ALWAYS AS ((offer ->> 'payment_modality')) STORED,
    artist_categories TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    country TEXT NOT NULL,
    province TEXT,
    city TEXT NOT NULL,
    is_remote BOOLEAN NOT NULL DEFAULT FALSE,
    duration_days INTEGER NOT NULL DEFAULT 30 CHECK (duration_days BETWEEN 1 AND 365),
    deadline TIMESTAMPTZ NOT NULL,
    slots INTEGER NOT NULL DEFAULT 1 CHECK (slots >= 1),
    status TEXT NOT NULL DEFAULT 'borrador'
        CHECK (status IN ('borrador', 'abierta', 'pausada', 'cerrada')),
    applications_count INTEGER NOT NULL DEFAULT 0 CHECK (applications_count >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT sponsor_opportunities_offer_type_check
        CHECK (offer_type IN ('economico', 'productos', 'logistico', 'mixto', 'cripto'))
);

CREATE TABLE IF NOT EXISTS public.sponsor_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    opportunity_id UUID NOT NULL REFERENCES public.sponsor_opportunities(id) ON DELETE CASCADE,
    brand_id UUID NOT NULL REFERENCES public.sponsor_brands(id) ON DELETE CASCADE,
    artist_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    artist_username TEXT NOT NULL,
    artist_name TEXT NOT NULL,
    artist_avatar TEXT,
    message TEXT NOT NULL CHECK (length(btrim(message)) >= 20),
    portfolio_url TEXT,
    social_links JSONB NOT NULL DEFAULT '[]'::JSONB
        CHECK (jsonb_typeof(social_links) = 'array'),
    experience TEXT NOT NULL DEFAULT '',
    proposal TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN (
        'pendiente', 'preseleccionada', 'oferta', 'aceptada', 'rechazada', 'retirada'
    )),
    offer JSONB,
    brand_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 3. ACUERDOS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.sponsor_agreements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    opportunity_id UUID REFERENCES public.sponsor_opportunities(id) ON DELETE SET NULL,
    application_id UUID UNIQUE REFERENCES public.sponsor_applications(id) ON DELETE SET NULL,
    brand_id UUID NOT NULL REFERENCES public.sponsor_brands(id) ON DELETE CASCADE,
    artist_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    artist_username TEXT NOT NULL,
    artist_name TEXT NOT NULL,
    title TEXT NOT NULL,
    benefits TEXT NOT NULL DEFAULT '',
    offer JSONB,
    start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_date TIMESTAMPTZ NOT NULL,
    terms TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN (
        'pendiente', 'negociacion', 'aceptado', 'en_curso',
        'cumplimiento_parcial', 'completado', 'cancelado', 'disputa'
    )),
    accepted_by_brand BOOLEAN NOT NULL DEFAULT FALSE,
    accepted_by_artist BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT sponsor_agreements_dates_check CHECK (end_date > start_date)
);

CREATE TABLE IF NOT EXISTS public.sponsor_agreement_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agreement_id UUID NOT NULL REFERENCES public.sponsor_agreements(id) ON DELETE CASCADE,
    at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    by_name TEXT NOT NULL DEFAULT 'Sistema',
    action TEXT NOT NULL,
    note TEXT
);

CREATE TABLE IF NOT EXISTS public.sponsor_counterparts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    opportunity_id UUID REFERENCES public.sponsor_opportunities(id) ON DELETE CASCADE,
    agreement_id UUID REFERENCES public.sponsor_agreements(id) ON DELETE CASCADE,
    kind TEXT NOT NULL CHECK (kind IN (
        'publicaciones', 'historias', 'menciones', 'fotos', 'videos', 'posts_larvaz',
        'presentaciones', 'presencia_marca', 'disenos', 'murales',
        'produccion_musical', 'colaboraciones', 'exclusividad', 'otro'
    )),
    description TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1),
    platform TEXT,
    due_date TIMESTAMPTZ,
    evidence_required TEXT,
    status TEXT NOT NULL DEFAULT 'pendiente'
        CHECK (status IN ('pendiente', 'en_proceso', 'entregado', 'aprobado', 'rechazado')),
    evidence_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT sponsor_counterparts_owner_check
        CHECK (num_nonnulls(opportunity_id, agreement_id) = 1)
);

-- ==============================================================================
-- 4. PUBLICACIONES DE MARCA INTEGRADAS AL FEED
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.sponsor_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID REFERENCES public.sponsor_brands(id) ON DELETE SET NULL,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    kind TEXT NOT NULL DEFAULT 'normal' CHECK (kind IN (
        'normal', 'producto', 'lanzamiento', 'promocion', 'patrocinio',
        'convocatoria', 'busqueda', 'sorteo', 'concurso', 'desafio',
        'premio', 'donacion', 'evento', 'competencia', 'proyecto'
    )),
    title TEXT NOT NULL CHECK (length(btrim(title)) >= 1),
    body TEXT NOT NULL CHECK (length(btrim(body)) >= 10),
    image_url TEXT,
    gallery TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    link_url TEXT,
    tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    shares INTEGER NOT NULL DEFAULT 0 CHECK (shares >= 0),
    sweepstake_id UUID,
    challenge_id UUID,
    campaign_id UUID,
    is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sponsor_post_likes (
    post_id UUID NOT NULL REFERENCES public.sponsor_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.sponsor_post_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES public.sponsor_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (length(btrim(content)) BETWEEN 1 AND 1000),
    is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 5. SORTEOS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.sponsor_sweepstakes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID NOT NULL REFERENCES public.sponsor_brands(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES public.sponsor_posts(id) ON DELETE CASCADE,
    title TEXT NOT NULL CHECK (length(btrim(title)) >= 3),
    description TEXT NOT NULL DEFAULT '',
    prize_image_url TEXT,
    category TEXT NOT NULL DEFAULT 'otros' CHECK (category IN (
        'mc', 'bboy', 'dj', 'graffiti', 'bailarin', 'productor',
        'fotografo', 'crew', 'skate', 'otros'
    )),
    prize_value NUMERIC(14, 2),
    currency TEXT NOT NULL DEFAULT 'USD',
    winners_count INTEGER NOT NULL DEFAULT 1 CHECK (winners_count BETWEEN 1 AND 100),
    starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ends_at TIMESTAMPTZ NOT NULL,
    draw_at TIMESTAMPTZ NOT NULL,
    countries TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    requirements TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    rules TEXT NOT NULL DEFAULT '',
    method TEXT NOT NULL CHECK (method IN (
        'boton', 'comentarios', 'likes', 'numeros', 'palabras',
        'mejor_comentario', 'aleatorio'
    )),
    delivery_method TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'borrador'
        CHECK (status IN ('borrador', 'activo', 'cerrado', 'sorteado', 'cancelado')),
    likes_required BOOLEAN NOT NULL DEFAULT FALSE,
    comment_rule JSONB CHECK (comment_rule IS NULL OR jsonb_typeof(comment_rule) = 'object'),
    number_rule JSONB CHECK (number_rule IS NULL OR jsonb_typeof(number_rule) = 'object'),
    word_rule JSONB CHECK (word_rule IS NULL OR jsonb_typeof(word_rule) = 'object'),
    judging JSONB CHECK (judging IS NULL OR jsonb_typeof(judging) = 'object'),
    seed TEXT,
    drawn_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT sponsor_sweepstakes_dates_check CHECK (starts_at < ends_at)
);

-- Secretos: nunca se exponen por la API pública.
CREATE TABLE IF NOT EXISTS public.sponsor_sweepstake_secrets (
    sweepstake_id UUID PRIMARY KEY REFERENCES public.sponsor_sweepstakes(id) ON DELETE CASCADE,
    number_secret INTEGER,
    word_secret TEXT,
    comment_answer TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sponsor_sweepstake_participations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sweepstake_id UUID NOT NULL REFERENCES public.sponsor_sweepstakes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    method TEXT NOT NULL,
    comment_text TEXT,
    guess TEXT,
    valid BOOLEAN NOT NULL DEFAULT TRUE,
    invalid_reason TEXT,
    score INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sponsor_sweepstake_winners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sweepstake_id UUID NOT NULL REFERENCES public.sponsor_sweepstakes(id) ON DELETE CASCADE,
    participation_id UUID NOT NULL REFERENCES public.sponsor_sweepstake_participations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    position INTEGER NOT NULL CHECK (position >= 1),
    prize_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT sponsor_sweepstake_winners_position_unique UNIQUE (sweepstake_id, position),
    CONSTRAINT sponsor_sweepstake_winners_participation_unique UNIQUE (sweepstake_id, participation_id)
);

CREATE TABLE IF NOT EXISTS public.sponsor_sweepstake_audit (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sweepstake_id UUID NOT NULL REFERENCES public.sponsor_sweepstakes(id) ON DELETE CASCADE,
    at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    hash TEXT NOT NULL,
    detail TEXT
);

-- ==============================================================================
-- 6. DESAFÍOS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.sponsor_challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID NOT NULL REFERENCES public.sponsor_brands(id) ON DELETE CASCADE,
    post_id UUID REFERENCES public.sponsor_posts(id) ON DELETE SET NULL,
    title TEXT NOT NULL CHECK (length(btrim(title)) >= 3),
    description TEXT NOT NULL DEFAULT '',
    rules TEXT NOT NULL DEFAULT '',
    discipline TEXT NOT NULL CHECK (discipline IN (
        'mc', 'bboy', 'dj', 'graffiti', 'bailarin', 'productor',
        'fotografo', 'crew', 'skate', 'otros'
    )),
    deadline TIMESTAMPTZ NOT NULL,
    prize_description TEXT NOT NULL DEFAULT '',
    judging_mode TEXT NOT NULL DEFAULT 'votos' CHECK (judging_mode IN ('votos', 'jurado')),
    criteria TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    status TEXT NOT NULL DEFAULT 'abierto' CHECK (status IN ('abierto', 'en_evaluacion', 'cerrado')),
    winner_entry_id UUID,
    justification TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sponsor_challenge_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    challenge_id UUID NOT NULL REFERENCES public.sponsor_challenges(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    title TEXT NOT NULL CHECK (length(btrim(title)) >= 3),
    description TEXT NOT NULL CHECK (length(btrim(description)) >= 10),
    media_url TEXT,
    score INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT sponsor_challenge_entries_one_per_user UNIQUE (challenge_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.sponsor_challenge_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    challenge_id UUID NOT NULL REFERENCES public.sponsor_challenges(id) ON DELETE CASCADE,
    entry_id UUID NOT NULL REFERENCES public.sponsor_challenge_entries(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT sponsor_challenge_votes_one_per_entry UNIQUE (entry_id, user_id),
    CONSTRAINT sponsor_challenge_votes_one_per_challenge UNIQUE (challenge_id, user_id)
);

-- ==============================================================================
-- 7. PREMIOS Y ENTREGAS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.sponsor_prizes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID NOT NULL REFERENCES public.sponsor_brands(id) ON DELETE CASCADE,
    sweepstake_id UUID REFERENCES public.sponsor_sweepstakes(id) ON DELETE CASCADE,
    challenge_id UUID REFERENCES public.sponsor_challenges(id) ON DELETE CASCADE,
    position INTEGER NOT NULL DEFAULT 1 CHECK (position >= 1),
    title TEXT NOT NULL,
    description TEXT,
    kind TEXT NOT NULL DEFAULT 'producto' CHECK (kind IN (
        'dinero', 'cripto', 'producto', 'servicio', 'experiencia', 'beca', 'patrocinio'
    )),
    estimated_value NUMERIC(14, 2),
    currency TEXT DEFAULT 'USD',
    winner_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    winner_username TEXT,
    status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN (
        'pendiente', 'contactando', 'coordinando', 'enviado',
        'entregado', 'incidencia', 'confirmado'
    )),
    winner_confirmed_at TIMESTAMPTZ,
    winner_confirmed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT sponsor_prizes_source_check
        CHECK (num_nonnulls(sweepstake_id, challenge_id) >= 1)
);

CREATE TABLE IF NOT EXISTS public.sponsor_prize_delivery (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prize_id UUID NOT NULL REFERENCES public.sponsor_prizes(id) ON DELETE CASCADE,
    at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL CHECK (status IN (
        'pendiente', 'contactando', 'coordinando', 'enviado',
        'entregado', 'incidencia', 'confirmado'
    )),
    note TEXT,
    proof_url TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- ==============================================================================
-- 8. CAMPAÑAS DE DONACIÓN
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.sponsor_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID REFERENCES public.sponsor_brands(id) ON DELETE SET NULL,
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    post_id UUID REFERENCES public.sponsor_posts(id) ON DELETE SET NULL,
    title TEXT NOT NULL CHECK (length(btrim(title)) >= 3),
    description TEXT NOT NULL CHECK (length(btrim(description)) >= 30),
    image_url TEXT,
    beneficiary TEXT NOT NULL,
    goal_amount NUMERIC(14, 2) NOT NULL CHECK (goal_amount > 0),
    currency TEXT NOT NULL DEFAULT 'USD',
    raised_amount NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (raised_amount >= 0),
    donors_count INTEGER NOT NULL DEFAULT 0 CHECK (donors_count >= 0),
    closes_at TIMESTAMPTZ NOT NULL,
    use_of_funds TEXT NOT NULL CHECK (length(btrim(use_of_funds)) >= 15),
    updates JSONB NOT NULL DEFAULT '[]'::JSONB CHECK (jsonb_typeof(updates) = 'array'),
    status TEXT NOT NULL DEFAULT 'activa' CHECK (status IN ('activa', 'pausada', 'finalizada')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sponsor_campaign_contributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES public.sponsor_campaigns(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    donor_name TEXT NOT NULL DEFAULT 'Donante',
    amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
    currency TEXT NOT NULL DEFAULT 'USD',
    method TEXT NOT NULL CHECK (method IN ('transferencia', 'cripto', 'externo')),
    status TEXT NOT NULL DEFAULT 'pendiente'
        CHECK (status IN ('pendiente', 'verificado', 'rechazado')),
    tx_ref TEXT,
    message TEXT CHECK (message IS NULL OR length(message) <= 300),
    anonymous BOOLEAN NOT NULL DEFAULT FALSE,
    verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Vista pública: solo aportes verificados y sin identidad de aportantes anónimos.
CREATE OR REPLACE VIEW public.sponsor_campaign_contributions_public AS
SELECT
    c.id,
    c.campaign_id,
    CASE WHEN c.anonymous THEN 'Anónimo' ELSE c.donor_name END AS donor_name,
    c.amount,
    c.currency,
    c.method,
    c.status,
    CASE WHEN c.anonymous THEN NULL ELSE c.message END AS message,
    c.verified_at,
    c.created_at
FROM public.sponsor_campaign_contributions c
WHERE c.status = 'verificado';

-- ==============================================================================
-- 9. LARVAZ POINTS (no es dinero)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.sponsor_points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN (
        'sorteo_participar', 'desafio_participar', 'comentario_sponsor',
        'donacion_verificada', 'acuerdo_completado', 'resena', 'perfil_completo'
    )),
    points INTEGER NOT NULL CHECK (points > 0),
    ref_id TEXT,
    ref_type TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 10. RESEÑAS BILATERALES
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.sponsor_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agreement_id UUID NOT NULL REFERENCES public.sponsor_agreements(id) ON DELETE CASCADE,
    brand_id UUID NOT NULL REFERENCES public.sponsor_brands(id) ON DELETE CASCADE,
    from_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    from_role TEXT NOT NULL CHECK (from_role IN ('marca', 'artista')),
    seriousness SMALLINT NOT NULL CHECK (seriousness BETWEEN 1 AND 5),
    compliance SMALLINT NOT NULL CHECK (compliance BETWEEN 1 AND 5),
    communication SMALLINT NOT NULL CHECK (communication BETWEEN 1 AND 5),
    quality SMALLINT NOT NULL CHECK (quality BETWEEN 1 AND 5),
    comment TEXT NOT NULL CHECK (length(btrim(comment)) >= 10),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT sponsor_reviews_one_per_side UNIQUE (agreement_id, from_role)
);

-- ==============================================================================
-- 11. NOTIFICACIONES DEL SEGMENTO
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.sponsor_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN (
        'nueva_postulacion', 'nueva_oportunidad', 'oferta', 'acuerdo',
        'sorteo', 'participacion', 'ganador', 'premio', 'donacion',
        'campana', 'compromiso', 'verificacion', 'review'
    )),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    href TEXT,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 12. AUDITORÍA ADMINISTRATIVA (append-only)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.sponsor_audit (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    detail TEXT,
    hash TEXT
);

-- ==============================================================================
-- RELACIONES CIRCULARES (se agregan al final, diferidas)
-- ==============================================================================

ALTER TABLE public.sponsor_sweepstake_winners
    DROP CONSTRAINT IF EXISTS sponsor_sweepstake_winners_prize_fk;
ALTER TABLE public.sponsor_sweepstake_winners
    ADD CONSTRAINT sponsor_sweepstake_winners_prize_fk
    FOREIGN KEY (prize_id) REFERENCES public.sponsor_prizes(id) ON DELETE SET NULL;

ALTER TABLE public.sponsor_challenges
    DROP CONSTRAINT IF EXISTS sponsor_challenges_winner_entry_fk;
ALTER TABLE public.sponsor_challenges
    ADD CONSTRAINT sponsor_challenges_winner_entry_fk
    FOREIGN KEY (winner_entry_id) REFERENCES public.sponsor_challenge_entries(id) ON DELETE SET NULL;

ALTER TABLE public.sponsor_posts
    DROP CONSTRAINT IF EXISTS sponsor_posts_sweepstake_fk;
ALTER TABLE public.sponsor_posts
    ADD CONSTRAINT sponsor_posts_sweepstake_fk
    FOREIGN KEY (sweepstake_id) REFERENCES public.sponsor_sweepstakes(id)
    ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE public.sponsor_posts
    DROP CONSTRAINT IF EXISTS sponsor_posts_challenge_fk;
ALTER TABLE public.sponsor_posts
    ADD CONSTRAINT sponsor_posts_challenge_fk
    FOREIGN KEY (challenge_id) REFERENCES public.sponsor_challenges(id)
    ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE public.sponsor_posts
    DROP CONSTRAINT IF EXISTS sponsor_posts_campaign_fk;
ALTER TABLE public.sponsor_posts
    ADD CONSTRAINT sponsor_posts_campaign_fk
    FOREIGN KEY (campaign_id) REFERENCES public.sponsor_campaigns(id)
    ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED;

-- ==============================================================================
-- ÍNDICES
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_sponsor_brands_owner ON public.sponsor_brands(owner_id);
CREATE INDEX IF NOT EXISTS idx_sponsor_brands_filter
    ON public.sponsor_brands(verification, category, country, city);
CREATE INDEX IF NOT EXISTS idx_sponsor_brands_seeking
    ON public.sponsor_brands USING GIN(seeking_categories);
CREATE INDEX IF NOT EXISTS idx_sponsor_brands_locations
    ON public.sponsor_brands USING GIN(interest_locations);
CREATE INDEX IF NOT EXISTS idx_sponsor_brand_followers_user ON public.sponsor_brand_followers(user_id);

CREATE INDEX IF NOT EXISTS idx_sponsor_opportunities_brand ON public.sponsor_opportunities(brand_id);
CREATE INDEX IF NOT EXISTS idx_sponsor_opportunities_filter
    ON public.sponsor_opportunities(status, deadline, country, city);
CREATE INDEX IF NOT EXISTS idx_sponsor_opportunities_categories
    ON public.sponsor_opportunities USING GIN(artist_categories);
CREATE INDEX IF NOT EXISTS idx_sponsor_opportunities_offer_type
    ON public.sponsor_opportunities(offer_type);

CREATE INDEX IF NOT EXISTS idx_sponsor_applications_opportunity
    ON public.sponsor_applications(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_sponsor_applications_artist
    ON public.sponsor_applications(artist_id);
CREATE INDEX IF NOT EXISTS idx_sponsor_applications_brand
    ON public.sponsor_applications(brand_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS uq_sponsor_application_active
    ON public.sponsor_applications(opportunity_id, artist_id)
    WHERE status NOT IN ('retirada', 'rechazada');

CREATE INDEX IF NOT EXISTS idx_sponsor_agreements_brand ON public.sponsor_agreements(brand_id, status);
CREATE INDEX IF NOT EXISTS idx_sponsor_agreements_artist ON public.sponsor_agreements(artist_id, status);
CREATE INDEX IF NOT EXISTS idx_sponsor_agreement_history
    ON public.sponsor_agreement_history(agreement_id, at DESC);
CREATE INDEX IF NOT EXISTS idx_sponsor_counterparts_opportunity
    ON public.sponsor_counterparts(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_sponsor_counterparts_agreement
    ON public.sponsor_counterparts(agreement_id);

CREATE INDEX IF NOT EXISTS idx_sponsor_posts_created ON public.sponsor_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sponsor_posts_brand ON public.sponsor_posts(brand_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sponsor_posts_visible
    ON public.sponsor_posts(is_hidden, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sponsor_post_comments_post
    ON public.sponsor_post_comments(post_id, created_at);
CREATE INDEX IF NOT EXISTS idx_sponsor_post_likes_post
    ON public.sponsor_post_likes(post_id);

CREATE INDEX IF NOT EXISTS idx_sponsor_sweepstakes_filter
    ON public.sponsor_sweepstakes(status, ends_at, draw_at);
CREATE INDEX IF NOT EXISTS idx_sponsor_sweepstakes_brand
    ON public.sponsor_sweepstakes(brand_id, status);
CREATE INDEX IF NOT EXISTS idx_sponsor_sweepstake_participations
    ON public.sponsor_sweepstake_participations(sweepstake_id, valid);
CREATE UNIQUE INDEX IF NOT EXISTS uq_sponsor_participation_valid
    ON public.sponsor_sweepstake_participations(sweepstake_id, user_id)
    WHERE valid;
CREATE INDEX IF NOT EXISTS idx_sponsor_sweepstake_winners
    ON public.sponsor_sweepstake_winners(sweepstake_id, position);
CREATE INDEX IF NOT EXISTS idx_sponsor_sweepstake_audit
    ON public.sponsor_sweepstake_audit(sweepstake_id, at DESC);

CREATE INDEX IF NOT EXISTS idx_sponsor_challenges_filter
    ON public.sponsor_challenges(status, deadline);
CREATE INDEX IF NOT EXISTS idx_sponsor_challenges_brand
    ON public.sponsor_challenges(brand_id);
CREATE INDEX IF NOT EXISTS idx_sponsor_challenge_entries
    ON public.sponsor_challenge_entries(challenge_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sponsor_challenge_votes_entry
    ON public.sponsor_challenge_votes(entry_id);

CREATE INDEX IF NOT EXISTS idx_sponsor_prizes_brand ON public.sponsor_prizes(brand_id, status);
CREATE INDEX IF NOT EXISTS idx_sponsor_prizes_sweepstake
    ON public.sponsor_prizes(sweepstake_id, position);
CREATE INDEX IF NOT EXISTS idx_sponsor_prizes_challenge
    ON public.sponsor_prizes(challenge_id, position);
CREATE INDEX IF NOT EXISTS idx_sponsor_prize_delivery
    ON public.sponsor_prize_delivery(prize_id, at DESC);

CREATE INDEX IF NOT EXISTS idx_sponsor_campaigns_filter
    ON public.sponsor_campaigns(status, closes_at);
CREATE INDEX IF NOT EXISTS idx_sponsor_campaigns_owner
    ON public.sponsor_campaigns(owner_id);
CREATE INDEX IF NOT EXISTS idx_sponsor_contributions_campaign
    ON public.sponsor_campaign_contributions(campaign_id, status);
CREATE INDEX IF NOT EXISTS idx_sponsor_contributions_user
    ON public.sponsor_campaign_contributions(user_id);

CREATE INDEX IF NOT EXISTS idx_sponsor_points_user ON public.sponsor_points(user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS uq_sponsor_points_ref
    ON public.sponsor_points(user_id, action, (COALESCE(ref_id, '')));

CREATE INDEX IF NOT EXISTS idx_sponsor_reviews_brand ON public.sponsor_reviews(brand_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sponsor_notifications_user
    ON public.sponsor_notifications(user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sponsor_audit_target
    ON public.sponsor_audit(target_type, target_id, at DESC);

-- ==============================================================================
-- FUNCIONES DE SOPORTE
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.sponsor_notify(
    p_user UUID,
    p_type TEXT,
    p_title TEXT,
    p_body TEXT,
    p_href TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    IF p_user IS NULL THEN
        RETURN;
    END IF;
    IF p_type NOT IN (
        'nueva_postulacion', 'nueva_oportunidad', 'oferta', 'acuerdo',
        'sorteo', 'participacion', 'ganador', 'premio', 'donacion',
        'campana', 'compromiso', 'verificacion', 'review'
    ) THEN
        RETURN;
    END IF;

    INSERT INTO public.sponsor_notifications (user_id, type, title, body, href)
    VALUES (p_user, p_type, left(btrim(p_title), 140), left(btrim(p_body), 400), p_href);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.sponsor_audit_log(
    p_actor UUID,
    p_action TEXT,
    p_target_type TEXT,
    p_target_id TEXT,
    p_detail TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    INSERT INTO public.sponsor_audit (actor_id, action, target_type, target_id, detail, hash)
    VALUES (
        p_actor,
        p_action,
        p_target_type,
        p_target_id,
        p_detail,
        encode(digest(
            concat_ws('|', coalesce(p_actor::TEXT, ''), clock_timestamp()::TEXT,
                      p_action, p_target_type, coalesce(p_target_id, ''), coalesce(p_detail, '')),
            'sha256'
        ), 'hex')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Puntos canónicos, con topes diarios y deduplicación por referencia.
-- Solo lo invocan triggers: los clientes no pueden insertar puntos.
CREATE OR REPLACE FUNCTION public.sponsor_award_points(
    p_user UUID,
    p_action TEXT,
    p_ref_id TEXT,
    p_ref_type TEXT
) RETURNS VOID AS $$
DECLARE
    v_points INTEGER;
    v_cap INTEGER;
    v_today INTEGER;
BEGIN
    IF p_user IS NULL THEN
        RETURN;
    END IF;

    v_points := CASE p_action
        WHEN 'sorteo_participar' THEN 10
        WHEN 'desafio_participar' THEN 25
        WHEN 'comentario_sponsor' THEN 3
        WHEN 'donacion_verificada' THEN 20
        WHEN 'acuerdo_completado' THEN 100
        WHEN 'resena' THEN 10
        WHEN 'perfil_completo' THEN 50
        ELSE NULL
    END;

    v_cap := CASE p_action
        WHEN 'sorteo_participar' THEN 5
        WHEN 'desafio_participar' THEN 2
        WHEN 'comentario_sponsor' THEN 10
        WHEN 'donacion_verificada' THEN 5
        WHEN 'acuerdo_completado' THEN 3
        WHEN 'resena' THEN 3
        WHEN 'perfil_completo' THEN 1
        ELSE 0
    END;

    IF v_points IS NULL THEN
        RETURN;
    END IF;

    SELECT count(*) INTO v_today
    FROM public.sponsor_points
    WHERE user_id = p_user
      AND action = p_action
      AND created_at >= date_trunc('day', now());

    IF v_today >= v_cap THEN
        RETURN;
    END IF;

    INSERT INTO public.sponsor_points (user_id, action, points, ref_id, ref_type)
    VALUES (p_user, p_action, v_points, p_ref_id, p_ref_type)
    ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.sponsor_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- MARCAS: VERIFICACIÓN CONTROLADA POR ADMINISTRACIÓN
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.sponsor_brand_before_insert()
RETURNS TRIGGER AS $$
BEGIN
    IF auth.uid() IS NOT NULL AND NOT public.sponsor_is_admin(auth.uid()) THEN
        NEW.verification := 'pendiente';
        NEW.verification_note := NULL;
        NEW.verified_at := NULL;
        NEW.verified_by := NULL;
    END IF;
    NEW.slug := lower(btrim(NEW.slug));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.sponsor_brand_guard_update()
RETURNS TRIGGER AS $$
BEGIN
    IF auth.uid() IS NOT NULL AND NOT public.sponsor_is_admin(auth.uid()) THEN
        IF NEW.owner_id IS DISTINCT FROM OLD.owner_id
           OR NEW.verification IS DISTINCT FROM OLD.verification
           OR NEW.verification_note IS DISTINCT FROM OLD.verification_note
           OR NEW.verified_at IS DISTINCT FROM OLD.verified_at
           OR NEW.verified_by IS DISTINCT FROM OLD.verified_by
           OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
            RAISE EXCEPTION 'Solo administración puede verificar marcas';
        END IF;
        IF (NEW.reputation_score IS DISTINCT FROM OLD.reputation_score
            OR NEW.reputation_reviews IS DISTINCT FROM OLD.reputation_reviews)
           AND coalesce(current_setting('sponsor.reputation_update', TRUE), 'off') <> 'on' THEN
            RAISE EXCEPTION 'La reputación se calcula desde las reseñas';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.sponsor_brand_after_change()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM public.sponsor_award_points(NEW.owner_id, 'perfil_completo', NEW.id::TEXT, 'brand');
        PERFORM public.sponsor_audit_log(auth.uid(), 'marca_creada', 'sponsor_brand', NEW.id::TEXT, NEW.name);
    ELSIF NEW.verification IS DISTINCT FROM OLD.verification THEN
        PERFORM public.sponsor_audit_log(
            auth.uid(), 'marca_' || NEW.verification, 'sponsor_brand', NEW.id::TEXT, NEW.verification_note
        );
        PERFORM public.sponsor_notify(
            NEW.owner_id, 'verificacion', 'Estado de tu marca',
            NEW.name || ': ' || NEW.verification, '/sponsors/panel'
        );
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ==============================================================================
-- POSTULACIONES
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.sponsor_application_before_insert()
RETURNS TRIGGER AS $$
DECLARE
    v_opp public.sponsor_opportunities;
BEGIN
    SELECT * INTO v_opp FROM public.sponsor_opportunities WHERE id = NEW.opportunity_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'La propuesta no existe';
    END IF;
    IF v_opp.status <> 'abierta' OR v_opp.deadline <= now() THEN
        RAISE EXCEPTION 'La convocatoria no está recibiendo postulaciones';
    END IF;
    IF auth.uid() IS NOT NULL AND NEW.artist_id <> auth.uid() THEN
        RAISE EXCEPTION 'Solo podés postularte con tu propia cuenta';
    END IF;
    IF public.sponsor_brand_owned_by(v_opp.brand_id, NEW.artist_id) THEN
        RAISE EXCEPTION 'No podés postularte a tu propia marca';
    END IF;
    IF EXISTS (
        SELECT 1 FROM public.sponsor_applications
        WHERE opportunity_id = NEW.opportunity_id
          AND artist_id = NEW.artist_id
          AND status NOT IN ('retirada', 'rechazada')
    ) THEN
        RAISE EXCEPTION 'Ya tenés una postulación activa en esta propuesta';
    END IF;

    NEW.brand_id := v_opp.brand_id;
    NEW.status := 'pendiente';
    NEW.offer := NULL;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.sponsor_application_guard_update()
RETURNS TRIGGER AS $$
DECLARE
    v_actor UUID := auth.uid();
BEGIN
    IF v_actor IS NULL OR public.sponsor_is_admin(v_actor) THEN
        RETURN NEW;
    END IF;

    IF NEW.created_at IS DISTINCT FROM OLD.created_at
       OR NEW.opportunity_id IS DISTINCT FROM OLD.opportunity_id
       OR NEW.brand_id IS DISTINCT FROM OLD.brand_id
       OR NEW.artist_id IS DISTINCT FROM OLD.artist_id
       OR NEW.artist_username IS DISTINCT FROM OLD.artist_username
       OR NEW.artist_name IS DISTINCT FROM OLD.artist_name THEN
        RAISE EXCEPTION 'No se pueden alterar los datos base de la postulación';
    END IF;

    IF v_actor = OLD.artist_id THEN
        IF NEW.offer IS DISTINCT FROM OLD.offer OR NEW.brand_note IS DISTINCT FROM OLD.brand_note THEN
            RAISE EXCEPTION 'La oferta y la nota son de la marca';
        END IF;
        IF NEW.status NOT IN ('retirada', 'rechazada', 'aceptada') THEN
            RAISE EXCEPTION 'El artista solo puede retirarse o responder una oferta';
        END IF;
        IF NEW.status IN ('rechazada', 'aceptada') AND OLD.status <> 'oferta' THEN
            RAISE EXCEPTION 'No hay una oferta pendiente para responder';
        END IF;
    ELSIF public.sponsor_brand_owned_by(OLD.brand_id, v_actor) THEN
        IF NEW.status NOT IN ('pendiente', 'preseleccionada', 'rechazada', 'oferta') THEN
            RAISE EXCEPTION 'La marca no puede aceptar una oferta en nombre del artista';
        END IF;
        IF NEW.status = 'oferta' AND NEW.offer IS NULL THEN
            RAISE EXCEPTION 'La oferta necesita detalle';
        END IF;
    ELSE
        RAISE EXCEPTION 'No formás parte de esta postulación';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.sponsor_application_after_change()
RETURNS TRIGGER AS $$
DECLARE
    v_brand_owner UUID;
BEGIN
    UPDATE public.sponsor_opportunities o
    SET applications_count = (
        SELECT count(*) FROM public.sponsor_applications a
        WHERE a.opportunity_id = o.id AND a.status NOT IN ('retirada', 'rechazada')
    )
    WHERE o.id = NEW.opportunity_id;

    SELECT owner_id INTO v_brand_owner
    FROM public.sponsor_brands WHERE id = NEW.brand_id;

    IF TG_OP = 'INSERT' THEN
        PERFORM public.sponsor_notify(
            v_brand_owner, 'nueva_postulacion', 'Nueva postulación recibida',
            NEW.artist_name || ' se postuló a una propuesta.',
            '/sponsors/panel?tab=postulaciones'
        );
    ELSIF NEW.status IS DISTINCT FROM OLD.status AND auth.uid() IS DISTINCT FROM NEW.artist_id THEN
        PERFORM public.sponsor_notify(
            NEW.artist_id, 'nueva_postulacion', 'Tu postulación cambió de estado',
            'Nuevo estado: ' || NEW.status, '/sponsors/artista'
        );
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.sponsor_application_after_delete()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.sponsor_opportunities o
    SET applications_count = (
        SELECT count(*) FROM public.sponsor_applications a
        WHERE a.opportunity_id = o.id AND a.status NOT IN ('retirada', 'rechazada')
    )
    WHERE o.id = OLD.opportunity_id;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ==============================================================================
-- ACUERDOS
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.sponsor_agreement_before_insert()
RETURNS TRIGGER AS $$
DECLARE
    v_app public.sponsor_applications;
BEGIN
    IF NEW.application_id IS NOT NULL THEN
        SELECT * INTO v_app FROM public.sponsor_applications WHERE id = NEW.application_id;
        IF NOT FOUND OR v_app.brand_id <> NEW.brand_id OR v_app.artist_id <> NEW.artist_id THEN
            RAISE EXCEPTION 'La postulación no corresponde al acuerdo';
        END IF;
        IF v_app.status NOT IN ('oferta', 'aceptada') THEN
            RAISE EXCEPTION 'La postulación todavía no tiene una oferta';
        END IF;
        IF auth.uid() = NEW.artist_id AND v_app.status NOT IN ('oferta', 'aceptada') THEN
            RAISE EXCEPTION 'No hay una oferta pendiente';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.sponsor_agreement_after_insert()
RETURNS TRIGGER AS $$
DECLARE
    v_name TEXT;
BEGIN
    SELECT full_name INTO v_name FROM public.profiles WHERE id = auth.uid();
    INSERT INTO public.sponsor_agreement_history (agreement_id, by_id, by_name, action, note)
    VALUES (NEW.id, auth.uid(), coalesce(v_name, NEW.artist_name), 'Acuerdo creado', NEW.title);
    PERFORM public.sponsor_audit_log(auth.uid(), 'acuerdo_creado', 'sponsor_agreement', NEW.id::TEXT, NEW.title);
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.sponsor_agreement_guard_update()
RETURNS TRIGGER AS $$
DECLARE
    v_actor UUID := auth.uid();
    v_is_artist BOOLEAN;
    v_is_brand BOOLEAN;
    v_pending INTEGER;
BEGIN
    IF NEW.brand_id IS DISTINCT FROM OLD.brand_id
       OR NEW.artist_id IS DISTINCT FROM OLD.artist_id
       OR NEW.application_id IS DISTINCT FROM OLD.application_id
       OR NEW.opportunity_id IS DISTINCT FROM OLD.opportunity_id
       OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
        RAISE EXCEPTION 'No se pueden alterar las partes del acuerdo';
    END IF;

    v_is_artist := v_actor = OLD.artist_id;
    v_is_brand := public.sponsor_brand_owned_by(OLD.brand_id, v_actor);

    IF v_actor IS NOT NULL AND NOT public.sponsor_is_admin(v_actor) THEN
        IF NOT v_is_artist AND NOT v_is_brand THEN
            RAISE EXCEPTION 'No formás parte de este acuerdo';
        END IF;
        IF NEW.accepted_by_brand IS DISTINCT FROM OLD.accepted_by_brand AND NOT v_is_brand THEN
            RAISE EXCEPTION 'Solo la marca acepta por la marca';
        END IF;
        IF NEW.accepted_by_artist IS DISTINCT FROM OLD.accepted_by_artist AND NOT v_is_artist THEN
            RAISE EXCEPTION 'Solo el artista acepta por el artista';
        END IF;
        IF NEW.status = 'aceptado' AND NOT (NEW.accepted_by_brand AND NEW.accepted_by_artist) THEN
            RAISE EXCEPTION 'Ambas partes deben aceptar el acuerdo';
        END IF;
    END IF;

    IF NEW.status = 'completado' AND OLD.status <> 'completado' THEN
        SELECT count(*) INTO v_pending
        FROM public.sponsor_counterparts
        WHERE agreement_id = OLD.id AND status NOT IN ('aprobado', 'entregado');
        IF v_pending > 0 THEN
            RAISE EXCEPTION 'Todavía hay contraprestaciones pendientes de aprobación';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.sponsor_agreement_after_update()
RETURNS TRIGGER AS $$
DECLARE
    v_name TEXT;
    v_owner UUID;
    v_counterpart UUID;
BEGIN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
        SELECT full_name INTO v_name FROM public.profiles WHERE id = auth.uid();
        SELECT owner_id INTO v_owner FROM public.sponsor_brands WHERE id = NEW.brand_id;

        INSERT INTO public.sponsor_agreement_history (agreement_id, by_id, by_name, action, note)
        VALUES (NEW.id, auth.uid(), coalesce(v_name, 'Sistema'), 'Estado: ' || NEW.status, NULL);

        PERFORM public.sponsor_audit_log(
            auth.uid(), 'acuerdo_' || NEW.status, 'sponsor_agreement', NEW.id::TEXT, NEW.title
        );

        v_counterpart := CASE WHEN auth.uid() = NEW.artist_id THEN v_owner ELSE NEW.artist_id END;
        PERFORM public.sponsor_notify(
            v_counterpart, 'acuerdo', 'Tu acuerdo cambió de estado',
            NEW.title || ': ' || NEW.status, '/sponsors/panel?tab=acuerdos'
        );

        IF NEW.status = 'completado' THEN
            PERFORM public.sponsor_award_points(NEW.artist_id, 'acuerdo_completado', NEW.id::TEXT, 'agreement');
            PERFORM public.sponsor_award_points(v_owner, 'acuerdo_completado', NEW.id::TEXT, 'agreement');
        END IF;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.sponsor_counterpart_guard()
RETURNS TRIGGER AS $$
DECLARE
    v_actor UUID := auth.uid();
    v_agreement public.sponsor_agreements;
    v_brand UUID;
BEGIN
    IF v_actor IS NULL OR public.sponsor_is_admin(v_actor) THEN
        RETURN NEW;
    END IF;

    IF NEW.agreement_id IS NOT NULL THEN
        SELECT * INTO v_agreement FROM public.sponsor_agreements WHERE id = NEW.agreement_id;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Acuerdo inexistente';
        END IF;
        IF v_actor = v_agreement.artist_id THEN
            IF TG_OP = 'INSERT' THEN
                RETURN NEW;
            END IF;
            IF NEW.status NOT IN ('pendiente', 'en_proceso', 'entregado')
               OR NEW.description IS DISTINCT FROM OLD.description
               OR NEW.quantity IS DISTINCT FROM OLD.quantity
               OR NEW.kind IS DISTINCT FROM OLD.kind
               OR NEW.due_date IS DISTINCT FROM OLD.due_date THEN
                RAISE EXCEPTION 'El artista solo puede entregar evidencias y marcar avances';
            END IF;
            RETURN NEW;
        END IF;
        IF public.sponsor_brand_owned_by(v_agreement.brand_id, v_actor) THEN
            RETURN NEW;
        END IF;
        RAISE EXCEPTION 'No formás parte de este acuerdo';
    END IF;

    IF NEW.opportunity_id IS NOT NULL THEN
        SELECT brand_id INTO v_brand FROM public.sponsor_opportunities WHERE id = NEW.opportunity_id;
        IF public.sponsor_brand_owned_by(v_brand, v_actor) THEN
            RETURN NEW;
        END IF;
        RAISE EXCEPTION 'Solo la marca gestiona las contraprestaciones de la propuesta';
    END IF;

    RAISE EXCEPTION 'Contraprestación sin origen';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ==============================================================================
-- PUBLICACIONES, COMENTARIOS Y COMPARTIDOS
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.sponsor_post_before_change()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.brand_id IS NOT NULL AND auth.uid() IS NOT NULL
       AND NOT public.sponsor_brand_owned_by(NEW.brand_id, auth.uid())
       AND NOT public.sponsor_is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'No podés publicar en nombre de esa marca';
    END IF;
    IF NEW.brand_id IS NULL AND NEW.kind NOT IN ('donacion', 'proyecto', 'evento', 'competencia') THEN
        RAISE EXCEPTION 'Las publicaciones de marca necesitan una marca';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.sponsor_comment_after_insert()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.sponsor_award_points(NEW.user_id, 'comentario_sponsor', NEW.id::TEXT, 'sponsor_comment');
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Compartir es una acción pública: no permite editar el resto del post.
CREATE OR REPLACE FUNCTION public.sponsor_register_share(p_post_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.sponsor_posts
    SET shares = shares + 1, updated_at = NOW()
    WHERE id = p_post_id AND NOT is_hidden;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ==============================================================================
-- SORTEOS
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.sponsor_sweepstake_before_insert()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'sorteado' THEN
        RAISE EXCEPTION 'El sorteo se realiza con la función de sorteo';
    END IF;
    IF NEW.ends_at <= NEW.starts_at THEN
        RAISE EXCEPTION 'La fecha de cierre debe ser posterior al inicio';
    END IF;
    IF NEW.method IN ('numeros', 'palabras', 'mejor_comentario') AND NEW.status = 'activo' THEN
        RAISE EXCEPTION 'Configurá los secretos antes de activar este método';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.sponsor_sweepstake_guard_update()
RETURNS TRIGGER AS $$
DECLARE
    v_winners INTEGER;
    v_audit INTEGER;
BEGIN
    -- Transición a sorteado: solo con ganadores, semilla, fecha y auditoría.
    IF NEW.status = 'sorteado' AND OLD.status <> 'sorteado' THEN
        IF OLD.status = 'borrador' THEN
            RAISE EXCEPTION 'Un sorteo en borrador no puede sortearse';
        END IF;
        SELECT count(*) INTO v_winners
        FROM public.sponsor_sweepstake_winners WHERE sweepstake_id = OLD.id;
        SELECT count(*) INTO v_audit
        FROM public.sponsor_sweepstake_audit
        WHERE sweepstake_id = OLD.id AND action = 'sorteo_realizado' AND hash IS NOT NULL;

        IF NEW.seed IS NULL OR NEW.drawn_at IS NULL OR v_winners < 1
           OR v_winners > OLD.winners_count OR v_audit < 1 THEN
            RAISE EXCEPTION 'El sorteo no tiene un resultado auditable';
        END IF;
        RETURN NEW;
    END IF;

    IF OLD.status = 'sorteado' THEN
        IF NEW.seed IS DISTINCT FROM OLD.seed OR NEW.drawn_at IS DISTINCT FROM OLD.drawn_at THEN
            RAISE EXCEPTION 'El resultado del sorteo es inmutable';
        END IF;
    END IF;

    IF NEW.status IS DISTINCT FROM OLD.status THEN
        IF NOT (
            (OLD.status = 'borrador' AND NEW.status IN ('activo', 'cancelado')) OR
            (OLD.status = 'activo' AND NEW.status IN ('cerrado', 'cancelado')) OR
            (OLD.status = 'cerrado' AND NEW.status = 'cancelado')
        ) THEN
            RAISE EXCEPTION 'Transición de sorteo no permitida';
        END IF;
    END IF;

    -- No se puede activar un sorteo con secretos faltantes.
    IF NEW.status = 'activo' AND OLD.status = 'borrador'
       AND NEW.method IN ('numeros', 'palabras') THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.sponsor_sweepstake_secrets s
            WHERE s.sweepstake_id = OLD.id
              AND ((NEW.method = 'numeros' AND s.number_secret IS NOT NULL)
                   OR (NEW.method = 'palabras' AND s.word_secret IS NOT NULL))
        ) THEN
            RAISE EXCEPTION 'Configurá el secreto del sorteo antes de activarlo';
        END IF;
    END IF;

    -- Reglas bloqueadas al iniciar.
    IF OLD.status <> 'borrador' AND (
        NEW.method IS DISTINCT FROM OLD.method OR
        NEW.brand_id IS DISTINCT FROM OLD.brand_id OR
        NEW.post_id IS DISTINCT FROM OLD.post_id OR
        NEW.starts_at IS DISTINCT FROM OLD.starts_at OR
        NEW.ends_at IS DISTINCT FROM OLD.ends_at OR
        NEW.draw_at IS DISTINCT FROM OLD.draw_at OR
        NEW.countries IS DISTINCT FROM OLD.countries OR
        NEW.requirements IS DISTINCT FROM OLD.requirements OR
        NEW.rules IS DISTINCT FROM OLD.rules OR
        NEW.likes_required IS DISTINCT FROM OLD.likes_required OR
        NEW.comment_rule IS DISTINCT FROM OLD.comment_rule OR
        NEW.number_rule IS DISTINCT FROM OLD.number_rule OR
        NEW.word_rule IS DISTINCT FROM OLD.word_rule OR
        NEW.category IS DISTINCT FROM OLD.category OR
        NEW.prize_value IS DISTINCT FROM OLD.prize_value OR
        NEW.currency IS DISTINCT FROM OLD.currency OR
        NEW.delivery_method IS DISTINCT FROM OLD.delivery_method OR
        NEW.winners_count IS DISTINCT FROM OLD.winners_count
    ) THEN
        RAISE EXCEPTION 'Las reglas del sorteo quedan bloqueadas al iniciar';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.sponsor_sweepstake_secret_guard()
RETURNS TRIGGER AS $$
DECLARE
    v_status TEXT;
BEGIN
    SELECT status INTO v_status FROM public.sponsor_sweepstakes WHERE id = NEW.sweepstake_id;
    IF v_status IS NULL THEN
        RAISE EXCEPTION 'Sorteo inexistente';
    END IF;
    IF v_status <> 'borrador' THEN
        RAISE EXCEPTION 'Los secretos quedan bloqueados al iniciar el sorteo';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.sponsor_participation_before_insert()
RETURNS TRIGGER AS $$
DECLARE
    v_sw public.sponsor_sweepstakes;
    v_secret public.sponsor_sweepstake_secrets;
    v_guess_number INTEGER;
    v_comment TEXT;
    v_valid BOOLEAN := TRUE;
    v_reason TEXT;
    v_username TEXT;
    v_full_name TEXT;
    v_avatar TEXT;
BEGIN
    SELECT * INTO v_sw FROM public.sponsor_sweepstakes WHERE id = NEW.sweepstake_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Sorteo inexistente';
    END IF;
    IF auth.uid() IS NOT NULL AND NEW.user_id <> auth.uid() THEN
        RAISE EXCEPTION 'Solo podés participar con tu propia cuenta';
    END IF;
    IF v_sw.status <> 'activo' OR now() < v_sw.starts_at OR now() > v_sw.ends_at THEN
        RAISE EXCEPTION 'El sorteo no está recibiendo participaciones';
    END IF;
    IF EXISTS (
        SELECT 1 FROM public.sponsor_sweepstake_participations
        WHERE sweepstake_id = NEW.sweepstake_id AND user_id = NEW.user_id AND valid
    ) THEN
        RAISE EXCEPTION 'Ya tenés una participación válida en este sorteo';
    END IF;
    IF v_sw.likes_required AND NOT EXISTS (
        SELECT 1 FROM public.sponsor_post_likes
        WHERE post_id = v_sw.post_id AND user_id = NEW.user_id
    ) THEN
        RAISE EXCEPTION 'Primero tenés que dar like a la publicación';
    END IF;

    -- Identidad desde el perfil, nunca desde el cliente.
    SELECT username, full_name, avatar_url
    INTO v_username, v_full_name, v_avatar
    FROM public.profiles WHERE id = NEW.user_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Perfil inexistente';
    END IF;
    NEW.username := v_username;
    NEW.full_name := v_full_name;
    NEW.avatar_url := v_avatar;

    SELECT * INTO v_secret FROM public.sponsor_sweepstake_secrets WHERE sweepstake_id = NEW.sweepstake_id;
    NEW.method := v_sw.method;
    v_comment := btrim(coalesce(NEW.comment_text, ''));

    IF v_sw.method = 'comentarios' THEN
        IF length(v_comment) < 3 THEN
            RAISE EXCEPTION 'El comentario es demasiado corto';
        END IF;
        IF (v_sw.comment_rule ->> 'mode') = 'palabra'
           AND public.sponsor_normalize(v_comment) NOT LIKE
               '%' || public.sponsor_normalize(v_sw.comment_rule ->> 'required_word') || '%' THEN
            RAISE EXCEPTION 'Tu comentario debe incluir la palabra indicada';
        END IF;
        IF (v_sw.comment_rule ->> 'mode') IN ('pregunta', 'adivinanza') THEN
            IF v_secret.comment_answer IS NULL
               OR public.sponsor_normalize(v_comment) NOT LIKE
                  '%' || public.sponsor_normalize(v_secret.comment_answer) || '%' THEN
                RAISE EXCEPTION 'La respuesta no es correcta';
            END IF;
        END IF;
    END IF;

    IF v_sw.method = 'mejor_comentario' AND length(v_comment) < 10 THEN
        RAISE EXCEPTION 'Contá tu historia en al menos 10 caracteres';
    END IF;

    IF v_sw.method = 'numeros' THEN
        IF v_secret.number_secret IS NULL THEN
            RAISE EXCEPTION 'El sorteo no tiene número secreto configurado';
        END IF;
        BEGIN
            v_guess_number := btrim(coalesce(NEW.guess, ''))::INTEGER;
        EXCEPTION WHEN OTHERS THEN
            RAISE EXCEPTION 'Ingresá un número entero';
        END;
        IF v_guess_number < coalesce((v_sw.number_rule ->> 'min')::INTEGER, 0)
           OR v_guess_number > coalesce((v_sw.number_rule ->> 'max')::INTEGER, 0) THEN
            RAISE EXCEPTION 'El número está fuera del rango permitido';
        END IF;
        NEW.guess := v_guess_number::TEXT;
        IF (v_sw.number_rule ->> 'mode') <> 'cercano' THEN
            v_valid := v_guess_number = v_secret.number_secret;
            IF NOT v_valid THEN
                v_reason := 'Número incorrecto';
            END IF;
        END IF;
    END IF;

    IF v_sw.method = 'palabras' THEN
        IF coalesce(btrim(NEW.guess), '') = '' THEN
            RAISE EXCEPTION 'Escribí tu respuesta';
        END IF;
        v_valid := public.sponsor_normalize(NEW.guess) = public.sponsor_normalize(v_secret.word_secret);
        IF NOT v_valid THEN
            v_reason := 'Respuesta incorrecta';
        END IF;
    END IF;

    NEW.valid := v_valid;
    NEW.invalid_reason := v_reason;
    NEW.score := NULL;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.sponsor_participation_after_insert()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.valid THEN
        PERFORM public.sponsor_award_points(NEW.user_id, 'sorteo_participar', NEW.id::TEXT, 'sweepstake');
        PERFORM public.sponsor_notify(
            NEW.user_id, 'participacion', 'Participación registrada',
            'Estás participando en el sorteo.', '/sponsors/sorteo/' || NEW.sweepstake_id::TEXT
        );
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Sorteo determinístico y auditable: semilla aleatoria + orden SHA-256.
-- Solo la marca dueña o administración pueden ejecutarlo.
CREATE OR REPLACE FUNCTION public.sponsor_draw_sweepstake(p_sweepstake_id UUID)
RETURNS TABLE (winner_position INTEGER, user_id UUID, username TEXT, participation_id UUID) AS $$
DECLARE
    v_sw public.sponsor_sweepstakes;
    v_actor UUID := auth.uid();
    v_seed TEXT;
    v_number INTEGER;
    v_word TEXT;
    v_count INTEGER;
BEGIN
    SELECT * INTO v_sw FROM public.sponsor_sweepstakes
    WHERE id = p_sweepstake_id FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Sorteo inexistente';
    END IF;
    IF NOT (public.sponsor_is_admin(v_actor) OR public.sponsor_brand_owned_by(v_sw.brand_id, v_actor)) THEN
        RAISE EXCEPTION 'No tenés permisos para sortear';
    END IF;
    IF v_sw.status = 'sorteado' THEN
        RAISE EXCEPTION 'Este sorteo ya fue realizado';
    END IF;
    IF v_sw.status NOT IN ('activo', 'cerrado') THEN
        RAISE EXCEPTION 'El sorteo no está listo para sortear';
    END IF;
    IF EXISTS (SELECT 1 FROM public.sponsor_sweepstake_winners WHERE sweepstake_id = p_sweepstake_id) THEN
        RAISE EXCEPTION 'El sorteo ya tiene ganadores';
    END IF;

    SELECT number_secret, word_secret INTO v_number, v_word
    FROM public.sponsor_sweepstake_secrets WHERE sweepstake_id = p_sweepstake_id;

    v_seed := encode(gen_random_bytes(32), 'hex');

    WITH base AS (
        SELECT p.*
        FROM public.sponsor_sweepstake_participations p
        WHERE p.sweepstake_id = p_sweepstake_id
          AND p.valid
          AND (NOT v_sw.likes_required OR EXISTS (
              SELECT 1 FROM public.sponsor_post_likes l
              WHERE l.post_id = v_sw.post_id AND l.user_id = p.user_id
          ))
    ),
    filtered AS (
        SELECT b.* FROM base b
        WHERE v_sw.method NOT IN ('numeros', 'palabras', 'mejor_comentario')
           OR (v_sw.method = 'mejor_comentario'
               AND b.id = NULLIF(v_sw.judging ->> 'winner_participation_id', '')::UUID)
           OR (v_sw.method = 'palabras'
               AND public.sponsor_normalize(b.guess) = public.sponsor_normalize(v_word))
           OR (v_sw.method = 'numeros' AND b.guess ~ '^-?[0-9]+$' AND (
                CASE coalesce(v_sw.number_rule ->> 'mode', 'exacto')
                    WHEN 'cercano' THEN
                        abs(b.guess::INTEGER - v_number) = (
                            SELECT min(abs(q.guess::INTEGER - v_number))
                            FROM base q WHERE q.guess ~ '^-?[0-9]+$'
                        )
                    WHEN 'primero' THEN
                        b.guess::INTEGER = v_number AND b.created_at = (
                            SELECT min(q.created_at) FROM base q
                            WHERE q.guess ~ '^-?[0-9]+$' AND q.guess::INTEGER = v_number
                        )
                    ELSE b.guess::INTEGER = v_number
                END
           ))
    ),
    ranked AS (
        SELECT f.*, row_number() OVER (
            ORDER BY encode(digest(v_seed || f.id::TEXT, 'sha256'), 'hex')
        ) AS rn
        FROM filtered f
    )
    INSERT INTO public.sponsor_sweepstake_winners
        (sweepstake_id, participation_id, user_id, username, position)
    SELECT p_sweepstake_id, r.id, r.user_id, r.username, r.rn
    FROM ranked r
    WHERE r.rn <= v_sw.winners_count;

    SELECT count(*) INTO v_count
    FROM public.sponsor_sweepstake_winners WHERE sweepstake_id = p_sweepstake_id;

    IF v_count = 0 THEN
        RAISE EXCEPTION 'No hay participaciones válidas para sortear';
    END IF;

    INSERT INTO public.sponsor_prizes
        (brand_id, sweepstake_id, position, title, description, kind,
         estimated_value, currency, winner_user_id, winner_username, status)
    SELECT v_sw.brand_id, p_sweepstake_id, w.position,
           v_sw.title || ' — puesto ' || w.position,
           v_sw.description, 'producto', v_sw.prize_value,
           coalesce(v_sw.currency, 'USD'), w.user_id, w.username, 'pendiente'
    FROM public.sponsor_sweepstake_winners w
    WHERE w.sweepstake_id = p_sweepstake_id
      AND NOT EXISTS (
          SELECT 1 FROM public.sponsor_prizes pr
          WHERE pr.sweepstake_id = p_sweepstake_id AND pr.position = w.position
      );

    UPDATE public.sponsor_prizes pr
    SET winner_user_id = w.user_id, winner_username = w.username, status = 'pendiente'
    FROM public.sponsor_sweepstake_winners w
    WHERE pr.sweepstake_id = p_sweepstake_id
      AND pr.position = w.position
      AND w.sweepstake_id = p_sweepstake_id;

    UPDATE public.sponsor_sweepstake_winners w
    SET prize_id = pr.id
    FROM public.sponsor_prizes pr
    WHERE w.sweepstake_id = p_sweepstake_id
      AND pr.sweepstake_id = p_sweepstake_id
      AND pr.position = w.position;

    INSERT INTO public.sponsor_sweepstake_audit
        (sweepstake_id, actor_id, action, hash, detail)
    SELECT p_sweepstake_id, v_actor, 'sorteo_realizado',
           encode(digest(
               v_seed || '|' || p_sweepstake_id::TEXT || '|' ||
               string_agg(w.participation_id::TEXT, ',' ORDER BY w.position) || '|' || count(*)::TEXT,
               'sha256'
           ), 'hex'),
           'Semilla pública: ' || v_seed
    FROM public.sponsor_sweepstake_winners w
    WHERE w.sweepstake_id = p_sweepstake_id;

    UPDATE public.sponsor_sweepstakes
    SET status = 'sorteado', seed = v_seed, drawn_at = NOW(),
        winners_count = v_count, updated_at = NOW()
    WHERE id = p_sweepstake_id;

    INSERT INTO public.sponsor_notifications (user_id, type, title, body, href)
    SELECT w.user_id, 'ganador', '¡Ganaste un sorteo LARVAZ!',
           v_sw.title, '/sponsors/sorteo/' || p_sweepstake_id::TEXT
    FROM public.sponsor_sweepstake_winners w
    WHERE w.sweepstake_id = p_sweepstake_id;

    PERFORM public.sponsor_audit_log(
        v_actor, 'sorteo_realizado', 'sponsor_sweepstake', p_sweepstake_id::TEXT, v_seed
    );

    RETURN QUERY
    SELECT w.position, w.user_id, w.username, w.participation_id
    FROM public.sponsor_sweepstake_winners w
    WHERE w.sweepstake_id = p_sweepstake_id
    ORDER BY w.position;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ==============================================================================
-- DESAFÍOS
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.sponsor_challenge_entry_before_insert()
RETURNS TRIGGER AS $$
DECLARE
    v_challenge public.sponsor_challenges;
    v_username TEXT;
    v_full_name TEXT;
    v_avatar TEXT;
BEGIN
    SELECT * INTO v_challenge FROM public.sponsor_challenges WHERE id = NEW.challenge_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Desafío inexistente';
    END IF;
    IF auth.uid() IS NOT NULL AND NEW.user_id <> auth.uid() THEN
        RAISE EXCEPTION 'Solo podés presentarte con tu propia cuenta';
    END IF;
    IF v_challenge.status <> 'abierto' OR v_challenge.deadline <= now() THEN
        RAISE EXCEPTION 'El desafío no está recibiendo trabajos';
    END IF;

    SELECT username, full_name, avatar_url
    INTO v_username, v_full_name, v_avatar
    FROM public.profiles WHERE id = NEW.user_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Perfil inexistente';
    END IF;
    NEW.username := v_username;
    NEW.full_name := v_full_name;
    NEW.avatar_url := v_avatar;

    NEW.score := NULL;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.sponsor_challenge_entry_after_insert()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.sponsor_award_points(NEW.user_id, 'desafio_participar', NEW.id::TEXT, 'challenge_entry');
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.sponsor_challenge_guard_update()
RETURNS TRIGGER AS $$
DECLARE
    v_entry public.sponsor_challenge_entries;
BEGIN
    IF NEW.brand_id IS DISTINCT FROM OLD.brand_id
       OR NEW.post_id IS DISTINCT FROM OLD.post_id
       OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
        RAISE EXCEPTION 'No se pueden alterar los datos base del desafío';
    END IF;

    IF NEW.status IS DISTINCT FROM OLD.status THEN
        IF NOT (
            (OLD.status = 'abierto' AND NEW.status IN ('en_evaluacion', 'cerrado')) OR
            (OLD.status = 'en_evaluacion' AND NEW.status = 'cerrado')
        ) THEN
            RAISE EXCEPTION 'Transición de desafío no permitida';
        END IF;
    END IF;

    IF OLD.status <> 'abierto' AND (
        NEW.discipline IS DISTINCT FROM OLD.discipline OR
        NEW.deadline IS DISTINCT FROM OLD.deadline OR
        NEW.judging_mode IS DISTINCT FROM OLD.judging_mode OR
        NEW.criteria IS DISTINCT FROM OLD.criteria OR
        NEW.rules IS DISTINCT FROM OLD.rules
    ) THEN
        RAISE EXCEPTION 'Las reglas del desafío quedan bloqueadas al cerrar';
    END IF;

    IF NEW.winner_entry_id IS NOT NULL
       AND NEW.winner_entry_id IS DISTINCT FROM OLD.winner_entry_id THEN
        SELECT * INTO v_entry FROM public.sponsor_challenge_entries
        WHERE id = NEW.winner_entry_id;
        IF NOT FOUND OR v_entry.challenge_id <> OLD.id THEN
            RAISE EXCEPTION 'El trabajo ganador no pertenece al desafío';
        END IF;
        IF coalesce(length(btrim(NEW.justification)), 0) < 10 THEN
            RAISE EXCEPTION 'Registrá la justificación de la selección';
        END IF;
        NEW.status := 'cerrado';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.sponsor_challenge_after_update()
RETURNS TRIGGER AS $$
DECLARE
    v_entry public.sponsor_challenge_entries;
BEGIN
    IF NEW.winner_entry_id IS NOT NULL
       AND NEW.winner_entry_id IS DISTINCT FROM OLD.winner_entry_id THEN
        SELECT * INTO v_entry FROM public.sponsor_challenge_entries
        WHERE id = NEW.winner_entry_id;

        INSERT INTO public.sponsor_prizes
            (brand_id, challenge_id, position, title, description, kind,
             winner_user_id, winner_username, status)
        SELECT NEW.brand_id, NEW.id, 1, NEW.title || ' — ganador',
               NEW.prize_description, 'patrocinio',
               v_entry.user_id, v_entry.username, 'pendiente'
        WHERE NOT EXISTS (
            SELECT 1 FROM public.sponsor_prizes
            WHERE challenge_id = NEW.id AND position = 1
        );

        UPDATE public.sponsor_prizes
        SET winner_user_id = v_entry.user_id,
            winner_username = v_entry.username,
            status = CASE WHEN status = 'confirmado' THEN status ELSE 'pendiente' END
        WHERE challenge_id = NEW.id AND position = 1;

        PERFORM public.sponsor_notify(
            v_entry.user_id, 'ganador', '¡Ganaste un desafío LARVAZ!',
            NEW.title || ': ' || NEW.prize_description,
            '/sponsors/desafio/' || NEW.id::TEXT
        );
        PERFORM public.sponsor_audit_log(
            auth.uid(), 'desafio_ganador', 'sponsor_challenge', NEW.id::TEXT,
            v_entry.username || ': ' || coalesce(NEW.justification, '')
        );
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.sponsor_challenge_vote_before_insert()
RETURNS TRIGGER AS $$
DECLARE
    v_challenge public.sponsor_challenges;
    v_entry public.sponsor_challenge_entries;
BEGIN
    SELECT * INTO v_entry FROM public.sponsor_challenge_entries WHERE id = NEW.entry_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Trabajo inexistente';
    END IF;
    SELECT * INTO v_challenge FROM public.sponsor_challenges WHERE id = v_entry.challenge_id;
    IF NOT FOUND OR v_challenge.id <> NEW.challenge_id THEN
        RAISE EXCEPTION 'El trabajo no pertenece al desafío';
    END IF;
    IF auth.uid() IS NOT NULL AND NEW.user_id <> auth.uid() THEN
        RAISE EXCEPTION 'Solo podés votar con tu propia cuenta';
    END IF;
    IF v_challenge.judging_mode <> 'votos' OR v_challenge.status <> 'abierto' THEN
        RAISE EXCEPTION 'Las votaciones están cerradas';
    END IF;
    IF v_entry.user_id = NEW.user_id THEN
        RAISE EXCEPTION 'No podés votar tu propio trabajo';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ==============================================================================
-- PREMIOS Y ENTREGAS
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.sponsor_prize_delivery_after_insert()
RETURNS TRIGGER AS $$
DECLARE
    v_winner UUID;
    v_title TEXT;
    v_owner UUID;
BEGIN
    UPDATE public.sponsor_prizes
    SET status = NEW.status, updated_at = NOW()
    WHERE id = NEW.prize_id;

    SELECT p.winner_user_id, p.title, b.owner_id
    INTO v_winner, v_title, v_owner
    FROM public.sponsor_prizes p
    JOIN public.sponsor_brands b ON b.id = p.brand_id
    WHERE p.id = NEW.prize_id;

    IF NEW.status = 'incidencia' THEN
        PERFORM public.sponsor_notify(
            v_owner, 'premio', 'Incidencia en entrega de premio',
            coalesce(NEW.note, 'Revisá la entrega desde el panel.'), '/sponsors/panel?tab=premios'
        );
    END IF;

    IF v_winner IS NOT NULL THEN
        PERFORM public.sponsor_notify(
            v_winner, 'premio', 'Actualización de tu premio',
            v_title || ': ' || NEW.status, '/sponsors/artista?tab=premios'
        );
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.sponsor_prize_guard_update()
RETURNS TRIGGER AS $$
DECLARE
    v_actor UUID := auth.uid();
BEGIN
    IF v_actor IS NULL OR public.sponsor_is_admin(v_actor) THEN
        RETURN NEW;
    END IF;

    IF v_actor = OLD.winner_user_id THEN
        IF NEW.brand_id IS DISTINCT FROM OLD.brand_id
           OR NEW.sweepstake_id IS DISTINCT FROM OLD.sweepstake_id
           OR NEW.challenge_id IS DISTINCT FROM OLD.challenge_id
           OR NEW.winner_user_id IS DISTINCT FROM OLD.winner_user_id
           OR NEW.title IS DISTINCT FROM OLD.title
           OR NEW.status NOT IN ('confirmado', OLD.status) THEN
            RAISE EXCEPTION 'El ganador solo puede confirmar la recepción';
        END IF;
        NEW.winner_confirmed_at := coalesce(NEW.winner_confirmed_at, NOW());
        NEW.winner_confirmed_by := v_actor;
        NEW.status := 'confirmado';
        RETURN NEW;
    END IF;

    IF public.sponsor_brand_owned_by(OLD.brand_id, v_actor) THEN
        IF NEW.winner_confirmed_at IS DISTINCT FROM OLD.winner_confirmed_at
           AND NEW.winner_confirmed_by IS DISTINCT FROM OLD.winner_user_id THEN
            RAISE EXCEPTION 'Solo el ganador confirma la recepción';
        END IF;
        IF NEW.status = 'confirmado' AND coalesce(NEW.winner_confirmed_at, OLD.winner_confirmed_at) IS NULL THEN
            RAISE EXCEPTION 'Falta la confirmación del ganador';
        END IF;
        RETURN NEW;
    END IF;

    RAISE EXCEPTION 'No tenés permisos sobre este premio';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ==============================================================================
-- CAMPAÑAS Y APORTES
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.sponsor_campaign_owner(p_campaign UUID)
RETURNS UUID AS $$
    SELECT coalesce(b.owner_id, c.owner_id)
    FROM public.sponsor_campaigns c
    LEFT JOIN public.sponsor_brands b ON b.id = c.brand_id
    WHERE c.id = p_campaign;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.sponsor_campaign_recalc(p_campaign UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.sponsor_campaigns c
    SET raised_amount = coalesce((
            SELECT sum(amount) FROM public.sponsor_campaign_contributions
            WHERE campaign_id = c.id AND status = 'verificado'
        ), 0),
        donors_count = (
            SELECT count(*) FROM public.sponsor_campaign_contributions
            WHERE campaign_id = c.id AND status = 'verificado'
        )
    WHERE c.id = p_campaign;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.sponsor_campaign_before_insert()
RETURNS TRIGGER AS $$
BEGIN
    IF auth.uid() IS NOT NULL AND NEW.owner_id <> auth.uid()
       AND NOT public.sponsor_is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'La campaña pertenece a tu cuenta';
    END IF;
    IF NEW.closes_at <= now() THEN
        RAISE EXCEPTION 'La fecha de cierre ya pasó';
    END IF;
    NEW.raised_amount := 0;
    NEW.donors_count := 0;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.sponsor_campaign_guard_update()
RETURNS TRIGGER AS $$
DECLARE
    v_actor UUID := auth.uid();
    v_verified INTEGER;
BEGIN
    IF v_actor IS NOT NULL AND NOT public.sponsor_is_admin(v_actor)
       AND (NEW.owner_id IS DISTINCT FROM OLD.owner_id
            OR NEW.brand_id IS DISTINCT FROM OLD.brand_id
            OR NEW.post_id IS DISTINCT FROM OLD.post_id
            OR NEW.created_at IS DISTINCT FROM OLD.created_at) THEN
        RAISE EXCEPTION 'No se pueden alterar los datos base de la campaña';
    END IF;

    SELECT count(*) INTO v_verified
    FROM public.sponsor_campaign_contributions
    WHERE campaign_id = OLD.id AND status = 'verificado';

    IF v_verified > 0 AND NEW.goal_amount IS DISTINCT FROM OLD.goal_amount THEN
        RAISE EXCEPTION 'El objetivo no puede cambiar con aportes verificados';
    END IF;

    -- Los totales siempre se recalculan desde aportes verificados.
    NEW.raised_amount := coalesce((
        SELECT sum(amount) FROM public.sponsor_campaign_contributions
        WHERE campaign_id = OLD.id AND status = 'verificado'
    ), 0);
    NEW.donors_count := v_verified;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.sponsor_contribution_before_insert()
RETURNS TRIGGER AS $$
DECLARE
    v_campaign public.sponsor_campaigns;
BEGIN
    SELECT * INTO v_campaign FROM public.sponsor_campaigns WHERE id = NEW.campaign_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Campaña inexistente';
    END IF;
    IF v_campaign.status <> 'activa' OR v_campaign.closes_at <= now() THEN
        RAISE EXCEPTION 'La campaña no está recibiendo aportes';
    END IF;
    IF auth.uid() IS NOT NULL AND NEW.user_id IS NOT NULL AND NEW.user_id <> auth.uid() THEN
        RAISE EXCEPTION 'El aporte debe registrarse con tu cuenta';
    END IF;

    NEW.status := 'pendiente';
    NEW.verified_by := NULL;
    NEW.verified_at := NULL;
    NEW.amount := round(NEW.amount, 2);
    IF NEW.anonymous THEN
        NEW.donor_name := 'Anónimo';
    ELSIF coalesce(btrim(NEW.donor_name), '') = '' THEN
        NEW.donor_name := 'Donante';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.sponsor_contribution_guard_update()
RETURNS TRIGGER AS $$
DECLARE
    v_actor UUID := auth.uid();
BEGIN
    IF v_actor IS NULL OR public.sponsor_is_admin(v_actor) THEN
        RETURN NEW;
    END IF;
    IF v_actor <> public.sponsor_campaign_owner(OLD.campaign_id) THEN
        RAISE EXCEPTION 'Solo la organización verifica aportes';
    END IF;

    IF NEW.campaign_id IS DISTINCT FROM OLD.campaign_id
       OR NEW.user_id IS DISTINCT FROM OLD.user_id
       OR NEW.amount IS DISTINCT FROM OLD.amount
       OR NEW.currency IS DISTINCT FROM OLD.currency
       OR NEW.method IS DISTINCT FROM OLD.method
       OR NEW.anonymous IS DISTINCT FROM OLD.anonymous
       OR NEW.tx_ref IS DISTINCT FROM OLD.tx_ref
       OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
        RAISE EXCEPTION 'El aporte original es inmutable';
    END IF;

    IF NEW.status IS DISTINCT FROM OLD.status THEN
        IF OLD.status <> 'pendiente' OR NEW.status NOT IN ('verificado', 'rechazado') THEN
            RAISE EXCEPTION 'Un aporte revisado no cambia de estado';
        END IF;
        NEW.verified_by := v_actor;
        NEW.verified_at := NOW();
    ELSE
        NEW.verified_by := OLD.verified_by;
        NEW.verified_at := OLD.verified_at;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.sponsor_contribution_after_change()
RETURNS TRIGGER AS $$
DECLARE
    v_owner UUID;
    v_campaign public.sponsor_campaigns;
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM public.sponsor_campaign_recalc(OLD.campaign_id);
        RETURN NULL;
    END IF;

    PERFORM public.sponsor_campaign_recalc(NEW.campaign_id);
    SELECT * INTO v_campaign FROM public.sponsor_campaigns WHERE id = NEW.campaign_id;
    v_owner := public.sponsor_campaign_owner(NEW.campaign_id);

    IF TG_OP = 'INSERT' THEN
        PERFORM public.sponsor_notify(
            v_owner, 'donacion', 'Nuevo aporte pendiente de verificación',
            NEW.donor_name || ': ' || NEW.amount || ' ' || NEW.currency,
            '/sponsors/campana/' || NEW.campaign_id::TEXT
        );
    ELSIF NEW.status = 'verificado' AND OLD.status <> 'verificado' THEN
        PERFORM public.sponsor_award_points(NEW.user_id, 'donacion_verificada', NEW.id::TEXT, 'contribution');
        PERFORM public.sponsor_notify(
            NEW.user_id, 'donacion', 'Tu aporte fue verificado',
            'Gracias por apoyar "' || v_campaign.title || '".',
            '/sponsors/campana/' || NEW.campaign_id::TEXT
        );
        PERFORM public.sponsor_audit_log(
            auth.uid(), 'aporte_verificado', 'sponsor_campaign', NEW.campaign_id::TEXT,
            NEW.amount || ' ' || NEW.currency
        );
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ==============================================================================
-- RESEÑAS BILATERALES
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.sponsor_review_before_insert()
RETURNS TRIGGER AS $$
DECLARE
    v_agreement public.sponsor_agreements;
    v_role TEXT;
BEGIN
    SELECT * INTO v_agreement FROM public.sponsor_agreements WHERE id = NEW.agreement_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Acuerdo inexistente';
    END IF;
    IF v_agreement.status <> 'completado' THEN
        RAISE EXCEPTION 'Solo se reseñan colaboraciones completadas';
    END IF;
    IF auth.uid() IS NOT NULL AND NEW.from_id <> auth.uid() THEN
        RAISE EXCEPTION 'La reseña debe firmarse con tu cuenta';
    END IF;

    IF NEW.from_id = v_agreement.artist_id THEN
        v_role := 'artista';
    ELSIF public.sponsor_brand_owned_by(v_agreement.brand_id, NEW.from_id) THEN
        v_role := 'marca';
    ELSE
        RAISE EXCEPTION 'No formás parte de este acuerdo';
    END IF;

    NEW.from_role := v_role;
    NEW.brand_id := v_agreement.brand_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.sponsor_review_after_insert()
RETURNS TRIGGER AS $$
DECLARE
    v_target UUID;
    v_owner UUID;
BEGIN
    PERFORM set_config('sponsor.reputation_update', 'on', TRUE);

    UPDATE public.sponsor_brands b
    SET reputation_score = sub.avg_score,
        reputation_reviews = sub.total
    FROM (
        SELECT round(avg((seriousness + compliance + communication + quality) / 4.0)::NUMERIC, 1) AS avg_score,
               count(*) AS total
        FROM public.sponsor_reviews
        WHERE brand_id = NEW.brand_id
    ) sub
    WHERE b.id = NEW.brand_id;

    PERFORM set_config('sponsor.reputation_update', 'off', TRUE);

    PERFORM public.sponsor_award_points(NEW.from_id, 'resena', NEW.id::TEXT, 'review');

    SELECT owner_id INTO v_owner FROM public.sponsor_brands WHERE id = NEW.brand_id;
    v_target := CASE WHEN NEW.from_role = 'artista' THEN v_owner
                     ELSE (SELECT artist_id FROM public.sponsor_agreements WHERE id = NEW.agreement_id) END;

    PERFORM public.sponsor_notify(
        v_target, 'review', 'Recibiste una reseña',
        'Valoraron tu colaboración.', '/sponsors/panel'
    );
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.sponsor_opportunity_guard_update()
RETURNS TRIGGER AS $$
BEGIN
    IF auth.uid() IS NOT NULL AND NOT public.sponsor_is_admin(auth.uid())
       AND (NEW.brand_id IS DISTINCT FROM OLD.brand_id
            OR NEW.created_at IS DISTINCT FROM OLD.created_at) THEN
        RAISE EXCEPTION 'No se pueden alterar los datos base de la propuesta';
    END IF;

    NEW.applications_count := (
        SELECT count(*) FROM public.sponsor_applications a
        WHERE a.opportunity_id = OLD.id AND a.status NOT IN ('retirada', 'rechazada')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ==============================================================================
-- TRIGGERS
-- ==============================================================================

DROP TRIGGER IF EXISTS trg_sponsor_brands_touch ON public.sponsor_brands;
CREATE TRIGGER trg_sponsor_brands_touch
BEFORE INSERT OR UPDATE ON public.sponsor_brands
FOR EACH ROW EXECUTE FUNCTION public.sponsor_touch_updated_at();

DROP TRIGGER IF EXISTS trg_sponsor_brands_insert ON public.sponsor_brands;
CREATE TRIGGER trg_sponsor_brands_insert
BEFORE INSERT ON public.sponsor_brands
FOR EACH ROW EXECUTE FUNCTION public.sponsor_brand_before_insert();

DROP TRIGGER IF EXISTS trg_sponsor_brands_guard ON public.sponsor_brands;
CREATE TRIGGER trg_sponsor_brands_guard
BEFORE UPDATE ON public.sponsor_brands
FOR EACH ROW EXECUTE FUNCTION public.sponsor_brand_guard_update();

DROP TRIGGER IF EXISTS trg_sponsor_brands_after ON public.sponsor_brands;
CREATE TRIGGER trg_sponsor_brands_after
AFTER INSERT OR UPDATE ON public.sponsor_brands
FOR EACH ROW EXECUTE FUNCTION public.sponsor_brand_after_change();

DROP TRIGGER IF EXISTS trg_sponsor_opportunities_touch ON public.sponsor_opportunities;
CREATE TRIGGER trg_sponsor_opportunities_touch
BEFORE INSERT OR UPDATE ON public.sponsor_opportunities
FOR EACH ROW EXECUTE FUNCTION public.sponsor_touch_updated_at();

DROP TRIGGER IF EXISTS trg_sponsor_opportunities_guard ON public.sponsor_opportunities;
CREATE TRIGGER trg_sponsor_opportunities_guard
BEFORE UPDATE ON public.sponsor_opportunities
FOR EACH ROW EXECUTE FUNCTION public.sponsor_opportunity_guard_update();

DROP TRIGGER IF EXISTS trg_sponsor_applications_insert ON public.sponsor_applications;
CREATE TRIGGER trg_sponsor_applications_insert
BEFORE INSERT ON public.sponsor_applications
FOR EACH ROW EXECUTE FUNCTION public.sponsor_application_before_insert();

DROP TRIGGER IF EXISTS trg_sponsor_applications_touch ON public.sponsor_applications;
CREATE TRIGGER trg_sponsor_applications_touch
BEFORE UPDATE ON public.sponsor_applications
FOR EACH ROW EXECUTE FUNCTION public.sponsor_touch_updated_at();

DROP TRIGGER IF EXISTS trg_sponsor_applications_guard ON public.sponsor_applications;
CREATE TRIGGER trg_sponsor_applications_guard
BEFORE UPDATE ON public.sponsor_applications
FOR EACH ROW EXECUTE FUNCTION public.sponsor_application_guard_update();

DROP TRIGGER IF EXISTS trg_sponsor_applications_after ON public.sponsor_applications;
CREATE TRIGGER trg_sponsor_applications_after
AFTER INSERT OR UPDATE ON public.sponsor_applications
FOR EACH ROW EXECUTE FUNCTION public.sponsor_application_after_change();

DROP TRIGGER IF EXISTS trg_sponsor_applications_delete ON public.sponsor_applications;
CREATE TRIGGER trg_sponsor_applications_delete
AFTER DELETE ON public.sponsor_applications
FOR EACH ROW EXECUTE FUNCTION public.sponsor_application_after_delete();

DROP TRIGGER IF EXISTS trg_sponsor_agreements_insert ON public.sponsor_agreements;
CREATE TRIGGER trg_sponsor_agreements_insert
BEFORE INSERT ON public.sponsor_agreements
FOR EACH ROW EXECUTE FUNCTION public.sponsor_agreement_before_insert();

DROP TRIGGER IF EXISTS trg_sponsor_agreements_touch ON public.sponsor_agreements;
CREATE TRIGGER trg_sponsor_agreements_touch
BEFORE UPDATE ON public.sponsor_agreements
FOR EACH ROW EXECUTE FUNCTION public.sponsor_touch_updated_at();

DROP TRIGGER IF EXISTS trg_sponsor_agreements_guard ON public.sponsor_agreements;
CREATE TRIGGER trg_sponsor_agreements_guard
BEFORE UPDATE ON public.sponsor_agreements
FOR EACH ROW EXECUTE FUNCTION public.sponsor_agreement_guard_update();

DROP TRIGGER IF EXISTS trg_sponsor_agreements_after_insert ON public.sponsor_agreements;
CREATE TRIGGER trg_sponsor_agreements_after_insert
AFTER INSERT ON public.sponsor_agreements
FOR EACH ROW EXECUTE FUNCTION public.sponsor_agreement_after_insert();

DROP TRIGGER IF EXISTS trg_sponsor_agreements_after_update ON public.sponsor_agreements;
CREATE TRIGGER trg_sponsor_agreements_after_update
AFTER UPDATE ON public.sponsor_agreements
FOR EACH ROW EXECUTE FUNCTION public.sponsor_agreement_after_update();

DROP TRIGGER IF EXISTS trg_sponsor_counterparts_guard ON public.sponsor_counterparts;
CREATE TRIGGER trg_sponsor_counterparts_guard
BEFORE INSERT OR UPDATE ON public.sponsor_counterparts
FOR EACH ROW EXECUTE FUNCTION public.sponsor_counterpart_guard();

DROP TRIGGER IF EXISTS trg_sponsor_posts_touch ON public.sponsor_posts;
CREATE TRIGGER trg_sponsor_posts_touch
BEFORE INSERT OR UPDATE ON public.sponsor_posts
FOR EACH ROW EXECUTE FUNCTION public.sponsor_touch_updated_at();

DROP TRIGGER IF EXISTS trg_sponsor_posts_guard ON public.sponsor_posts;
CREATE TRIGGER trg_sponsor_posts_guard
BEFORE INSERT OR UPDATE ON public.sponsor_posts
FOR EACH ROW EXECUTE FUNCTION public.sponsor_post_before_change();

DROP TRIGGER IF EXISTS trg_sponsor_post_comments_after ON public.sponsor_post_comments;
CREATE TRIGGER trg_sponsor_post_comments_after
AFTER INSERT ON public.sponsor_post_comments
FOR EACH ROW EXECUTE FUNCTION public.sponsor_comment_after_insert();

DROP TRIGGER IF EXISTS trg_sponsor_sweepstakes_touch ON public.sponsor_sweepstakes;
CREATE TRIGGER trg_sponsor_sweepstakes_touch
BEFORE INSERT OR UPDATE ON public.sponsor_sweepstakes
FOR EACH ROW EXECUTE FUNCTION public.sponsor_touch_updated_at();

DROP TRIGGER IF EXISTS trg_sponsor_sweepstakes_insert ON public.sponsor_sweepstakes;
CREATE TRIGGER trg_sponsor_sweepstakes_insert
BEFORE INSERT ON public.sponsor_sweepstakes
FOR EACH ROW EXECUTE FUNCTION public.sponsor_sweepstake_before_insert();

DROP TRIGGER IF EXISTS trg_sponsor_sweepstakes_guard ON public.sponsor_sweepstakes;
CREATE TRIGGER trg_sponsor_sweepstakes_guard
BEFORE UPDATE ON public.sponsor_sweepstakes
FOR EACH ROW EXECUTE FUNCTION public.sponsor_sweepstake_guard_update();

DROP TRIGGER IF EXISTS trg_sponsor_sweepstake_secrets_guard ON public.sponsor_sweepstake_secrets;
CREATE TRIGGER trg_sponsor_sweepstake_secrets_guard
BEFORE INSERT OR UPDATE ON public.sponsor_sweepstake_secrets
FOR EACH ROW EXECUTE FUNCTION public.sponsor_sweepstake_secret_guard();

DROP TRIGGER IF EXISTS trg_sponsor_participations_insert ON public.sponsor_sweepstake_participations;
CREATE TRIGGER trg_sponsor_participations_insert
BEFORE INSERT ON public.sponsor_sweepstake_participations
FOR EACH ROW EXECUTE FUNCTION public.sponsor_participation_before_insert();

DROP TRIGGER IF EXISTS trg_sponsor_participations_after ON public.sponsor_sweepstake_participations;
CREATE TRIGGER trg_sponsor_participations_after
AFTER INSERT ON public.sponsor_sweepstake_participations
FOR EACH ROW EXECUTE FUNCTION public.sponsor_participation_after_insert();

DROP TRIGGER IF EXISTS trg_sponsor_challenges_touch ON public.sponsor_challenges;
CREATE TRIGGER trg_sponsor_challenges_touch
BEFORE UPDATE ON public.sponsor_challenges
FOR EACH ROW EXECUTE FUNCTION public.sponsor_touch_updated_at();

DROP TRIGGER IF EXISTS trg_sponsor_challenges_guard ON public.sponsor_challenges;
CREATE TRIGGER trg_sponsor_challenges_guard
BEFORE UPDATE ON public.sponsor_challenges
FOR EACH ROW EXECUTE FUNCTION public.sponsor_challenge_guard_update();

DROP TRIGGER IF EXISTS trg_sponsor_challenges_after ON public.sponsor_challenges;
CREATE TRIGGER trg_sponsor_challenges_after
AFTER UPDATE ON public.sponsor_challenges
FOR EACH ROW EXECUTE FUNCTION public.sponsor_challenge_after_update();

DROP TRIGGER IF EXISTS trg_sponsor_entries_insert ON public.sponsor_challenge_entries;
CREATE TRIGGER trg_sponsor_entries_insert
BEFORE INSERT ON public.sponsor_challenge_entries
FOR EACH ROW EXECUTE FUNCTION public.sponsor_challenge_entry_before_insert();

DROP TRIGGER IF EXISTS trg_sponsor_entries_after ON public.sponsor_challenge_entries;
CREATE TRIGGER trg_sponsor_entries_after
AFTER INSERT ON public.sponsor_challenge_entries
FOR EACH ROW EXECUTE FUNCTION public.sponsor_challenge_entry_after_insert();

DROP TRIGGER IF EXISTS trg_sponsor_votes_insert ON public.sponsor_challenge_votes;
CREATE TRIGGER trg_sponsor_votes_insert
BEFORE INSERT ON public.sponsor_challenge_votes
FOR EACH ROW EXECUTE FUNCTION public.sponsor_challenge_vote_before_insert();

DROP TRIGGER IF EXISTS trg_sponsor_prizes_touch ON public.sponsor_prizes;
CREATE TRIGGER trg_sponsor_prizes_touch
BEFORE UPDATE ON public.sponsor_prizes
FOR EACH ROW EXECUTE FUNCTION public.sponsor_touch_updated_at();

DROP TRIGGER IF EXISTS trg_sponsor_prizes_guard ON public.sponsor_prizes;
CREATE TRIGGER trg_sponsor_prizes_guard
BEFORE UPDATE ON public.sponsor_prizes
FOR EACH ROW EXECUTE FUNCTION public.sponsor_prize_guard_update();

DROP TRIGGER IF EXISTS trg_sponsor_prize_delivery_after ON public.sponsor_prize_delivery;
CREATE TRIGGER trg_sponsor_prize_delivery_after
AFTER INSERT ON public.sponsor_prize_delivery
FOR EACH ROW EXECUTE FUNCTION public.sponsor_prize_delivery_after_insert();

DROP TRIGGER IF EXISTS trg_sponsor_campaigns_touch ON public.sponsor_campaigns;
CREATE TRIGGER trg_sponsor_campaigns_touch
BEFORE UPDATE ON public.sponsor_campaigns
FOR EACH ROW EXECUTE FUNCTION public.sponsor_touch_updated_at();

DROP TRIGGER IF EXISTS trg_sponsor_campaigns_insert ON public.sponsor_campaigns;
CREATE TRIGGER trg_sponsor_campaigns_insert
BEFORE INSERT ON public.sponsor_campaigns
FOR EACH ROW EXECUTE FUNCTION public.sponsor_campaign_before_insert();

DROP TRIGGER IF EXISTS trg_sponsor_campaigns_guard ON public.sponsor_campaigns;
CREATE TRIGGER trg_sponsor_campaigns_guard
BEFORE UPDATE ON public.sponsor_campaigns
FOR EACH ROW EXECUTE FUNCTION public.sponsor_campaign_guard_update();

DROP TRIGGER IF EXISTS trg_sponsor_contributions_touch ON public.sponsor_campaign_contributions;
CREATE TRIGGER trg_sponsor_contributions_touch
BEFORE UPDATE ON public.sponsor_campaign_contributions
FOR EACH ROW EXECUTE FUNCTION public.sponsor_touch_updated_at();

DROP TRIGGER IF EXISTS trg_sponsor_contributions_insert ON public.sponsor_campaign_contributions;
CREATE TRIGGER trg_sponsor_contributions_insert
BEFORE INSERT ON public.sponsor_campaign_contributions
FOR EACH ROW EXECUTE FUNCTION public.sponsor_contribution_before_insert();

DROP TRIGGER IF EXISTS trg_sponsor_contributions_guard ON public.sponsor_campaign_contributions;
CREATE TRIGGER trg_sponsor_contributions_guard
BEFORE UPDATE ON public.sponsor_campaign_contributions
FOR EACH ROW EXECUTE FUNCTION public.sponsor_contribution_guard_update();

DROP TRIGGER IF EXISTS trg_sponsor_contributions_after ON public.sponsor_campaign_contributions;
CREATE TRIGGER trg_sponsor_contributions_after
AFTER INSERT OR UPDATE ON public.sponsor_campaign_contributions
FOR EACH ROW EXECUTE FUNCTION public.sponsor_contribution_after_change();

DROP TRIGGER IF EXISTS trg_sponsor_contributions_delete ON public.sponsor_campaign_contributions;
CREATE TRIGGER trg_sponsor_contributions_delete
AFTER DELETE ON public.sponsor_campaign_contributions
FOR EACH ROW EXECUTE FUNCTION public.sponsor_contribution_after_change();

DROP TRIGGER IF EXISTS trg_sponsor_reviews_insert ON public.sponsor_reviews;
CREATE TRIGGER trg_sponsor_reviews_insert
BEFORE INSERT ON public.sponsor_reviews
FOR EACH ROW EXECUTE FUNCTION public.sponsor_review_before_insert();

DROP TRIGGER IF EXISTS trg_sponsor_reviews_after ON public.sponsor_reviews;
CREATE TRIGGER trg_sponsor_reviews_after
AFTER INSERT ON public.sponsor_reviews
FOR EACH ROW EXECUTE FUNCTION public.sponsor_review_after_insert();

-- ==============================================================================
-- ROW LEVEL SECURITY
-- ==============================================================================

ALTER TABLE public.sponsor_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsor_brand_followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsor_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsor_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsor_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsor_agreement_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsor_counterparts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsor_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsor_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsor_post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsor_sweepstakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsor_sweepstake_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsor_sweepstake_participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsor_sweepstake_winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsor_sweepstake_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsor_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsor_challenge_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsor_challenge_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsor_prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsor_prize_delivery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsor_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsor_campaign_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsor_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsor_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsor_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsor_audit ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- MARCAS
-- ------------------------------------------------------------------------------

CREATE POLICY "sponsor_brands_public_read"
ON public.sponsor_brands FOR SELECT TO anon, authenticated
USING (
    verification IN ('pendiente', 'verificada')
    OR owner_id = auth.uid()
    OR public.sponsor_is_admin(auth.uid())
);

CREATE POLICY "sponsor_brands_owner_insert"
ON public.sponsor_brands FOR INSERT TO authenticated
WITH CHECK (owner_id = auth.uid() OR public.sponsor_is_admin(auth.uid()));

CREATE POLICY "sponsor_brands_owner_update"
ON public.sponsor_brands FOR UPDATE TO authenticated
USING (owner_id = auth.uid() OR public.sponsor_is_admin(auth.uid()))
WITH CHECK (owner_id = auth.uid() OR public.sponsor_is_admin(auth.uid()));

CREATE POLICY "sponsor_brands_owner_delete"
ON public.sponsor_brands FOR DELETE TO authenticated
USING (owner_id = auth.uid() OR public.sponsor_is_admin(auth.uid()));

CREATE POLICY "sponsor_brand_followers_public_read"
ON public.sponsor_brand_followers FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "sponsor_brand_followers_own_insert"
ON public.sponsor_brand_followers FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "sponsor_brand_followers_own_delete"
ON public.sponsor_brand_followers FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- ------------------------------------------------------------------------------
-- OPORTUNIDADES
-- ------------------------------------------------------------------------------

CREATE POLICY "sponsor_opportunities_public_read"
ON public.sponsor_opportunities FOR SELECT TO anon, authenticated
USING (
    status = 'abierta'
    OR public.sponsor_brand_owned_by(brand_id, auth.uid())
    OR public.sponsor_is_admin(auth.uid())
);

CREATE POLICY "sponsor_opportunities_brand_insert"
ON public.sponsor_opportunities FOR INSERT TO authenticated
WITH CHECK (public.sponsor_brand_owned_by(brand_id, auth.uid()) OR public.sponsor_is_admin(auth.uid()));

CREATE POLICY "sponsor_opportunities_brand_update"
ON public.sponsor_opportunities FOR UPDATE TO authenticated
USING (public.sponsor_brand_owned_by(brand_id, auth.uid()) OR public.sponsor_is_admin(auth.uid()))
WITH CHECK (public.sponsor_brand_owned_by(brand_id, auth.uid()) OR public.sponsor_is_admin(auth.uid()));

CREATE POLICY "sponsor_opportunities_brand_delete"
ON public.sponsor_opportunities FOR DELETE TO authenticated
USING (public.sponsor_brand_owned_by(brand_id, auth.uid()) OR public.sponsor_is_admin(auth.uid()));

-- ------------------------------------------------------------------------------
-- POSTULACIONES
-- ------------------------------------------------------------------------------

CREATE POLICY "sponsor_applications_read"
ON public.sponsor_applications FOR SELECT TO authenticated
USING (
    artist_id = auth.uid()
    OR public.sponsor_brand_owned_by(brand_id, auth.uid())
    OR public.sponsor_is_admin(auth.uid())
);

CREATE POLICY "sponsor_applications_artist_insert"
ON public.sponsor_applications FOR INSERT TO authenticated
WITH CHECK (artist_id = auth.uid());

CREATE POLICY "sponsor_applications_participant_update"
ON public.sponsor_applications FOR UPDATE TO authenticated
USING (
    artist_id = auth.uid()
    OR public.sponsor_brand_owned_by(brand_id, auth.uid())
    OR public.sponsor_is_admin(auth.uid())
)
WITH CHECK (
    artist_id = auth.uid()
    OR public.sponsor_brand_owned_by(brand_id, auth.uid())
    OR public.sponsor_is_admin(auth.uid())
);

CREATE POLICY "sponsor_applications_admin_delete"
ON public.sponsor_applications FOR DELETE TO authenticated
USING (public.sponsor_is_admin(auth.uid()));

-- ------------------------------------------------------------------------------
-- ACUERDOS Y CONTRAPRESTACIONES
-- ------------------------------------------------------------------------------

CREATE POLICY "sponsor_agreements_read"
ON public.sponsor_agreements FOR SELECT TO authenticated
USING (
    artist_id = auth.uid()
    OR public.sponsor_brand_owned_by(brand_id, auth.uid())
    OR public.sponsor_is_admin(auth.uid())
);

CREATE POLICY "sponsor_agreements_insert"
ON public.sponsor_agreements FOR INSERT TO authenticated
WITH CHECK (
    public.sponsor_is_admin(auth.uid())
    OR public.sponsor_brand_owned_by(brand_id, auth.uid())
    OR (
        artist_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.sponsor_applications a
            WHERE a.id = sponsor_agreements.application_id
              AND a.artist_id = sponsor_agreements.artist_id
              AND a.brand_id = sponsor_agreements.brand_id
              AND a.status IN ('oferta', 'aceptada')
        )
    )
);

CREATE POLICY "sponsor_agreements_participant_update"
ON public.sponsor_agreements FOR UPDATE TO authenticated
USING (
    artist_id = auth.uid()
    OR public.sponsor_brand_owned_by(brand_id, auth.uid())
    OR public.sponsor_is_admin(auth.uid())
)
WITH CHECK (
    artist_id = auth.uid()
    OR public.sponsor_brand_owned_by(brand_id, auth.uid())
    OR public.sponsor_is_admin(auth.uid())
);

CREATE POLICY "sponsor_agreements_admin_delete"
ON public.sponsor_agreements FOR DELETE TO authenticated
USING (public.sponsor_is_admin(auth.uid()));

CREATE POLICY "sponsor_agreement_history_read"
ON public.sponsor_agreement_history FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.sponsor_agreements a
        WHERE a.id = sponsor_agreement_history.agreement_id
          AND (a.artist_id = auth.uid()
               OR public.sponsor_brand_owned_by(a.brand_id, auth.uid())
               OR public.sponsor_is_admin(auth.uid()))
    )
);

CREATE POLICY "sponsor_agreement_history_insert"
ON public.sponsor_agreement_history FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.sponsor_agreements a
        WHERE a.id = sponsor_agreement_history.agreement_id
          AND (a.artist_id = auth.uid()
               OR public.sponsor_brand_owned_by(a.brand_id, auth.uid())
               OR public.sponsor_is_admin(auth.uid()))
    )
);

CREATE POLICY "sponsor_counterparts_read"
ON public.sponsor_counterparts FOR SELECT TO anon, authenticated
USING (
    public.sponsor_is_admin(auth.uid())
    OR (opportunity_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.sponsor_opportunities o
        WHERE o.id = sponsor_counterparts.opportunity_id
          AND (o.status = 'abierta' OR public.sponsor_brand_owned_by(o.brand_id, auth.uid()))
    ))
    OR (agreement_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.sponsor_agreements a
        WHERE a.id = sponsor_counterparts.agreement_id
          AND (a.artist_id = auth.uid()
               OR public.sponsor_brand_owned_by(a.brand_id, auth.uid())
               OR public.sponsor_is_admin(auth.uid()))
    ))
);

CREATE POLICY "sponsor_counterparts_insert"
ON public.sponsor_counterparts FOR INSERT TO authenticated
WITH CHECK (
    public.sponsor_is_admin(auth.uid())
    OR (opportunity_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.sponsor_opportunities o
        WHERE o.id = sponsor_counterparts.opportunity_id
          AND public.sponsor_brand_owned_by(o.brand_id, auth.uid())
    ))
    OR (agreement_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.sponsor_agreements a
        WHERE a.id = sponsor_counterparts.agreement_id
          AND (a.artist_id = auth.uid()
               OR public.sponsor_brand_owned_by(a.brand_id, auth.uid()))
    ))
);

CREATE POLICY "sponsor_counterparts_update"
ON public.sponsor_counterparts FOR UPDATE TO authenticated
USING (
    public.sponsor_is_admin(auth.uid())
    OR (opportunity_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.sponsor_opportunities o
        WHERE o.id = sponsor_counterparts.opportunity_id
          AND public.sponsor_brand_owned_by(o.brand_id, auth.uid())
    ))
    OR (agreement_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.sponsor_agreements a
        WHERE a.id = sponsor_counterparts.agreement_id
          AND (a.artist_id = auth.uid()
               OR public.sponsor_brand_owned_by(a.brand_id, auth.uid()))
    ))
)
WITH CHECK (
    public.sponsor_is_admin(auth.uid())
    OR (opportunity_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.sponsor_opportunities o
        WHERE o.id = sponsor_counterparts.opportunity_id
          AND public.sponsor_brand_owned_by(o.brand_id, auth.uid())
    ))
    OR (agreement_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.sponsor_agreements a
        WHERE a.id = sponsor_counterparts.agreement_id
          AND (a.artist_id = auth.uid()
               OR public.sponsor_brand_owned_by(a.brand_id, auth.uid()))
    ))
);

CREATE POLICY "sponsor_counterparts_delete"
ON public.sponsor_counterparts FOR DELETE TO authenticated
USING (
    public.sponsor_is_admin(auth.uid())
    OR (opportunity_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.sponsor_opportunities o
        WHERE o.id = sponsor_counterparts.opportunity_id
          AND public.sponsor_brand_owned_by(o.brand_id, auth.uid())
    ))
    OR (agreement_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.sponsor_agreements a
        WHERE a.id = sponsor_counterparts.agreement_id
          AND public.sponsor_brand_owned_by(a.brand_id, auth.uid())
    ))
);

-- ------------------------------------------------------------------------------
-- PUBLICACIONES
-- ------------------------------------------------------------------------------

CREATE POLICY "sponsor_posts_public_read"
ON public.sponsor_posts FOR SELECT TO anon, authenticated
USING (
    NOT is_hidden
    OR author_id = auth.uid()
    OR (brand_id IS NOT NULL AND public.sponsor_brand_owned_by(brand_id, auth.uid()))
    OR public.sponsor_is_admin(auth.uid())
);

CREATE POLICY "sponsor_posts_author_insert"
ON public.sponsor_posts FOR INSERT TO authenticated
WITH CHECK (
    author_id = auth.uid()
    AND (brand_id IS NULL OR public.sponsor_brand_owned_by(brand_id, auth.uid())
         OR public.sponsor_is_admin(auth.uid()))
);

CREATE POLICY "sponsor_posts_manager_update"
ON public.sponsor_posts FOR UPDATE TO authenticated
USING (
    author_id = auth.uid()
    OR (brand_id IS NOT NULL AND public.sponsor_brand_owned_by(brand_id, auth.uid()))
    OR public.sponsor_is_admin(auth.uid())
)
WITH CHECK (
    author_id = auth.uid()
    OR (brand_id IS NOT NULL AND public.sponsor_brand_owned_by(brand_id, auth.uid()))
    OR public.sponsor_is_admin(auth.uid())
);

CREATE POLICY "sponsor_posts_manager_delete"
ON public.sponsor_posts FOR DELETE TO authenticated
USING (
    author_id = auth.uid()
    OR (brand_id IS NOT NULL AND public.sponsor_brand_owned_by(brand_id, auth.uid()))
    OR public.sponsor_is_admin(auth.uid())
);

CREATE POLICY "sponsor_post_likes_public_read"
ON public.sponsor_post_likes FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "sponsor_post_likes_own_insert"
ON public.sponsor_post_likes FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "sponsor_post_likes_own_delete"
ON public.sponsor_post_likes FOR DELETE TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "sponsor_post_comments_read"
ON public.sponsor_post_comments FOR SELECT TO anon, authenticated
USING (
    (NOT is_hidden AND EXISTS (
        SELECT 1 FROM public.sponsor_posts p
        WHERE p.id = sponsor_post_comments.post_id
          AND (NOT p.is_hidden
               OR p.author_id = auth.uid()
               OR (p.brand_id IS NOT NULL AND public.sponsor_brand_owned_by(p.brand_id, auth.uid()))
               OR public.sponsor_is_admin(auth.uid()))
    ))
    OR user_id = auth.uid()
    OR public.sponsor_is_admin(auth.uid())
);

CREATE POLICY "sponsor_post_comments_own_insert"
ON public.sponsor_post_comments FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "sponsor_post_comments_own_delete"
ON public.sponsor_post_comments FOR DELETE TO authenticated
USING (user_id = auth.uid() OR public.sponsor_is_admin(auth.uid()));

-- ------------------------------------------------------------------------------
-- SORTEOS
-- ------------------------------------------------------------------------------

CREATE POLICY "sponsor_sweepstakes_public_read"
ON public.sponsor_sweepstakes FOR SELECT TO anon, authenticated
USING (
    status IN ('activo', 'cerrado', 'sorteado')
    OR public.sponsor_brand_owned_by(brand_id, auth.uid())
    OR public.sponsor_is_admin(auth.uid())
);

CREATE POLICY "sponsor_sweepstakes_brand_insert"
ON public.sponsor_sweepstakes FOR INSERT TO authenticated
WITH CHECK (public.sponsor_brand_owned_by(brand_id, auth.uid()) OR public.sponsor_is_admin(auth.uid()));

CREATE POLICY "sponsor_sweepstakes_brand_update"
ON public.sponsor_sweepstakes FOR UPDATE TO authenticated
USING (public.sponsor_brand_owned_by(brand_id, auth.uid()) OR public.sponsor_is_admin(auth.uid()))
WITH CHECK (public.sponsor_brand_owned_by(brand_id, auth.uid()) OR public.sponsor_is_admin(auth.uid()));

CREATE POLICY "sponsor_sweepstakes_brand_delete"
ON public.sponsor_sweepstakes FOR DELETE TO authenticated
USING (public.sponsor_brand_owned_by(brand_id, auth.uid()) OR public.sponsor_is_admin(auth.uid()));

CREATE POLICY "sponsor_sweepstake_secrets_read"
ON public.sponsor_sweepstake_secrets FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.sponsor_sweepstakes s
        WHERE s.id = sponsor_sweepstake_secrets.sweepstake_id
          AND (public.sponsor_brand_owned_by(s.brand_id, auth.uid())
               OR public.sponsor_is_admin(auth.uid()))
    )
);

CREATE POLICY "sponsor_sweepstake_secrets_write"
ON public.sponsor_sweepstake_secrets FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.sponsor_sweepstakes s
        WHERE s.id = sponsor_sweepstake_secrets.sweepstake_id
          AND (public.sponsor_brand_owned_by(s.brand_id, auth.uid())
               OR public.sponsor_is_admin(auth.uid()))
    )
);

CREATE POLICY "sponsor_sweepstake_secrets_update"
ON public.sponsor_sweepstake_secrets FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.sponsor_sweepstakes s
        WHERE s.id = sponsor_sweepstake_secrets.sweepstake_id
          AND (public.sponsor_brand_owned_by(s.brand_id, auth.uid())
               OR public.sponsor_is_admin(auth.uid()))
    )
);

CREATE POLICY "sponsor_sweepstake_secrets_delete"
ON public.sponsor_sweepstake_secrets FOR DELETE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.sponsor_sweepstakes s
        WHERE s.id = sponsor_sweepstake_secrets.sweepstake_id
          AND (public.sponsor_brand_owned_by(s.brand_id, auth.uid())
               OR public.sponsor_is_admin(auth.uid()))
    )
);

CREATE POLICY "sponsor_sweepstake_participations_read"
ON public.sponsor_sweepstake_participations FOR SELECT TO authenticated
USING (
    user_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM public.sponsor_sweepstakes s
        WHERE s.id = sponsor_sweepstake_participations.sweepstake_id
          AND (public.sponsor_brand_owned_by(s.brand_id, auth.uid())
               OR public.sponsor_is_admin(auth.uid()))
    )
);

CREATE POLICY "sponsor_sweepstake_participations_insert"
ON public.sponsor_sweepstake_participations FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "sponsor_sweepstake_winners_read"
ON public.sponsor_sweepstake_winners FOR SELECT TO anon, authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.sponsor_sweepstakes s
        WHERE s.id = sponsor_sweepstake_winners.sweepstake_id
          AND (s.status = 'sorteado'
               OR public.sponsor_brand_owned_by(s.brand_id, auth.uid())
               OR public.sponsor_is_admin(auth.uid()))
    )
);

CREATE POLICY "sponsor_sweepstake_audit_read"
ON public.sponsor_sweepstake_audit FOR SELECT TO anon, authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.sponsor_sweepstakes s
        WHERE s.id = sponsor_sweepstake_audit.sweepstake_id
          AND (s.status IN ('activo', 'cerrado', 'sorteado')
               OR public.sponsor_brand_owned_by(s.brand_id, auth.uid())
               OR public.sponsor_is_admin(auth.uid()))
    )
);

-- ------------------------------------------------------------------------------
-- DESAFÍOS
-- ------------------------------------------------------------------------------

CREATE POLICY "sponsor_challenges_public_read"
ON public.sponsor_challenges FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "sponsor_challenges_brand_insert"
ON public.sponsor_challenges FOR INSERT TO authenticated
WITH CHECK (public.sponsor_brand_owned_by(brand_id, auth.uid()) OR public.sponsor_is_admin(auth.uid()));

CREATE POLICY "sponsor_challenges_brand_update"
ON public.sponsor_challenges FOR UPDATE TO authenticated
USING (public.sponsor_brand_owned_by(brand_id, auth.uid()) OR public.sponsor_is_admin(auth.uid()))
WITH CHECK (public.sponsor_brand_owned_by(brand_id, auth.uid()) OR public.sponsor_is_admin(auth.uid()));

CREATE POLICY "sponsor_challenges_brand_delete"
ON public.sponsor_challenges FOR DELETE TO authenticated
USING (public.sponsor_brand_owned_by(brand_id, auth.uid()) OR public.sponsor_is_admin(auth.uid()));

CREATE POLICY "sponsor_challenge_entries_public_read"
ON public.sponsor_challenge_entries FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "sponsor_challenge_entries_own_insert"
ON public.sponsor_challenge_entries FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "sponsor_challenge_entries_own_delete"
ON public.sponsor_challenge_entries FOR DELETE TO authenticated
USING (
    (user_id = auth.uid() AND EXISTS (
        SELECT 1 FROM public.sponsor_challenges c
        WHERE c.id = sponsor_challenge_entries.challenge_id AND c.status = 'abierto'
    ))
    OR public.sponsor_is_admin(auth.uid())
    OR EXISTS (
        SELECT 1 FROM public.sponsor_challenges c
        WHERE c.id = sponsor_challenge_entries.challenge_id
          AND public.sponsor_brand_owned_by(c.brand_id, auth.uid())
    )
);

CREATE POLICY "sponsor_challenge_votes_public_read"
ON public.sponsor_challenge_votes FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "sponsor_challenge_votes_own_insert"
ON public.sponsor_challenge_votes FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "sponsor_challenge_votes_own_delete"
ON public.sponsor_challenge_votes FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- ------------------------------------------------------------------------------
-- PREMIOS
-- ------------------------------------------------------------------------------

CREATE POLICY "sponsor_prizes_public_read"
ON public.sponsor_prizes FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "sponsor_prizes_brand_insert"
ON public.sponsor_prizes FOR INSERT TO authenticated
WITH CHECK (public.sponsor_brand_owned_by(brand_id, auth.uid()) OR public.sponsor_is_admin(auth.uid()));

CREATE POLICY "sponsor_prizes_brand_update"
ON public.sponsor_prizes FOR UPDATE TO authenticated
USING (public.sponsor_brand_owned_by(brand_id, auth.uid()) OR public.sponsor_is_admin(auth.uid()))
WITH CHECK (public.sponsor_brand_owned_by(brand_id, auth.uid()) OR public.sponsor_is_admin(auth.uid()));

CREATE POLICY "sponsor_prizes_admin_delete"
ON public.sponsor_prizes FOR DELETE TO authenticated
USING (public.sponsor_is_admin(auth.uid()));

CREATE POLICY "sponsor_prize_delivery_read"
ON public.sponsor_prize_delivery FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.sponsor_prizes p
        WHERE p.id = sponsor_prize_delivery.prize_id
          AND (p.winner_user_id = auth.uid()
               OR public.sponsor_brand_owned_by(p.brand_id, auth.uid())
               OR public.sponsor_is_admin(auth.uid()))
    )
);

CREATE POLICY "sponsor_prize_delivery_brand_insert"
ON public.sponsor_prize_delivery FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.sponsor_prizes p
        WHERE p.id = sponsor_prize_delivery.prize_id
          AND (public.sponsor_brand_owned_by(p.brand_id, auth.uid())
               OR public.sponsor_is_admin(auth.uid()))
    )
);

CREATE POLICY "sponsor_prize_delivery_admin_delete"
ON public.sponsor_prize_delivery FOR DELETE TO authenticated
USING (public.sponsor_is_admin(auth.uid()));

-- ------------------------------------------------------------------------------
-- CAMPAÑAS Y APORTES
-- ------------------------------------------------------------------------------

CREATE POLICY "sponsor_campaigns_public_read"
ON public.sponsor_campaigns FOR SELECT TO anon, authenticated
USING (
    status = 'activa'
    OR owner_id = auth.uid()
    OR public.sponsor_brand_owned_by(brand_id, auth.uid())
    OR public.sponsor_is_admin(auth.uid())
);

CREATE POLICY "sponsor_campaigns_owner_insert"
ON public.sponsor_campaigns FOR INSERT TO authenticated
WITH CHECK (
    owner_id = auth.uid()
    AND (brand_id IS NULL OR public.sponsor_brand_owned_by(brand_id, auth.uid()))
);

CREATE POLICY "sponsor_campaigns_owner_update"
ON public.sponsor_campaigns FOR UPDATE TO authenticated
USING (
    owner_id = auth.uid()
    OR public.sponsor_brand_owned_by(brand_id, auth.uid())
    OR public.sponsor_is_admin(auth.uid())
)
WITH CHECK (
    owner_id = auth.uid()
    OR public.sponsor_brand_owned_by(brand_id, auth.uid())
    OR public.sponsor_is_admin(auth.uid())
);

CREATE POLICY "sponsor_campaigns_owner_delete"
ON public.sponsor_campaigns FOR DELETE TO authenticated
USING (
    owner_id = auth.uid()
    OR public.sponsor_brand_owned_by(brand_id, auth.uid())
    OR public.sponsor_is_admin(auth.uid())
);

CREATE POLICY "sponsor_contributions_private_read"
ON public.sponsor_campaign_contributions FOR SELECT TO authenticated
USING (
    user_id = auth.uid()
    OR public.sponsor_campaign_owner(campaign_id) = auth.uid()
    OR public.sponsor_is_admin(auth.uid())
);

CREATE POLICY "sponsor_contributions_pending_insert"
ON public.sponsor_campaign_contributions FOR INSERT TO anon, authenticated
WITH CHECK (
    status = 'pendiente'
    AND (user_id IS NULL OR user_id = auth.uid())
);

CREATE POLICY "sponsor_contributions_owner_update"
ON public.sponsor_campaign_contributions FOR UPDATE TO authenticated
USING (
    public.sponsor_campaign_owner(campaign_id) = auth.uid()
    OR public.sponsor_is_admin(auth.uid())
)
WITH CHECK (
    public.sponsor_campaign_owner(campaign_id) = auth.uid()
    OR public.sponsor_is_admin(auth.uid())
);

CREATE POLICY "sponsor_contributions_owner_delete"
ON public.sponsor_campaign_contributions FOR DELETE TO authenticated
USING (
    (user_id = auth.uid() AND status = 'pendiente')
    OR public.sponsor_campaign_owner(campaign_id) = auth.uid()
    OR public.sponsor_is_admin(auth.uid())
);

-- ------------------------------------------------------------------------------
-- PUNTOS, RESEÑAS, NOTIFICACIONES Y AUDITORÍA
-- ------------------------------------------------------------------------------

CREATE POLICY "sponsor_points_own_read"
ON public.sponsor_points FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.sponsor_is_admin(auth.uid()));

CREATE POLICY "sponsor_reviews_public_read"
ON public.sponsor_reviews FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "sponsor_reviews_own_insert"
ON public.sponsor_reviews FOR INSERT TO authenticated
WITH CHECK (from_id = auth.uid());

CREATE POLICY "sponsor_reviews_admin_update"
ON public.sponsor_reviews FOR UPDATE TO authenticated
USING (public.sponsor_is_admin(auth.uid()));

CREATE POLICY "sponsor_reviews_admin_delete"
ON public.sponsor_reviews FOR DELETE TO authenticated
USING (public.sponsor_is_admin(auth.uid()));

CREATE POLICY "sponsor_notifications_own_read"
ON public.sponsor_notifications FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "sponsor_notifications_own_update"
ON public.sponsor_notifications FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "sponsor_notifications_own_delete"
ON public.sponsor_notifications FOR DELETE TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "sponsor_audit_admin_read"
ON public.sponsor_audit FOR SELECT TO authenticated
USING (public.sponsor_is_admin(auth.uid()));

-- ==============================================================================
-- PERMISOS
-- ==============================================================================

GRANT SELECT ON public.sponsor_brands TO anon;
GRANT SELECT ON public.sponsor_brand_followers TO anon;
GRANT SELECT ON public.sponsor_opportunities TO anon;
GRANT SELECT ON public.sponsor_counterparts TO anon;
GRANT SELECT ON public.sponsor_posts TO anon;
GRANT SELECT ON public.sponsor_post_likes TO anon;
GRANT SELECT ON public.sponsor_post_comments TO anon;
GRANT SELECT ON public.sponsor_sweepstakes TO anon;
GRANT SELECT ON public.sponsor_sweepstake_winners TO anon;
GRANT SELECT ON public.sponsor_sweepstake_audit TO anon;
GRANT SELECT ON public.sponsor_challenges TO anon;
GRANT SELECT ON public.sponsor_challenge_entries TO anon;
GRANT SELECT ON public.sponsor_challenge_votes TO anon;
GRANT SELECT ON public.sponsor_prizes TO anon;
GRANT SELECT ON public.sponsor_campaigns TO anon;
GRANT SELECT ON public.sponsor_reviews TO anon;
GRANT SELECT ON public.sponsor_campaign_contributions_public TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sponsor_brands TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sponsor_brand_followers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sponsor_opportunities TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sponsor_applications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sponsor_agreements TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sponsor_agreement_history TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sponsor_counterparts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sponsor_posts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sponsor_post_likes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sponsor_post_comments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sponsor_sweepstakes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sponsor_sweepstake_secrets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sponsor_sweepstake_participations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sponsor_challenges TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sponsor_challenge_entries TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sponsor_challenge_votes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sponsor_prizes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sponsor_prize_delivery TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sponsor_campaigns TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sponsor_campaign_contributions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sponsor_reviews TO authenticated;
GRANT SELECT ON public.sponsor_sweepstake_winners TO authenticated;
GRANT SELECT ON public.sponsor_sweepstake_audit TO authenticated;
GRANT SELECT ON public.sponsor_points TO authenticated;
GRANT SELECT, UPDATE, DELETE ON public.sponsor_notifications TO authenticated;
GRANT SELECT ON public.sponsor_audit TO authenticated;
GRANT SELECT ON public.sponsor_campaign_contributions_public TO authenticated;

-- Funciones internas: no se ejecutan desde el cliente.
REVOKE EXECUTE ON FUNCTION public.sponsor_award_points(UUID, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sponsor_notify(UUID, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sponsor_audit_log(UUID, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sponsor_campaign_recalc(UUID) FROM PUBLIC;

-- Sorteo seguro: solo usuarios autenticados (la función valida pertenencia).
REVOKE EXECUTE ON FUNCTION public.sponsor_draw_sweepstake(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sponsor_draw_sweepstake(UUID) TO authenticated;

-- Compartir publicación es público y atómico.
REVOKE EXECUTE ON FUNCTION public.sponsor_register_share(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sponsor_register_share(UUID) TO anon, authenticated;

-- ==============================================================================
-- NOTAS DE MIGRACIÓN
-- ==============================================================================
-- * runtime localStorage: larvaz_sponsors_v1 (src/lib/sponsors/store.ts).
-- * brand_id '' del runtime se guarda como NULL en producción.
-- * Los secretos de sorteos se escriben en sponsor_sweepstake_secrets y se
--   excluyen de las columnas públicas (number_rule/word_rule/comment_rule).
-- * El sorteo se ejecuta con public.sponsor_draw_sweepstake(uuid): semilla
--   aleatoria, orden SHA-256 verificable, premios por posición y auditoría.
-- * Los puntos se otorgan exclusivamente por triggers, con deduplicación y
--   topes diarios; nunca se aceptan puntos enviados por el cliente.
-- * Los aportes nacen pendientes, solo la organización los verifica y la
--   recaudación se recalcula siempre desde aportes verificados.
-- ==============================================================================
