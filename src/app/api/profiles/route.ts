import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { resolveIpfsUrl } from '@/lib/media-utils';
import { normalizeDisciplines } from '@/lib/disciplines';
import { isUUID } from '@/lib/profile-server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_STORE = { 'Cache-Control': 'no-store, no-cache, must-revalidate' };

function bearerToken(req: NextRequest): string {
  const header = req.headers.get('authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : '';
}

function safeUrl(value: unknown, allowEmojiOrAsset = false): string | null {
  if (value === undefined || value === null || value === '') return '';
  if (typeof value !== 'string') return null;
  const raw = value.trim();
  if (!raw) return '';
  if (allowEmojiOrAsset && (raw.startsWith('emoji:') || raw.startsWith('/'))) {
    return raw;
  }
  const resolved = allowEmojiOrAsset ? resolveIpfsUrl(raw) : raw;
  try {
    const url = new URL(resolved);
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}

function mapCommunityProfile(row: any) {
  return {
    id: String(row.id),
    username: row.username,
    full_name: row.full_name,
    bio: row.bio || '',
    avatar_url: row.avatar_url || '',
    banner_url: row.banner_url || '',
    location: row.location || '',
    website: row.website || '',
    portfolio_url: row.portfolio_url || '',
    artistic_disciplines: row.artistic_disciplines || '',
    disciplines: Array.isArray(row.disciplines) ? row.disciplines : [],
    sponsorship_available: Boolean(row.sponsorship_available),
    sponsorship_terms_accepted_at: row.sponsorship_terms_accepted_at || undefined,
    sponsorship_experience: row.sponsorship_experience || '',
    sponsorship_modalities: Array.isArray(row.sponsorship_modalities)
      ? row.sponsorship_modalities
      : [],
    sponsorship_travel: Boolean(row.sponsorship_travel),
    sponsorship_contact_email: row.sponsorship_contact_email || '',
    sponsorship_portfolio_url: row.sponsorship_portfolio_url || '',
    role: 'user',
    is_banned: false,
    is_custom: true,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function GET() {
  try {
    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let community: any[] = [];
    try {
      const { data } = await supabaseAdmin
        .from('community_profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(300);
      community = (data || []).map(mapCommunityProfile);
    } catch {
      // La tabla llega con la migración de persistencia. Sin ella seguimos
      // devolviendo los perfiles normales de Supabase.
    }

    const byUsername = new Set(
      (community as any[]).map((p) => String(p.username || '').toLowerCase())
    );
    const merged = [
      ...(profiles || []).filter(
        (p) => !byUsername.has(String(p.username || '').toLowerCase())
      ),
      ...community,
    ];

    return NextResponse.json({ profiles: merged }, { headers: NO_STORE });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const id = String(body?.id || '');
    if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 });

    // ── Campos permitidos ────────────────────────────────────────────────
    // role, is_banned, verified_artist y wallet_addresses NO se aceptan desde
    // el cliente para evitar escaladas de privilegios.
    const avatar = safeUrl(body.avatar_url, true);
    const banner = safeUrl(body.banner_url, true);
    const website = safeUrl(body.website);
    const portfolio = safeUrl(body.portfolio_url);
    const sponsorshipPortfolio = safeUrl(body.sponsorship_portfolio_url);

    if (avatar === null) {
      return NextResponse.json({ error: 'La URL del avatar no es válida.' }, { status: 400 });
    }
    if (banner === null) {
      return NextResponse.json({ error: 'La URL de la portada no es válida.' }, { status: 400 });
    }
    if (website === null || portfolio === null || sponsorshipPortfolio === null) {
      return NextResponse.json({ error: 'Uno de los enlaces no es una URL válida.' }, { status: 400 });
    }

    const payload: Record<string, any> = {
      full_name:
        typeof body.full_name === 'string' ? body.full_name.trim().slice(0, 120) : undefined,
      bio: typeof body.bio === 'string' ? body.bio.slice(0, 2000) : undefined,
      avatar_url: avatar === '' ? null : avatar,
      banner_url: banner === '' ? null : banner,
      location: typeof body.location === 'string' ? body.location.slice(0, 160) : undefined,
      website: website === '' ? null : website,
      portfolio_url: portfolio === '' ? null : portfolio,
      artistic_disciplines:
        typeof body.artistic_disciplines === 'string'
          ? body.artistic_disciplines.slice(0, 240)
          : undefined,
      disciplines: Array.isArray(body.disciplines)
        ? normalizeDisciplines(body.disciplines)
        : undefined,
      sponsorship_available:
        typeof body.sponsorship_available === 'boolean'
          ? body.sponsorship_available
          : undefined,
      sponsorship_terms_accepted_at:
        typeof body.sponsorship_terms_accepted_at === 'string'
          ? body.sponsorship_terms_accepted_at
          : undefined,
      sponsorship_experience:
        typeof body.sponsorship_experience === 'string'
          ? body.sponsorship_experience.slice(0, 2000)
          : undefined,
      sponsorship_modalities: Array.isArray(body.sponsorship_modalities)
        ? body.sponsorship_modalities.map(String).slice(0, 10)
        : undefined,
      sponsorship_travel:
        typeof body.sponsorship_travel === 'boolean' ? body.sponsorship_travel : undefined,
      sponsorship_contact_email:
        typeof body.sponsorship_contact_email === 'string'
          ? body.sponsorship_contact_email.trim().slice(0, 160)
          : undefined,
      sponsorship_portfolio_url:
        sponsorshipPortfolio === '' ? null : sponsorshipPortfolio,
      updated_at: new Date().toISOString(),
    };

    Object.keys(payload).forEach((key) => {
      if (payload[key] === undefined) delete payload[key];
    });

    // ── Perfil de Supabase Auth ──────────────────────────────────────────
    if (isUUID(id)) {
      const token = bearerToken(req);
      if (!token) {
        return NextResponse.json(
          { error: 'Necesitás iniciar sesión para guardar tu perfil.' },
          { status: 401 }
        );
      }

      const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
      if (authError || !authData.user) {
        return NextResponse.json({ error: 'Sesión inválida o vencida.' }, { status: 401 });
      }

      const { data: currentProfile } = await supabaseAdmin
        .from('profiles')
        .select('role, is_banned')
        .eq('id', id)
        .maybeSingle();

      if (authData.user.id !== id) {
        if (!currentProfile || !['admin', 'super_admin'].includes(currentProfile.role)) {
          return NextResponse.json({ error: 'No podés editar otro perfil.' }, { status: 403 });
        }
      }
      if (currentProfile?.is_banned) {
        return NextResponse.json({ error: 'Tu cuenta está suspendida.' }, { status: 403 });
      }

      let { data, error } = await supabaseAdmin
        .from('profiles')
        .update(payload)
        .eq('id', id)
        .select()
        .maybeSingle();

      // Compatibilidad: si la migración de disciplinas/patrocinio todavía no
      // está aplicada, reintentamos con las columnas que ya existen para que
      // al menos el avatar y la portada no dejen de persistir.
      if (error && /column|schema cache/i.test(error.message || '')) {
        const legacy = { ...payload };
        delete legacy.disciplines;
        for (const key of Object.keys(legacy)) {
          if (key.startsWith('sponsorship_')) delete legacy[key];
        }
        const retry = await supabaseAdmin
          .from('profiles')
          .update(legacy)
          .eq('id', id)
          .select()
          .maybeSingle();
        data = retry.data;
        error = retry.error;
      }

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      if (!data) {
        return NextResponse.json({ error: 'No encontramos tu perfil.' }, { status: 404 });
      }

      await propagateSnapshot(id, data.username, data);
      return NextResponse.json({ success: true, profile: data }, { headers: NO_STORE });
    }

    // ── Perfiles locales (cuentas Larvaz sin Supabase Auth) ───────────────
    // Se guardan en community_profiles para que el avatar, la bio y las
    // disciplinas persistan y los vea el resto de la comunidad.
    const username =
      typeof body.username === 'string' ? body.username.trim().toLowerCase() : '';
    if (!username) {
      return NextResponse.json({ error: 'username requerido' }, { status: 400 });
    }

    const row = {
      id,
      username,
      full_name: payload.full_name || username,
      bio: payload.bio || '',
      avatar_url: payload.avatar_url || '',
      banner_url: payload.banner_url || '',
      location: payload.location || '',
      website: payload.website || '',
      portfolio_url: payload.portfolio_url || '',
      artistic_disciplines: payload.artistic_disciplines || '',
      disciplines: payload.disciplines || [],
      sponsorship_available: Boolean(body.sponsorship_available),
      sponsorship_terms_accepted_at: payload.sponsorship_terms_accepted_at || null,
      sponsorship_experience: payload.sponsorship_experience || '',
      sponsorship_modalities: payload.sponsorship_modalities || [],
      sponsorship_travel: Boolean(body.sponsorship_travel),
      sponsorship_contact_email: payload.sponsorship_contact_email || '',
      sponsorship_portfolio_url: payload.sponsorship_portfolio_url || '',
      created_at: typeof body.created_at === 'string' ? body.created_at : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('community_profiles')
      .upsert(row, { onConflict: 'id' })
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        {
          error:
            'No se pudo guardar el perfil comunitario. Verificá que la migración de persistencia esté aplicada.',
          detail: error.message,
        },
        { status: 500 }
      );
    }

    await propagateSnapshot(id, username, row);
    return NextResponse.json(
      { success: true, profile: data ? mapCommunityProfile(data) : mapCommunityProfile(row) },
      { headers: NO_STORE }
    );
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}

/**
 * Mantiene coherentes el avatar/nombre de las publicaciones y comentarios ya
 * publicados. Se ejecuta del lado servidor (service role) y falla en silencio:
 * el perfil ya quedó guardado y no queremos romper la respuesta por esto.
 */
async function propagateSnapshot(id: string, username: string, profile: any) {
  if (!username) return;
  try {
    const { data: metas } = await supabaseAdmin
      .from('post_metadata')
      .select('id, post_id, raw_metadata')
      .limit(300);

    for (const meta of metas || []) {
      const raw = (meta as any).raw_metadata;
      const author = raw?.author;
      if (!author) continue;
      const matches =
        author.id === id ||
        String(author.username || '').toLowerCase() === String(username).toLowerCase();
      if (!matches) continue;

      const nextRaw = {
        ...raw,
        author: {
          ...author,
          full_name: profile.full_name || author.full_name,
          avatar_url: profile.avatar_url || author.avatar_url,
          location: profile.location || author.location,
          artistic_disciplines:
            profile.artistic_disciplines || author.artistic_disciplines,
          disciplines: profile.disciplines || author.disciplines,
        },
      };
      await supabaseAdmin
        .from('post_metadata')
        .update({ raw_metadata: nextRaw })
        .eq('id', (meta as any).id);
    }

    const { data: comments } = await supabaseAdmin
      .from('comments')
      .select('id, author_snapshot')
      .limit(500);

    for (const comment of comments || []) {
      const snapshot = (comment as any).author_snapshot;
      if (!snapshot) continue;
      const matches =
        snapshot.id === id ||
        String(snapshot.username || '').toLowerCase() === String(username).toLowerCase();
      if (!matches) continue;

      await supabaseAdmin
        .from('comments')
        .update({
          author_snapshot: {
            ...snapshot,
            full_name: profile.full_name || snapshot.full_name,
            avatar_url: profile.avatar_url || snapshot.avatar_url,
            location: profile.location || snapshot.location,
            artistic_disciplines:
              profile.artistic_disciplines || snapshot.artistic_disciplines,
            disciplines: profile.disciplines || snapshot.disciplines,
          },
        })
        .eq('id', (comment as any).id);
    }
  } catch {
    // La propagación es best-effort.
  }
}
