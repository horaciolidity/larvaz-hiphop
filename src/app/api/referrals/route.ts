import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const PROPS_PER_REFERRAL = 50;

function isUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function cleanUsername(value?: string | null): string {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/^@/, '')
    .replace(/^larvaz-/, '');
}

/**
 * Busca al referrer por @usuario o por código "larvaz-usuario".
 * La tabla remota de profiles no tiene columnas de referidos, por eso
 * usamos la tabla notifications como fuente de verdad.
 */
async function findProfileByCode(code?: string | null) {
  const username = cleanUsername(code);
  if (!username) return null;

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .ilike('username', username)
    .maybeSingle();

  if (error) {
    console.warn('[API /referrals] Error buscando perfil:', error.message);
    return null;
  }
  return data || null;
}

async function countReferrals(referrerId: string) {
  const { count } = await supabaseAdmin
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', referrerId)
    .eq('type', 'mention')
    .is('post_id', null);

  return count || 0;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const referrer = await findProfileByCode(searchParams.get('username'));

    if (!referrer) {
      return NextResponse.json({ referredUsers: [], count: 0, props: 0 });
    }

    const { data: rows, error } = await supabaseAdmin
      .from('notifications')
      .select('id, actor_id, created_at')
      .eq('user_id', referrer.id)
      .eq('type', 'mention')
      .is('post_id', null)
      .order('created_at', { ascending: false })
      .limit(300);

    if (error) {
      console.warn('[API /referrals] Error leyendo notificaciones:', error.message);
      return NextResponse.json({ referredUsers: [], count: 0, props: 0 });
    }

    const actorIds = Array.from(
      new Set((rows || []).map((row: any) => row.actor_id).filter(Boolean))
    );

    let profiles: any[] = [];
    if (actorIds.length > 0) {
      const { data: profileRows } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .in('id', actorIds);
      profiles = profileRows || [];
    }

    const profileMap = new Map(profiles.map((p) => [p.id, p]));
    const referredUsers = (rows || [])
      .map((row: any) => {
        const profile = profileMap.get(row.actor_id);
        if (!profile) return null;
        return { ...profile, referred_at: row.created_at };
      })
      .filter(Boolean);

    const count = await countReferrals(referrer.id);

    return NextResponse.json(
      {
        referredUsers,
        count,
        props: count * PROPS_PER_REFERRAL,
        referrer: {
          id: referrer.id,
          username: referrer.username,
          full_name: referrer.full_name,
        },
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { referredUsers: [], count: 0, props: 0, error: String(err?.message || err) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const referrer = await findProfileByCode(
      body?.referrer || body?.referrer_username || body?.code
    );

    if (!referrer) {
      return NextResponse.json(
        { success: false, error: 'Código de referido no encontrado' },
        { status: 404 }
      );
    }

    const referredId = String(body?.referred_id || '').trim();
    const referredUsername = cleanUsername(body?.referred_username);
    const referredName = String(body?.referred_name || '').trim();
    const referredAvatar = String(body?.referred_avatar || '').trim();

    let referred: any = null;

    if (referredId && isUUID(referredId)) {
      const { data } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', referredId)
        .maybeSingle();
      referred = data || null;
    }

    if (!referred && referredUsername) {
      const { data } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .ilike('username', referredUsername)
        .maybeSingle();
      referred = data || null;
    }

    // Si el perfil todavía no existe (registro recién creado), lo creamos mínimo.
    if (!referred && referredId && isUUID(referredId) && referredUsername) {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .upsert(
          {
            id: referredId,
            username: referredUsername,
            full_name: referredName || referredUsername,
            avatar_url: referredAvatar,
            role: 'user',
            is_banned: false,
            created_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        )
        .select('*')
        .maybeSingle();

      if (!error) referred = data || null;
    }

    if (!referred) {
      return NextResponse.json(
        { success: false, error: 'No se pudo identificar al nuevo miembro' },
        { status: 404 }
      );
    }

    if (
      referred.id === referrer.id ||
      String(referred.username || '').toLowerCase() ===
        String(referrer.username || '').toLowerCase()
    ) {
      return NextResponse.json(
        { success: false, error: 'No podés referirte a vos mismo' },
        { status: 400 }
      );
    }

    const { data: existing } = await supabaseAdmin
      .from('notifications')
      .select('id')
      .eq('user_id', referrer.id)
      .eq('actor_id', referred.id)
      .eq('type', 'mention')
      .is('post_id', null)
      .limit(1)
      .maybeSingle();

    if (!existing) {
      const { error: insertError } = await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: referrer.id,
          actor_id: referred.id,
          type: 'mention',
          post_id: null,
          read: false,
          created_at: new Date().toISOString(),
        });

      if (insertError) {
        console.warn('[API /referrals] No se pudo registrar el referido:', insertError.message);
        return NextResponse.json(
          { success: false, error: insertError.message },
          { status: 500 }
        );
      }
    }

    const count = await countReferrals(referrer.id);

    return NextResponse.json({
      success: true,
      duplicate: Boolean(existing),
      count,
      props: count * PROPS_PER_REFERRAL,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: String(err?.message || err) },
      { status: 500 }
    );
  }
}
