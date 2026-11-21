-- ==============================================================================
-- LARVAZ HIP-HOP — Persistencia de comunidad
-- 1) Los comentarios dejan de depender de un UUID de posts: ahora pueden vivir
--    en publicaciones de demo y en publicaciones comunitarias.
-- 2) Cada comentario guarda un snapshot del autor (nombre/avatar/disciplinas)
--    para que las cuentas locales también se vean igual para todos.
-- 3) Los perfiles guardan las ramas elegidas y los datos de patrocinio.
-- 4) Los perfiles locales (sin Supabase Auth) se guardan en community_profiles
--    para que avatar, bio y disciplinas persistan entre dispositivos.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. COMENTARIOS: post_id TEXT + snapshot del autor
-- ------------------------------------------------------------------------------
ALTER TABLE public.comments DROP CONSTRAINT IF EXISTS comments_post_id_fkey;
ALTER TABLE public.comments ALTER COLUMN post_id TYPE TEXT USING post_id::text;
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS author_snapshot JSONB;

CREATE INDEX IF NOT EXISTS idx_comments_post_id_text ON public.comments(post_id);

-- El trigger original comparaba uuid = uuid. Al pasar post_id a TEXT hay que
-- castear para que siga funcionando con publicaciones reales y de demo.
CREATE OR REPLACE FUNCTION public.update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.posts
        SET comments_count = comments_count + 1
        WHERE id::text = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.posts
        SET comments_count = GREATEST(0, comments_count - 1)
        WHERE id::text = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_post_comments ON public.comments;
CREATE TRIGGER trg_update_post_comments
AFTER INSERT OR DELETE ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.update_post_comments_count();

-- ------------------------------------------------------------------------------
-- 2. PERFILES: ramas del hip-hop + datos de patrocinio
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS disciplines TEXT[] DEFAULT ARRAY[]::TEXT[],
    ADD COLUMN IF NOT EXISTS sponsorship_available BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS sponsorship_terms_accepted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS sponsorship_experience TEXT,
    ADD COLUMN IF NOT EXISTS sponsorship_modalities TEXT[] DEFAULT ARRAY[]::TEXT[],
    ADD COLUMN IF NOT EXISTS sponsorship_travel BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS sponsorship_contact_email TEXT,
    ADD COLUMN IF NOT EXISTS sponsorship_portfolio_url TEXT;

-- ------------------------------------------------------------------------------
-- 3. PERFILES LOCALES (cuentas sin Supabase Auth)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.community_profiles (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    banner_url TEXT,
    location TEXT,
    website TEXT,
    portfolio_url TEXT,
    artistic_disciplines TEXT,
    disciplines TEXT[] DEFAULT ARRAY[]::TEXT[],
    sponsorship_available BOOLEAN DEFAULT FALSE,
    sponsorship_terms_accepted_at TIMESTAMPTZ,
    sponsorship_experience TEXT,
    sponsorship_modalities TEXT[] DEFAULT ARRAY[]::TEXT[],
    sponsorship_travel BOOLEAN DEFAULT FALSE,
    sponsorship_contact_email TEXT,
    sponsorship_portfolio_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_community_profiles_username
    ON public.community_profiles (LOWER(username));

ALTER TABLE public.community_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Community profiles are viewable by everyone" ON public.community_profiles;
CREATE POLICY "Community profiles are viewable by everyone"
    ON public.community_profiles FOR SELECT USING (TRUE);

-- Las escrituras se hacen exclusivamente desde las API routes con service_role.
-- No se crean políticas de INSERT/UPDATE/DELETE para evitar escrituras directas
-- desde el navegador.

-- ------------------------------------------------------------------------------
-- 4. Compatibilidad: completar disciplines desde el texto libre existente
-- ------------------------------------------------------------------------------
UPDATE public.profiles p
SET disciplines = COALESCE(sub.arr, ARRAY[]::TEXT[])
FROM (
    SELECT pr.id,
           ARRAY_AGG(DISTINCT v.d) FILTER (WHERE v.d IS NOT NULL) AS arr
    FROM public.profiles pr
    CROSS JOIN LATERAL (
        VALUES
            (CASE WHEN pr.artistic_disciplines ~* '\m(mc|rap|freestyle)\M' THEN 'mc' END),
            (CASE WHEN pr.artistic_disciplines ~* '\m(dj|turntablism|scratch)\M' THEN 'dj' END),
            (CASE WHEN pr.artistic_disciplines ~* '\m(graffiti|grafiti|mural|spray)\M' THEN 'graffiti' END),
            (CASE WHEN pr.artistic_disciplines ~* '\m(breaking|breakdance|bboy|bgirl|b-boy|b-girl)\M' THEN 'breaking' END)
    ) AS v(d)
    GROUP BY pr.id
) sub
WHERE p.id = sub.id
  AND (p.disciplines IS NULL OR cardinality(p.disciplines) = 0)
  AND p.artistic_disciplines IS NOT NULL;
